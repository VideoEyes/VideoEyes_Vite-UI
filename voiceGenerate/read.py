#usage : python read.py [input_txt_Dir] [output_file]
from sys import argv
import pyttsx3

script_name = argv[0] # script name 無需用
arguments = argv[1:] # 參數list

inputDir = arguments[0] # 第一個參數是要讀取的txt路徑
outputDir = arguments[1] # 第二個參數是要存檔的路徑

try:
    with open(inputDir, 'r', encoding='utf-8') as f:
        ad = f.read()
except:
    print('Error occured while reading ad.txt')

engine = pyttsx3.init() # 初始化引擎
engine.save_to_file(ad, outputDir) # 第二個參數是要存檔的路徑(包含檔名.mp3)
engine.runAndWait() # 開始執行並等待