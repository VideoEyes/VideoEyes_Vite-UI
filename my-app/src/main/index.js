import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import mainEXE from '../../resources/main.exe?asset&asarUnpack'
import video_cutEXE from '../../resources/video_cut.exe?asset&asarUnpack'
import { session } from 'electron'
import { constants } from './constants'
import { gemini_sendMultiModalPromptWithVideo, gemini_uploadFile } from './gemini'
import { call_readEXE,call_readEXE_recursive } from './ad_to_mp3'
import { call_readEXE } from './ad_to_mp3'
import { finally_video } from './finally_video'


const ffmpeg = require('fluent-ffmpeg');
const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const USER_DATA_PATH = app.getPath('userData')
const PROJECT_PATH = path.join(USER_DATA_PATH, 'Project_Name')
const output_json = path.join(PROJECT_PATH, 'json/main.json');
const { VertexAI } = require('@google-cloud/vertexai');
// var ffmpeg = require('fluent-ffmpeg');


// 主進程
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

  // 視窗關閉事件處理
  ipcMain.on('window-close', (event, data) => {
    // console.log("window-close", data);  // 這裡的 data 就是你傳送的資料
    // let AA = JSON.parse(data);
    // let jsonStr = JSON.stringify(AA, null, 4);
    // fs.writeFile(output_json, jsonStr, "utf8", (err2) => {
    //   if (err2) {
    //     console.error("ERROR:", err2);
    //     return;
    //   }
    //   console.log('File successfully written!');
    // });
    mainWindow.close()
  });
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

  //////////////


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

  // const fs = require('fs');
  // const path = require('path');
  const ffmpeg = require('fluent-ffmpeg');

  ipcMain.on('mergeAudioToVideo', async (event, videoPath, audioPath, outputPath, scene_output_video) => {
    finally_video();
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('write-file', (event, content) => {
    fs.readFile(output_json, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }
      let jsonData;
      try {
        jsonData = JSON.parse(data);
        console.log("content", content);
        console.log("jsonData", jsonData);
      } catch (parseError) {
        console.error("Error parsing JSON data:", parseError);
        return;
      }
      let contentObject;

      try {
        contentObject = JSON.parse(content);
      } catch (error) {
        console.error('Parsing error:', error);
      }
      jsonData = { ...jsonData, ...contentObject }
      // console.log("jsonData", jsonData);

      // console.log("jsonData", jsonData);
      /////////sort json by time
      const jsonArray = Object.entries(jsonData); // Convert json to array
      jsonArray.sort((a, b) => { //定義排序方式
        const timeA = a[1]['scene-start-time'];
        const timeB = b[1]['scene-start-time'];
        const [hourA, minA, secA, milliA] = timeA.split(/[:.]/);
        const [hourB, minB, secB, milliB] = timeB.split(/[:.]/);
        return (hourA - hourB) * 3600000 + (minA - minB) * 60000 + (secA - secB) * 1000 + (milliA - milliB);
      });
      /////
      const sortedJson = {}; // Convert array to json
      jsonArray.forEach(([key, value]) => {
        sortedJson[key] = value;
      });
      const updatedJsonData = JSON.stringify(sortedJson, null, 4);
      //////
      // console.log("updatedJsonData", updatedJsonData);
      fs.writeFile(output_json, updatedJsonData, "utf8", (err2) => {
        if (err2) {
          console.error("ERROR:", err2);
          return;
        }
        console.log('File successfully written!');
      });
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
  //檢查AD選擇
  ipcMain.on('check-AD-choice', (event, now_Selected_AD) => {
    // console.log("now_Selected_AD",typeof now_Selected_AD);
    // console.log("ad_index",typeof ad_index);
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      const jsonArray = Object.entries(jsonData);
      // // console.log("jsonArray", jsonArray);
      // console.log("now_Selected_AD",now_Selected_AD, jsonArray[now_Selected_AD]);
      // console.log("now_Selected_AD", jsonArray[now_Selected_AD][1]["AD-content-ID"]);
      event.reply('now_Selected_AD-reply', jsonArray[now_Selected_AD][1]["AD-content-ID"]);
    });
  });

  //修改AD選擇
  ipcMain.on('change-AD-choice', (event, now_Selected_AD, ad_index) => {
    // console.log("now_Selected_AD",typeof now_Selected_AD);
    // console.log("ad_index",typeof ad_index);
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      const jsonArray = Object.entries(jsonData);
      event.reply('change-AD-choice-reply', jsonArray[now_Selected_AD][1]["AD-content"][ad_index - 1])
      // // console.log("jsonArray", jsonArray);
      jsonArray[now_Selected_AD][1]["AD-content-ID"] = ad_index - 1;
      // console.log("now_Selected_AD",now_Selected_AD, jsonArray[now_Selected_AD]);

      /////
      const sortedJson = {}; // Convert array to json
      jsonArray.forEach(([key, value]) => {
        sortedJson[key] = value;
      });
      const updatedJsonData = JSON.stringify(sortedJson, null, 4);
      //////

      fs.writeFile(output_json, updatedJsonData, "utf8", (err2) => {
        if (err2) {
          console.error("ERROR:", err2);
          return;
        }
        // console.log('File successfully written!');
      });

    });
  });

  ipcMain.on('delete_write_file', (event, content) => {
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      delete jsonData[content];
      const jsonArray = Object.entries(jsonData);
      fs.writeFile(output_json, JSON.stringify(jsonData, null, 4), "utf8", (err2) => {
        if (err2) {
          console.error('ERROR:', err2);
          return;
        }
        console.log('File successfully written!');
      });
    });
  });

  ipcMain.on('save_AD', (event, NOW_select_AD_name_value, textareaValue_value, NOW_Ad_Choice) => {
    // console.log('save_AD:', content);
    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }

      const jsonData = JSON.parse(data);
      // console.log('NOW_select_AD_name_value:', NOW_select_AD_name_value);
      // console.log('textareaValue_value:', textareaValue_value);
      // console.log('NOW_Ad_Choice:', NOW_Ad_Choice);
      jsonData[NOW_select_AD_name_value]["AD-content"][NOW_Ad_Choice] = textareaValue_value;

      fs.writeFile(output_json, JSON.stringify(jsonData, null, 4), "utf8", (err2) => { });
    });

  });

  ipcMain.on('get_SceneData', (event, scene_start) => {
    let sceneData = scene_start;

    fs.readFile(output_json, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      const jsonDataArray = Object.values(jsonData);
      const jsonDataIndex = Object.keys(jsonData);
      let returnData = {};
      for (let i = 0; i < jsonDataArray.length; i++) {
        if (jsonDataArray[i]["scene-start-time"] == sceneData) {
          returnData["AD-start-time"] = jsonDataArray[i]["AD-start-time"];
          returnData["scene-end-time"] = jsonDataArray[i]["scene-end-time"];
          returnData["scene-start-time"] = jsonDataArray[i]["scene-start-time"];
          returnData["AD-content"] = jsonDataArray[i]["AD-content"];
          returnData["AD-content-ID"] = jsonDataArray[i]["AD-content-ID"];
          returnData["index"] = jsonDataIndex[i]; //為了知道index
          // console.log('SUCCESS:', returnData);
          event.reply('get_SceneData-reply', { success: true, data: returnData });
        }
      }

    });
  });

  ipcMain.on('start_gemini', async (event, arg) => {
    gemini_process_all(output_json, event);
  });

  ipcMain.on('read-AD', async (event, arg, choice, theName) => {
    // console.log("arg", arg, choice,theName);
    call_readEXE(arg,choice,theName)
  });

  ipcMain.on('read-All-AD', async (event) => {
    call_readEXE_recursive()
    call_readEXE(event, arg, choice, theName)
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



async function gemini_process_all(AD_json, event) {
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
    for (const key of jsonIndex) {
      const filePath = path.join(constants.CLIPS_FOLDER, key + '.mp4');
      const uri = await gemini_uploadFile(key + '.mp4', filePath);
      const response = await gemini_sendMultiModalPromptWithVideo('gemini-rain-py', 'us-central1', constants.GEMINI_MODEL, uri);
      jsonData[key]["AD-content"][0] = response;
      console.log('key:', key, 'response:', response);
      // 暫停1分鐘
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
    console.log('jsonData:', jsonData);
    fs.writeFile(AD_json, JSON.stringify(jsonData), (err) => {
      if (err) return "FAIL";
      console.log('The file has been saved!');
      event.reply('gemini_end', "Success")
    });
  });
}