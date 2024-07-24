# usage: python haystack_gemini_video_summarize.py [video_path] [output_json_path]

from haystack_integrations.components.generators.google_vertex import VertexAIGeminiGenerator
from vertexai.generative_models import Part
from typing import List
from pydantic import BaseModel, validator
from datetime import datetime
import json
import random
import pydantic
from pydantic import ValidationError
from typing import Optional, List
from colorama import Fore
from haystack import component
import re
from haystack.components.builders import PromptBuilder
from google.cloud import storage
from haystack import Pipeline
from sys import argv, stdout

class audioDescription(BaseModel):
    time: datetime
    content: str
    @validator('time', pre=True)
    def parse_time(cls, value):
        return datetime.strptime(value, "%H:%M:%S.%f")

class audioDescriptionList(BaseModel):
    audioDescriptionList: List[audioDescription]


json_schema = audioDescriptionList.schema_json(indent=2)



@component
class OutputValidator:
    def __init__(self, pydantic_model: pydantic.BaseModel):
        self.pydantic_model = pydantic_model
        self.iteration_counter = 0

    # Define the component output
    @component.output_types(valid_replies=List[str], invalid_replies=Optional[List[str]], error_message=Optional[str])
    def run(self, replies: List[str]):
        self.iteration_counter += 1

        # Try to parse the LLM's reply
        try:
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', replies[0])
            if json_match is None:
                json_match = re.search(r'```python\s*([\s\S]*?)\s*```', replies[0])
                if json_match is None:
                    raise ValueError("No JSON block found in the LLM's reply")
            
            output_dict = json.loads(json_match.group(1))
            replies[0] = json_match.group(1)
            self.pydantic_model.parse_obj(output_dict)
            
            # print(
            #     Fore.GREEN
            #     + f"OutputValidator at Iteration {self.iteration_counter}: Valid JSON from LLM - No need for looping: {replies[0]}"
            # )
            return {"valid_replies": replies}

        # Handle invalid JSON or other errors
        except (ValueError, ValidationError) as e:
            # print(
            #     Fore.RED
            #     + f"OutputValidator at Iteration {self.iteration_counter}: Invalid JSON from LLM - Let's try again.\n"
            #     f"Output from LLM:\n {replies[0]} \n"
            #     f"Error from OutputValidator: {e}"
            # )
            return {"invalid_replies": replies, "error_message": str(e)}

output_validator = OutputValidator(pydantic_model=audioDescriptionList)



prompt_template = """
你是專業的口述影像搞生成器，參考以下影片
僅依照提供的資料，創建一個口述影像腳本JSON文件，儘量貼近原作品再現的原則，著重於劇情相關的畫面描述。無須描述對話，其中包含一個audioDescriptions列表，每個audioDescriptions對象包含一個時間戳(hh:mm:ss.ms)和繁體中文口述影像。時間戳應該是一個日期時間對象，內容應該是一個字符串。例如：
{{schema}}
僅使用提供的資料，不要添加任何其他資訊並確保您的答案符合格式要求，確保回覆是dict類型。
{% if invalid_replies and error_message %}
您已經在先前的嘗試中建立了以下輸出：{{invalid_replies}}
但是，這不符合上面的格式要求並觸發了此 Python 異常：{{error_message}}
更正輸出並重試。只需返回正確的輸出，無需任何額外的解釋。
{% endif %}
"""

prompt_builder = PromptBuilder(template=prompt_template)


@component
class AddVideo2Prompt:
    # [
    #     Part.from_uri(
    #         "gs://gemini-ad-gen/AD001.mp4", mime_type="video/mp4"
    #     ),
    #     prompt
    # ]
    def __init__(self, prompt: str):
        self.prompt = prompt

    @component.output_types(prompt=list)
    def run(self, uri: str, prompt: str):
        return {"prompt": [Part.from_uri(uri, mime_type="video/mp4"),prompt]}

add_video_2_prompt = AddVideo2Prompt(prompt=prompt_builder)

@component
class GeminiGenerator:
    def __init__(self, project_id, location, model):
        self.project_id = project_id
        self.location = location
        self.model = model
    
    @component.output_types(replies=List[str])
    def run(self, prompt: List):
        generator = VertexAIGeminiGenerator(project_id=self.project_id, location=self.location, model=self.model)
        return {"replies": generator.run(prompt)["replies"]}

gemini_generator = GeminiGenerator(project_id="gemini-rain-py", location="us-central1", model="gemini-1.5-pro-preview-0514")

@component
class upload2GCS:
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name

    @component.output_types(uri=str)
    def run(self, file_path: str):
        storage_client = storage.Client()
        bucket = storage_client.bucket(self.bucket_name)
        file_name = file_path.split("/")[-1]
        blob = bucket.blob(file_name)
        blob.upload_from_filename(file_path)
        return {"uri": f"gs://{self.bucket_name}/{file_name}"}
    


upload2gcs = upload2GCS(bucket_name="gemini-ad-gen")


pipeline = Pipeline(max_loops_allowed=5)

# Add components to your pipeline
# pipeline.add_component(instance=prompt_builder, name="prompt_builder")
pipeline.add_component(instance=upload2gcs, name="upload2gcs")
pipeline.add_component(instance=prompt_builder, name="prompt_builder")
pipeline.add_component(instance=add_video_2_prompt, name="add_video")
pipeline.add_component(instance=gemini_generator, name="llm")
pipeline.add_component(instance=output_validator, name="output_validator")

# Now, connect the components to each other
# pipeline.connect("prompt_builder", "add_video")
pipeline.connect("upload2gcs", "add_video")
pipeline.connect("prompt_builder", "add_video")
pipeline.connect("add_video.prompt", "llm")
# pipeline.connect("prompt_builder", "llm")
pipeline.connect("llm", "output_validator")
# # If a component has more than one output or input, explicitly specify the connections:
pipeline.connect("output_validator.invalid_replies", "prompt_builder.invalid_replies")
pipeline.connect("output_validator.error_message", "prompt_builder.error_message")


path = argv[1]
output_path = argv[2]
result = pipeline.run({
    "upload2gcs": { "file_path": path},
    "prompt_builder": {"schema": json_schema}
})

valid_reply = result["output_validator"]["valid_replies"][0]
valid_json = json.loads(valid_reply)

with open(output_path , "w") as f:
    json.dump(valid_json, f, indent=2)




