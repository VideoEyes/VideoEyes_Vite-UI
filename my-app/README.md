# my-app

An Electron application with Vue

- [pySceneDetect exe](https://drive.google.com/drive/folders/1I7mfHGPXclsQzv029n9Swrztfu00cJLn?usp=drive_link)

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

#### Work Note
##### 資料結構
* AD-clip(片段)
```
{
    1:{
        scene-start-time: Datetime, // 片段開始時間
        scene-end-time: Datetime,   // 片段結束時間
        AD-start-time: Datetime,    // 口述影像開始時間
        AD-content: string-array,   // 口述影像內容
        AD-content-ID: int(Default: 0)         // 口述影像內容ID
    },
    2:{
        scene-start-time: hh:mm:ss.ms,
        scene-end-time: hh:mm:ss.ms,
        AD-start-time: hh:mm:ss.ms,
        AD-content: ["","","",""]
        AD-content-ID: 0
    },
}
```

##### 檔案儲存位置

- Project_Name: 專案名稱
  - video
    - video.mp4
  - json
    - main.json

- 一般檔案儲存位置(常數變數: USER_DATA_PATH)
  - Windows: `C:\Users\使用者名稱\AppData\Roaming\my-app`
  - macOS: `/Users/使用者名稱/Library/Application Support/my-app`
  - Linux: `/home/使用者名稱/.config/my-app`

- 專案內容儲存位置(常數變數: PROJECT_PATH)
  - Windows: `C:\Users\使用者名稱\AppData\Roaming\my-app\Project_Name`
  - macOS: `/Users/使用者名稱/Library/Application Support/my-app/Project_Name`
  - Linux: `/home/使用者名稱/.config/my-app/Project_Name`

* video 路徑
  - Windows: `C:\Users\使用者名稱\AppData\Roaming\my-app\Project_Name\video`
  - macOS: `/Users/使用者名稱/Library/Application Support/my-app/Project_Name/video`
  - Linux: `/home/使用者名稱/.config/my-app/Project_Name/video`

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
### pySceneDetect/main
- 說明 : 切分鏡頭並輸出json檔(如上格式)與影音片段，能設置最小切分鏡頭秒數
- ~~exe檔案與範例json連結 : https://drive.google.com/drive/folders/1I7mfHGPXclsQzv029n9Swrztfu00cJLn?usp=drive_link~~
- ~~exe請放resources內~~
- python使用 : python .\main.py [輸入video位址] [輸出json位址] [最小切分鏡頭秒數] [輸出片段資料夾位址]
- ~~exe使用 : .\main.exe [video位址] [json位址]~~ 

### pySceneDetect/mainTwice
- 說明 : 切分影片並輸出json檔(如上格式)與影音片段，能設置最小切分鏡頭秒數。完成後再將各片段進行切分，不設置最小切分鏡頭秒數。
- python使用 : python .\mainTwice.py [輸入video位址] [輸出json位址] [最小切分鏡頭秒數] [輸出片段資料夾位址] [二次切分後輸出片段資料夾位址]

### pySceneDetect/main_overlap_with_n_seconds.py
- 說明 : 切分鏡頭並輸出json檔(如上格式)與影音片段，能設置最小切分鏡頭秒數，片段會重疊n秒
- python使用 : python .\main_overlap_with_n_seconds.py [輸入video位址] [輸出json位址] [最小切分鏡頭秒數] [輸出片段資料夾位址] [重疊n秒數]

### pySceneDetect/main_not_overlap_with_n_seconds.py
- 說明 : 切分鏡頭並輸出json檔(如上格式)與影音片段，能設置最小切分鏡頭秒數(乃透過片段組合方式，該變數使用方式與上法不同)，片段額外增加n秒，片段間不重疊
- python使用 : python .\main_not_overlap_with_n_seconds.py [輸入video位址] [輸出json位址] [最小切分鏡頭秒數] [輸出片段資料夾位址] [增加n秒數]

### pySceneDetect/video_cut
- 說明 : 切分影片
- ~~exe檔案 : https://drive.google.com/drive/folders/1I7mfHGPXclsQzv029n9Swrztfu00cJLn?usp=drive_link~~
- ~~exe請放resources內~~
- python使用 : python .\video_cut.py [輸入video位址] [輸出video位址] [起始時間] [結束時間]
- ~~exe使用 : .\video_cut.exe [輸入video位址] [輸出video位址] [起始時間] [結束時間]~~

### Gemini
> 影片僅Vertex AI 支援，需使用Google Cloud Platform (之前比較簡單的是Google AI)，影片需上傳至Google Cloud Storage

1. 安裝 [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. 建立GCP Project 和啟動 Vertex AI API
3. [建立Service Account並下載金鑰](https://cloud.google.com/vertex-ai/docs/start/client-libraries#node.js)
4. 在執行前須先登入 [`gcloud auth application-default login`](https://cloud.google.com/docs/authentication/provide-credentials-adc?hl=zh-cn#local-dev)
5. 安裝 `npm install @google-cloud/vertex-ai`
6. 執行 `node .\gemini.js`

### 語音生成
- 說明 : 生成語音
- exe檔案 : https://drive.google.com/drive/folders/1I7mfHGPXclsQzv029n9Swrztfu00cJLn?usp=drive_link
- exe請放resources內
- python使用 : python .\readFromJson.py [讀取json位置] [存mp3位置(.mp3)] [AD index] [AD choice]
- exe使用 : .\readFromJson.exe [讀取json位置] [存mp3位置(.mp3)] [AD index] [AD choice]