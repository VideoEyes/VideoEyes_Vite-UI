#usage : python main.py [video_dir] [json_dir] 

import csv
from scenedetect import SceneManager, open_video, AdaptiveDetector #ContentDetector , ThresholdDetector
from scenedetect.scene_manager import save_images
import sys
from datetime import datetime
import json

# 第一個參數是腳本名稱本身
# 從第二個參數開始是用戶提供的參數
script_name = sys.argv[0]
arguments = sys.argv[1:]

# find_scenes 函式會回傳一個影片中的所有場景(list of tuple containing start and end timecode in class [Timecode])
def find_scenes(video_path, threshold=12.0):
    video = open_video(video_path)
    scene_manager = SceneManager()
    scene_manager.add_detector(
        AdaptiveDetector())
    # Detect all scenes in video from current position to end.
    scene_manager.detect_scenes(video)
    # `get_scene_list` returns a list of start/end timecode pairs
    # for each scene that was found.
    return scene_manager.get_scene_list()

# 將場景資訊寫入 csv 檔案
def save_scenes_to_csv(scene_list, output_file):
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Scene', 'Start Time', 'End Time'])
        for i, scene in enumerate(scene_list):
            writer.writerow([i+1, scene[0], scene[1]])

def save_scenes_to_json(scene_list, output_file):
    outer_dict = {}
    for i, scene in enumerate(scene_list):
        inner_dict = {}
        inner_dict['scene-start-time'] = scene[0].get_timecode()
        inner_dict['scene-end-time'] = scene[1].get_timecode()
        inner_dict['AD-start-time'] = scene[0].get_timecode()
        inner_dict['AD-content'] = ["", "", "", ""]
        inner_dict['AD-content-ID'] = 0
        outer_dict[i] = inner_dict
    with open(output_file, "w") as json_file:
        json.dump(outer_dict, json_file, indent=4)

input_video_path = arguments[0] #"D:\\meowVue\\pySceneDetect\\vid\orig\\net.mp4"
output_json_path = arguments[1]

try:
    scene_list = find_scenes(input_video_path)
    save_scenes_to_json(scene_list, output_json_path)
    # video = open_video(videoPath)
    # save_images(scene_list, video, output_dir=output_dir, num_images=1)
    print("Done")
    pass
except Exception as e:
    print("Errors occurs : ", e)