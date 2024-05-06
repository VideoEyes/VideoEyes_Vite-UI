import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import mainEXE from '../../resources/main.exe?asset&asarUnpack'
import video_cutEXE from '../../resources/video_cut.exe?asset&asarUnpack'
import { session } from 'electron'
import gemini from 'gemini.js'

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
})


function call_pySceneDetect(event) {
  console.log(mainEXE)
  const output_json = path.join(PROJECT_PATH, 'json/main.json');
  // const output_image = path.join(USER_DATA_PATH, 'image');

  const output_json_dir = path.dirname(output_json);
  if (!fs.existsSync(output_json_dir)) {
    fs.mkdirSync(output_json_dir, { recursive: true });
  }
  fs.writeFileSync(output_json, '');
  // if (!fs.existsSync(output_image)) {
  //   fs.mkdirSync(output_image, { recursive: true });
  // }

  const psdEXEPath = mainEXE;

  const inputVideo = path.join(PROJECT_PATH, 'video/video.mp4');

  // const inputVideo = path.join(__dirname, '../../input/net.mp4'); //要改????.mp4

  const cmd = `"${psdEXEPath}" "${inputVideo}" "${output_json}"`;
  event.reply('meow', cmd);
  console.log("123", USER_DATA_PATH);
  console.log(cmd);
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




