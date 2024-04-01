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
    AD-clip-ID1:{
        scene-start-time: Datetime
        scene-end-time: Datetime
        AD-start-time: Datetime
        AD-content: string-array

    },
    AD-clip-ID2:{
        scene-start-time:
        scene-end-time:
        AD-start-time:
        AD-content:
    },
}
```

##### 檔案儲存位置

- 一般檔案儲存位置(常數變數: PROJECT_PATH)
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

