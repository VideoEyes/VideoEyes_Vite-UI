#%%
from vertexai.generative_models import Part, SafetySetting, HarmCategory, HarmBlockThreshold
import pandas as pd
from haystack_integrations.components.generators.google_vertex import VertexAIGeminiGenerator
from vertexai.generative_models import Part
import json
import random
import pydantic
from pydantic import ValidationError
from typing import Optional, List
from colorama import Fore
from haystack import component
import re
from haystack.components.builders import PromptBuilder
from haystack import Pipeline
import numpy as np
import json

prompt_template = """
Video Summary:
{{ summary[0] }}

Select the best answer to the following multiple-choice question based on the video. Respond with only the letter (A, B, C, or D) of the correct option. 
{{ question }}
The best answer is:
"""

prompt_builder = PromptBuilder(template=prompt_template)

summary_template = """
Summarize the following video using who, what, when, where, what, how, why
"""

summary_prompt_builder = PromptBuilder(template=summary_template)

@component
class AddVideo2Prompt:
    # [
    #     Part.from_uri(
    #         "gs://gemini-ad-gen/AD001.mp4", mime_type="video/mp4"
    #     ),
    #     prompt
    # ]

    @component.output_types(prompt=list)
    def run(self, uri: str, prompt: str):
        return {"prompt": [Part.from_uri(uri, mime_type="video/mp4"),prompt]}



add_video_2_prompt = AddVideo2Prompt()


add_video_2_summary_prompt = AddVideo2Prompt()

@component
class GeminiGenerator:
    def __init__(self, project_id, location, model):
        self.project_id = project_id
        self.location = location
        self.model = model
    
    # @component.output_types(replies=List[str])
    # def run(self, prompt: List):
    #     generator = VertexAIGeminiGenerator(project_id=self.project_id, location=self.location, model=self.model)
    #     return {"replies": generator.run(prompt)["replies"]}
    @component.output_types(replies=List[str])
    def run(self, prompt: List):
        safety_config = [
            SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_UNSPECIFIED, threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
        ]
        generator = VertexAIGeminiGenerator(project_id=self.project_id, location=self.location, model=self.model, safety_settings=safety_config)
        return {"replies": generator.run(prompt)["replies"]}

gemini_generator = GeminiGenerator(project_id="gemini-rain-py", location="us-central1", model="gemini-1.5-flash-001")
# gemini-1.5-pro-preview-0514

summary_gemini_generator = GeminiGenerator(project_id="gemini-rain-py", location="us-central1", model="gemini-1.5-flash-001")


from google.cloud import storage
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
pipeline.add_component(instance=upload2gcs, name="upload2gcs")
pipeline.add_component(instance=summary_prompt_builder, name="summary_prompt_builder")
pipeline.add_component(instance=add_video_2_summary_prompt, name="add_video_2_summary_prompt")
pipeline.add_component(instance=summary_gemini_generator, name="summary_generator")
pipeline.add_component(instance=prompt_builder, name="prompt_builder")
pipeline.add_component(instance=add_video_2_prompt, name="add_video")
pipeline.add_component(instance=gemini_generator, name="llm")

# Now, connect the components to each other
pipeline.connect("upload2gcs", "add_video")
pipeline.connect("upload2gcs", "add_video_2_summary_prompt")
pipeline.connect("summary_prompt_builder", "add_video_2_summary_prompt")
pipeline.connect("add_video_2_summary_prompt", "summary_generator")
pipeline.connect("summary_generator", "prompt_builder.summary")
pipeline.connect("prompt_builder", "add_video")
pipeline.connect("add_video.prompt", "llm")

#%%
df = pd.read_parquet("hf://datasets/lmms-lab/Video-MME/videomme/test-00000-of-00001.parquet")
# video_id = df[df['duration'] == 'short']['video_id'].unique()
# video_id = [136,194,266,278] #104

video_id = [f"{i:03}" for i in range(362,601)]
# print(video_id)
# video_id = ['007']
output = []

#missing 29

for id in video_id:
    output.clear()
    print(id)
    path = f"./data/{df[df['video_id'] == id]['videoID'].unique()[0]}.mp4"
    print(path)
    video_dict = {
        "video_id": "",
        "duration": "",
        "domain": "",
        "sub_category": "",
        "questions": []
    }
    video_dict["video_id"] = id
    video_dict["duration"] = df[df['video_id'] == id]['duration'].unique()[0]
    video_dict["domain"] = df[df['video_id'] == id]['domain'].unique()[0]
    video_dict["sub_category"] = df[df['video_id'] == id]['sub_category'].unique()[0]
    questions = df[df['video_id'] == id][['question_id',"task_type",'question',"options","answer"]]
    for index, row in questions.iterrows():
        question_dict = {
            "question_id": "",
            "task_type": "",
            "question": "",
            "options": [],
            "answer": "",
            "response": ""
        }
        question_dict["question_id"] = row['question_id']
        question_dict["task_type"] = row['task_type']
        question_dict["question"] = row['question']
        question_dict["options"] = np.array(row['options']).tolist()
        question_dict["answer"] = row['answer']
        try:
            q = row['question'] + " " + "\n".join(row['options'])
            print(row['question'])
            result = pipeline.run({
                "upload2gcs": { "file_path": path},
                "prompt_builder": {"question": q},
            })
            
            print("RESULT:",result)
            
            question_dict["response"] = result['llm']['replies'][0]
            video_dict["questions"].append(question_dict)
        except Exception as e:
            print(e)
            with open('error.txt', 'a', encoding='utf-8') as file:
                text_to_append = id+"\n"
                # 將文字寫入文件
                file.write(text_to_append)
            break
    output.append(video_dict)
#字典

#轉成json字串
    file_path = "./output/questions_data("+id+").json"
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(output, file, ensure_ascii=False, indent=4)
# %%
