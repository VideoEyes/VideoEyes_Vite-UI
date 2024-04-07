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
  - AD-clip.json

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
### pySceneDetect
- 說明 : 切分鏡頭並輸出json檔(如上格式)
- exe檔案與範例json連結 : https://drive.google.com/drive/folders/1I7mfHGPXclsQzv029n9Swrztfu00cJLn?usp=drive_link
- python使用 : python .\main.py [video位址] [json位址] 
- exe使用 : .\main.exe [video位址] [json位址] 

### Gemini
> 影片僅Vertex AI 支援，需使用Google Cloud Platform (之前比較簡單的是Google AI)，影片需上傳至Google Cloud Storage

1. 安裝 [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. 建立GCP Project 和啟動 Vertex AI API
3. [建立Service Account並下載金鑰](https://cloud.google.com/vertex-ai/docs/start/client-libraries#node.js)
4. 在執行前須先登入 [`gcloud auth application-default login`](https://cloud.google.com/docs/authentication/provide-credentials-adc?hl=zh-cn#local-dev)
5. 安裝 `npm install @google-cloud/vertex-ai`
6. 執行 `node .\gemini.js`