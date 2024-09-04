import vertexai
import pandas as pd
from vertexai.generative_models import GenerativeModel, Part
from google.cloud import storage
import json
import numpy as np
from vertexai.generative_models import (
    HarmCategory,
    HarmBlockThreshold,
    SafetySetting,
)


def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # The ID of your GCS bucket
    # bucket_name = "your-bucket-name"
    # The path to your file to upload
    # source_file_name = "local/path/to/file"
    # The ID of your GCS object
    # destination_blob_name = "storage-object-name"

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # Optional: set a generation-match precondition to avoid potential race conditions
    # and data corruptions. The request to upload is aborted if the object's
    # generation number does not match your precondition. For a destination
    # object that does not yet exist, set the if_generation_match precondition to 0.
    # If the destination object already exists in your bucket, set instead a
    # generation-match precondition using its generation number.
    generation_match_precondition = 0

    blob.upload_from_filename(source_file_name, if_generation_match=None)

    print(
        f"File {source_file_name} uploaded to {destination_blob_name}."
    )
    return f"gs://{bucket_name}/{destination_blob_name}"

def generate(model, uri, question):
    vertexai.init(project="gemini-rain-py", location="us-central1")

    model = GenerativeModel("gemini-1.5-flash-001")

    safety_config = [
        SafetySetting(
            category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH,
        ),
        SafetySetting(
            category=HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH,
        ),
        SafetySetting(
            category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH,
        ),
        SafetySetting(
            category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH,
        ),
        SafetySetting(
            category=HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH,
        ),
    ]

    response = model.generate_content(
        [
            Part.from_uri(
                uri, "video/mp4"
            ),
            question,
        ],
        safety_settings=safety_config,
    )
    print(response.text)
    return response.text

df = pd.read_parquet("hf://datasets/lmms-lab/Video-MME/videomme/test-00000-of-00001.parquet")

video_id = ['320','360','372','374','376','398','402','412','417','419','462','502','506','507','509','511','512','513','520','546','547','552','553','555','557','573','577','578','584','586','589','593','599']
output = []

for id in video_id:
    print(id)
    output.clear()
    try:
        path = f"E:/VideoMME/data/{df[df['video_id'] == id]['videoID'].unique()[0]}.mp4"
        uri = upload_blob("gemini-ad-gen", path, f"{id}.mp4")
        summarize_question = "Summarize the following video using who, what, when, where, what, how, why"
        summary = generate("gemini-1.5-flash-001", uri, summarize_question)
        print("summary: ", summary)
    except Exception as e:
        print(e)
        with open('error.txt', 'a', encoding='utf-8') as file:
            text_to_append = id+"\n"
            # 將文字寫入文件
            file.write(text_to_append)
        continue
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
            q = "Video Summary:\n"+ summary + "\nSelect the best answer to the following multiple-choice question based on the video. Respond with only the letter (A, B, C, or D) of the correct option.\n" + row['question'] + "\n" + "\n".join(row['options'])  + "\nThe best answer is:"
            print("q: ", q)
            result = generate("gemini-1.5-flash-001", uri, q)
            print("result: ", result)
            question_dict["response"] = result
            video_dict["questions"].append(question_dict)
        except Exception as e:
            print(e)
            with open('error.txt', 'a', encoding='utf-8') as file:
                text_to_append = id+"\n"
                # 將文字寫入文件
                file.write(text_to_append)
            break
    output.append(video_dict)
    file_path = "E:/VideoMME/output_medium/questions_data("+id+").json"
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(output, file, ensure_ascii=False, indent=4)