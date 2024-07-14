#usage : python main.py [video_dir] [json_dir] [min_scene_length_seconds] [output_clips_folder] [plus_time]
# 不重疊並增[plus_time]秒

from scenedetect import SceneManager, open_video, AdaptiveDetector ,split_video_ffmpeg ,ContentDetector , ThresholdDetector, FrameTimecode
# from scenedetect.scene_manager import save_images
from sys import argv
from json import dump
from moviepy.editor import VideoFileClip
from scenedetect.stats_manager import StatsManager
from datetime import datetime,timedelta

# 第一個參數是腳本名稱本身
# 從第二個參數開始是用戶提供的參數
script_name = argv[0]
arguments = argv[1:]

input_video_path = arguments[0] #"D:\\meowVue\\pySceneDetect\\vid\orig\\net.mp4"
output_json_path = arguments[1]
min_scene_length_seconds = int(arguments[2])
output_videos_path = arguments[3]
plus_time = int(arguments[4])

clip = VideoFileClip(input_video_path)
fps = clip.fps
# print("FPS:", fps)

class CustomAdaptiveDetector(AdaptiveDetector):
    def __init__(self, min_scene_len):
        super().__init__(min_scene_len=min_scene_len)
        
class CustomContentDetector(ContentDetector):
    def __init__(self, min_scene_len):
        super().__init__(min_scene_len=min_scene_len,threshold= 27.0)

class CustomThresholdDetector(ThresholdDetector):
    def __init__(self, min_scene_len):
        super().__init__(min_scene_len=min_scene_len,threshold= 27.0)

def find_scenes(video_path):
    video = open_video(video_path)
    scene_manager = SceneManager(stats_manager=StatsManager())
    dt = CustomAdaptiveDetector(min_scene_len=0) # 該法為0，因為我們要自己控制
    scene_manager.add_detector(dt)
    scene_manager.detect_scenes(video)
    stats_manager = scene_manager.stats_manager
    # print(stats_manager.get_metrics(100,["content_val"])) # 獲取第100(101)幀的 content_val
    # stats_manager.save_to_csv('D:\\meowVue\\pySceneDetect\\vid\\test.csv') # 將統計資訊(每frame資料)寫入 csv 檔案
    
    return scene_manager.get_scene_list()

def save_scenes_to_json(scene_list, output_file):
    outer_dict = {}
    for i, scene in enumerate(scene_list): # 只取到倒數第二個
        inner_dict = {}
        inner_dict['scene-start-time'] = scene[0].get_timecode()
        inner_dict['scene-end-time'] = scene[1].get_timecode()
        inner_dict['AD-start-time'] = scene[0].get_timecode()
        inner_dict['AD-content'] = ["", "", "", ""]
        inner_dict['AD-content-ID'] = 0
        outer_dict[f"AD{i+1:03d}"] = inner_dict
    with open(output_file, "w") as json_file:
        dump(outer_dict, json_file, indent=4)

def modify_scenelist_endtime_plus_n(scene_list,min_time=0,plus_second=0):
    ret_scene_list = []
    # print("scene_list:",scene_list)
    time_format = "%H:%M:%S.%f"
    stamp = datetime.strptime("00:00:00.000", time_format)
    video_end_time = datetime.strptime(scene_list[-1][1].get_timecode(), time_format)
    for i, scene in enumerate(scene_list):
        end_time_obj = datetime.strptime(scene[1].get_timecode(), time_format)
        start_delta = timedelta(hours=stamp.hour, minutes=stamp.minute, seconds=stamp.second, microseconds=stamp.microsecond)
        end_delta = timedelta(hours=end_time_obj.hour, minutes=end_time_obj.minute, seconds=end_time_obj.second, microseconds=end_time_obj.microsecond)
        minus_delta = end_delta - start_delta # minus_delta 是一段影片的時間長度，從上一次斷點到這次end_time
        if(minus_delta.total_seconds() >= min_time or i == len(scene_list)-1): # 如果這段影片的時間長度大於等於 min_time 或是最後一段影片
            # print("minus_delta Over:",minus_delta)
            s = FrameTimecode(timecode=stamp.strftime(time_format), fps=fps)
            stamp = end_time_obj+timedelta(seconds=plus_second)
            if(stamp > video_end_time):
                stamp = end_time_obj
            print("stamp:",stamp.strftime(time_format))
            e = FrameTimecode(timecode=stamp.strftime(time_format), fps=fps)
            newTuple = (s,e)
            print("newTuple:",newTuple)
            ret_scene_list.append(newTuple)
    return ret_scene_list


try:
    scene_list = find_scenes(input_video_path)
    mod_scene_list = modify_scenelist_endtime_plus_n(scene_list,min_scene_length_seconds,plus_time)
    save_scenes_to_json(mod_scene_list, output_json_path)
    split_video_ffmpeg(input_video_path, mod_scene_list, output_dir=output_videos_path,output_file_template="AD$SCENE_NUMBER.mp4")
    print("Done")
    pass
except Exception as e:
    print("Errors occurs : ", e)