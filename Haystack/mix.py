import json
from os import listdir
from os.path import isfile, isdir, join

# 指定要列出所有檔案的目錄
mypath = "E:/VideoMME/output"

# 取得所有檔案與子目錄名稱
files = listdir(mypath)
print(files)
for f in files:
    with open('merged_file.json', 'r', encoding='utf-8') as ff:
        data1 = json.load(ff)
    # 產生檔案的絕對路徑
    fullpath = join(mypath, f)
    # 判斷 fullpath 是檔案還是目錄
    if isfile(fullpath):
        print("檔案：", f)
        with open(fullpath, 'r', encoding='utf-8') as fff:
            data2 = json.load(fff)
    
    # 確認兩個文件的數據都是列表
    if isinstance(data1, list) and isinstance(data2, list):
        # 合併兩個列表
        merged_data = data1 + data2

        # 將合併後的列表寫回一個新的 JSON 文件
        with open('merged_file.json', 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=4)

        print("合併完成，結果已寫入 merged_file.json")
    else:
        print("其中一個文件的內容不是列表。")