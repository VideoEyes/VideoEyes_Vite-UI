import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import mainEXE from '../../resources/main.exe?asset&asarUnpack'
import video_cutEXE from '../../resources/video_cut.exe?asset&asarUnpack'
import { session } from 'electron'
import { constants } from './constants'

const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const USER_DATA_PATH = app.getPath('userData')
const PROJECT_PATH = path.join(USER_DATA_PATH, 'Project_Name')
const output_json = path.join(PROJECT_PATH, 'json/main.json');
const { VertexAI } = require('@google-cloud/vertexai');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'home' }) //here
  }
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  session.defaultSession.loadExtension(join(__dirname, '../../devtools/6.6.1_0'))
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  //copy video file
  ipcMain.on('file', async (event, arg) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'avi', 'mov'] }
      ]
    })

    if (result.filePaths.length === 0) {
      return
    }
    // copy file to output folder
    const input = result.filePaths[0]
    //const USER_DATA_PATH = app.getPath('userData')
    if (!fs.existsSync(PROJECT_PATH)) {
      console.log('project folder not exist, create one')
      fs.mkdirSync(PROJECT_PATH)
    }
    const output = path.join(PROJECT_PATH, 'video')
    if (!fs.existsSync(output)) {
      console.log('output folder not exist, create one')
      fs.mkdirSync(output)
    }
    //rename video file
    const output_file = path.join(output, "video.mp4")
    fs.copyFile(input, output_file, (err) => {
      if (err) throw err
      else {
        console.log('video was copied to input folder')
        event.reply('get-video', result.filePaths)
      }
    })
  })

  // return video file path
  // 影片檔案名稱: video.mp4
  // 路徑範例: C:\Users\User\AppData\Roaming\my-app
  // 路徑會自動抓
  ipcMain.on('get-video-path', async (event, arg) => {
    //const USER_DATA_PATH = app.getPath('userData')
    const output = path.join(PROJECT_PATH, 'video')
    const output_file = path.join(output, "video.mp4")
    event.returnValue = output_file
  })

  //收到start_PySceneDetect的訊息後，執行call_pySceneDetect
  ipcMain.on('start_PySceneDetect', async (event, arg) => {
    call_pySceneDetect(event)
    console.log('start PySceneDetect now')
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('write-file', (event, filePath, content) => {
    const absolutePath = path.join(__dirname, filePath);
    fs.writeFile(absolutePath, content, 'utf8', (err) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      console.log('SUCCESS');
    });
  });


  ipcMain.on('write-file', (event, filePath, content) => {
    const absolutePath = path.join(__dirname, filePath);
    fs.writeFile(absolutePath, content, 'utf8', (err) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      console.log('SUCCESS');
    });
  });

  ipcMain.on('read-file', (event, filePath) => {
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      // console.log('SUCCESS:', jsonData);
      event.reply('read-file-reply', { success: true, data: jsonData });
    });
  });

  ipcMain.on('get_SceneData', (event, scene_start) => {
    let sceneData = scene_start;
    // console.log("sceneData",sceneData);
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      const jsonDataArray = Object.values(jsonData);
      // console.log("jsonDataArray",jsonDataArray);
      let returnData = {};
      for (let i = 0; i < jsonDataArray.length; i++) {
        if (jsonDataArray[i]["scene-start-time"] == sceneData) {
          returnData["AD-start-time"] =  jsonDataArray[i]["AD-start-time"];
          returnData["scene-end-time"] =  jsonDataArray[i]["scene-end-time"];
          returnData["scene-start-time"] =  jsonDataArray[i]["scene-start-time"];
          returnData["AD-content"] =  jsonDataArray[i]["AD-content"][0];
          // console.log('SUCCESS:', returnData);
        }
      }
      // console.log('SUCCESS:', returnData);
      event.reply('get_SceneData-reply', { success: true, data: returnData });
    });
  });
  
  ipcMain.on('start_gemini', (event, arg) => {
    gemini_process_all(output_json);
    event.reply('gemini_end', "Success")
  });
})


function call_pySceneDetect(event) {
  console.log(mainEXE)
  const output_json = path.join(PROJECT_PATH, 'json/main.json');
  // const output_image = path.join(USER_DATA_PATH, 'image');

  const output_json_folder = path.dirname(output_json);
  if (!fs.existsSync(output_json_folder)) {
    fs.mkdirSync(output_json_folder, { recursive: true });
  }
  fs.writeFileSync(output_json, '');
  // if (!fs.existsSync(output_image)) {
  //   fs.mkdirSync(output_image, { recursive: true });
  // }

  const psdEXEPath = mainEXE;

  const inputVideo = path.join(PROJECT_PATH, 'video/video.mp4');

  // const inputVideo = path.join(__dirname, '../../input/net.mp4'); //要改????.mp4

  const FPS = 30;
  const MIN_SCENE_LEN = 10;
  const cmd = `"${psdEXEPath}" "${inputVideo}" "${output_json}" "${MIN_SCENE_LEN}" "${constants.CLIPS_FOLDER}"`;
  // event.reply('meow', cmd);
  // console.log("123", USER_DATA_PATH);
  // console.log(cmd);
  exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    // console.log(stdout);
    if (stdout.trim().replace(/\r?\n/g, '') === "Done") {
      console.log('exe Done');
      event.reply('start_PySceneDetect', "Success")
    } else {
      console.log('exe error');
      event.reply('start_PySceneDetect', "Fail")
    }
  });
}



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
/**

 * @param options: { title:  String, defaultPath: String, buttonLabel: String, filters: area}

 * @param content: String

 * @returns Promise

 */







const { Storage } = require('@google-cloud/storage');

async function uploadFile(destFileName, filePath, bucketName = 'gemini-ad-gen') {
    const storage = new Storage();
    const options = {
        destination: destFileName,
    };

    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${filePath} uploaded to ${bucketName}`);
    return `gs://${bucketName}/${destFileName}`;
}

async function sendMultiModalPromptWithVideo(
    projectId = '	gemini-rain-py',
    location = 'us-central1',
    model = 'gemini-1.0-pro-vision',
    uri = 'gs://gemini-ad-gen/pixel8.mp4'
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({ project: projectId, location: location });

    const generativeVisionModel = vertexAI.getGenerativeModel({
        model: model,
        
    });

    // Pass multimodal prompt
    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        fileData: {
                            fileUri: uri,
                            mimeType: 'video/mp4',
                        },
                    },
                    {
                        text: 'Describe this video.'
                        //'你是一個口述影像撰稿員，謹守「反映及再現原作」，做到「信、達、雅」，儘量貼近原作品再現的原則。僅依照此影片片段產生150字畫面描述，無須完整故事，可觀描述人物動作、畫面即可。將不確定的是誤用A、B、C...表示',
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.4,
            // topK: 2,
            // candidateCount: integer,
            // maxOutputTokens: integer,
            // stopSequences: [
            //   string
            // ]
          }
    };

    // Create the response
    const response = await generativeVisionModel.generateContent(request);
    // Wait for the response to complete
    const aggregatedResponse = await response.response;
    // Select the text from the response
    const fullTextResponse =
        aggregatedResponse.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);
    return fullTextResponse;
}

async function gemini_process_all(AD_json, bucketName = 'gemini-ad-gen') {
    //read json file
    const fs = require('fs');
    const path = require('path');
    //path: AD_json
    fs.readFile(AD_json, 'utf8', async (err, data) => {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
        const jsonData = JSON.parse(data);
        const jsonIndex = Object.keys(jsonData);
        console.log(jsonIndex);
        for(const key of jsonIndex){
            const filePath = path.join(constants.CLIPS_FOLDER, key + '.mp4');
            const uri = await uploadFile(filePath, filePath, bucketName);
            const response = await sendMultiModalPromptWithVideo(uri);
            jsonData[key]["AD-content"] = response;
        }
        fs.writeFileSync(AD_json, JSON.stringify(jsonData));
    });
}