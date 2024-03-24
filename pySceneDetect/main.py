#usage : python main.py [video_dir] [csv_dir] [output_img_dir]

import csv
from scenedetect import SceneManager, open_video, AdaptiveDetector #ContentDetector , ThresholdDetector
from scenedetect.scene_manager import save_images
import sys
script_name = sys.argv[0]
arguments = sys.argv[1:]

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

def save_scenes_to_csv(scene_list, output_file):
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Scene', 'Start Time', 'End Time'])
        for i, scene in enumerate(scene_list):
            writer.writerow([i+1, scene[0], scene[1]])

videoPath = arguments[0] #"D:\\meowVue\\pySceneDetect\\vid\orig\\net.mp4"
output_csv_dir = arguments[1]
output_dir = arguments[2]

try:
    scene_list = find_scenes(videoPath)
    save_scenes_to_csv(scene_list, output_csv_dir)
    video = open_video(videoPath)
    save_images(scene_list, video, output_dir=output_dir, num_images=1)
    print("Done")
    pass
except Exception as e:
    print("Errors occurs : ", e)

print("pySceneDetect is Over.")