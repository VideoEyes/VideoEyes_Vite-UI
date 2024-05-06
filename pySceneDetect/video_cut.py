#usage : python video_cut.py [input_video_dir] [output_video_dir] [start_time] [end_time]
#usage : python video_cut.py D:\meowVue\pySceneDetect\vid\orig\net.mp4 D:\meowVue\pySceneDetect\vid\cut\net.mp4 00:00:00.000 00:00:10.000

from moviepy.editor import VideoFileClip, concatenate_videoclips
import datetime
import sys

original_stdout = sys.stdout
original_stderr = sys.stderr
sys.stdout = open('output.log', 'w')
sys.stderr = open('error.log', 'w')

script_name = sys.argv[0]
arguments = sys.argv[1:]

# 裁減
def crop_video(input_file, output_file, start_time, end_time):
    start = datetime.datetime.strptime(start_time, '%H:%M:%S.%f')
    end = datetime.datetime.strptime(end_time, '%H:%M:%S.%f')
    start_timedelta = datetime.timedelta(hours=start.hour, minutes=start.minute, seconds=start.second, microseconds=start.microsecond)
    end_timedelta = datetime.timedelta(hours=end.hour, minutes=end.minute, seconds=end.second, microseconds=end.microsecond)
    video = VideoFileClip(input_file).subclip(start_timedelta.total_seconds(), end_timedelta.total_seconds())
    video.write_videofile(output_file)
    video.close()

# 合併
def merge_videos(input_files, output_file):
    clips = [VideoFileClip(file) for file in input_files]
    final_clip = concatenate_videoclips(clips)
    final_clip.write_videofile(output_file)
    
input_video_path = arguments[0] #"D:\\meowVue\\pySceneDetect\\vid\orig\\net.mp4"
output_video_path = arguments[1]
start_time = arguments[2]
end_time = arguments[3]

try:
    crop_video(input_video_path , output_video_path, start_time, end_time)
    sys.stdout.close()
    sys.stderr.close()
    sys.stdout = original_stdout
    sys.stderr = original_stderr
    print("Done")
    pass
except Exception as e:
    sys.stdout.close()
    sys.stderr.close()
    sys.stdout = original_stdout
    sys.stderr = original_stderr
    print("Errors occurs : ", e)