import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import mainEXE from '../../resources/main.exe?asset&asarUnpack'
import mainPy from '../../resources/main.py?asset&asarUnpack'
import video_cutEXE from '../../resources/video_cut.exe?asset&asarUnpack'
import { session } from 'electron'
import { constants } from './constants'
import { gemini_sendMultiModalPromptWithVideo, gemini_uploadFile } from './gemini'
import { gemini_1_5_sendMultiModalPromptWithVideo, gemini_1_5_uploadFile } from './AD-Gen-1.5'
import { AD_tts } from './openai_tts'
import { mergeAllAudioToVideo, mergeAudioToVideo } from './audio_merge'
import { call_readEXE, call_readEXE_recursive } from './ad_to_mp3'
import { finally_video } from './finally_video'

const ffmpeg = require('fluent-ffmpeg')
const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const USER_DATA_PATH = app.getPath('userData')
const PROJECT_PATH = path.join(USER_DATA_PATH, 'Project_Name')
let Constant = {};
let OLD = "";
// module.exports = { Project_PATH_Name };
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
  })
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


  // 選擇專案位置
  ipcMain.on("ChooseFilePosition", async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });
      if (result.canceled) {
        return;
      }
      const path3 = result.filePaths[0];
      Constant = constants(path3);
      // console.log("Project_PATH_Name:", path3);
      console.log("constants:", Constant);
    } catch (error) {
      console.error("Error in ChooseFilePosition:", error);
    }
  });



  ipcMain.on('GET-Old-Path', async (event) => {
    const filePath = path.join(app.getPath('userData'), 'Project_Name', 'PATH.txt');
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      fs.readdir(data, (err, files) => {
        if (err) {
          console.error('ERROR:', err);
          return;
        }
        let projectName = files[0];
        Constant = constants(data, false, projectName);
      });

      event.reply('Old-Path-Data', data);
    } catch (err) {
      console.error('Error reading file:', err);
      event.reply('Old-Path-Data', 'Error reading file');
    }

  });
  //copy video file
  ipcMain.on('file', async (event, arg) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov'] }]
    })

    if (result.filePaths.length === 0) {
      return
    }
    // copy file to output folder
    const input = result.filePaths[0]
    //const USER_DATA_PATH = app.getPath('userData')
    if (!fs.existsSync(Constant.PROJECT_PATH)) {
      console.log('project folder not exist, create one')
      fs.mkdirSync(Constant.PROJECT_PATH)
    }
    const output = path.join(Constant.PROJECT_PATH, 'video')
    if (!fs.existsSync(output)) {
      console.log('output folder not exist, create one')
      fs.mkdirSync(output)
    }

    // 用user data 當作舊檔路徑
    if (!fs.existsSync(PROJECT_PATH)) {
      console.log('output folder not exist, create one')
      fs.mkdirSync(PROJECT_PATH)
    }
    const pathFile = path.join(PROJECT_PATH, 'PATH.txt');
    fs.writeFileSync(pathFile, Constant.PROJECT_PATH.split("\\").slice(0,-1).join('\\'), 'utf8');


    //===============
    //rename video file
    const output_file = path.join(output, 'video.mp4')
    fs.copyFile(input, output_file, async (err) => {
      if (err) throw err
      else if (arg === 'open') {
        console.log('video was copied to input folder')
        event.reply('get-video', result.filePaths)
      } else if (arg === 'generate') {
        const videoUri = await gemini_1_5_uploadFile('video.mp4', Constant.VIDEO_PATH)
        console.log('videoUri: ' + videoUri)
        const audioText = await gemini_1_5_sendMultiModalPromptWithVideo(
          'gemini-rain-py',
          'us-central1',
          'gemini-1.5-flash-preview-0514',
          videoUri
        )
        console.log('audioText:' + audioText)
        const jsonMatch = audioText.match(/```json\s*([\s\S]*?)\s*```/)
        let audioText_json = []
        // 確保匹配到了 JSON 部分
        if (jsonMatch && jsonMatch[1]) {
          const jsonString = jsonMatch[1]
          try {
            audioText_json = JSON.parse(jsonString)
            console.log(audioText_json)
          } catch (error) {
            console.error('Error parsing JSON:', error)
          }
        } else {
          console.error('No JSON found in the text.')
        }
        if (fs.existsSync(Constant.AUDIO_FOLDER)) {
          try {
            await fs.promises.rm(Constant.AUDIO_FOLDER, { recursive: true, force: true })
            console.log('The folder has been deleted!')

            await fs.promises.mkdir(Constant.AUDIO_FOLDER, { recursive: true })
            console.log('The folder has been created!')
          } catch (error) {
            console.error('Error clearing and creating folder:', error)
          }
        }

        for (let i = 0; i < audioText_json.length; i++) {
          const timestamp = audioText_json[i].time
          const text = audioText_json[i].content
          await AD_tts(timestamp, text, Constant.AUDIO_FOLDER)
        }
        /*
        "AD001": {
        "scene-start-time": "00:00:00.000",
        "scene-end-time": "00:00:13.167",
        "AD-start-time": "00:00:00.000",
        "AD-content": [
                "狗狗貓\n",
                "455454",
                "877",
                "999",
            ],
            "AD-content-ID": 0
        },
        */
        let mainJson = {}
        for (let i = 0; i < audioText_json.length; i++) {
          const timestamp = audioText_json[i].time
          //TODO: 取影片長度
          const next_timestamp = audioText_json[i + 1] ? audioText_json[i + 1].time : '00:00:00.000'
          const text = audioText_json[i].content
          mainJson['AD' + String(i + 1).padStart(3, 0)] = {
            'scene-start-time': timestamp,
            'scene-end-time': next_timestamp,
            'AD-start-time': timestamp,
            'AD-content': [text, '', '', ''],
            'AD-content-ID': 0
          }
        }
        console.log('mainJson:', mainJson)
        fs.writeFile(Constant.OUTPUT_JSON_PATH, JSON.stringify(mainJson, null, 4), (err) => {
          if (err) {
            console.error('ERROR:', err)
            return
          }
          console.log('The file has been saved!')
        })

        await mergeAllAudioToVideo(
          Constant.VIDEO_PATH,
          Constant.AUDIO_FOLDER,
          Constant.OUTPUT_VIDEO_FOLDER
        )
        event.reply('generate-reply', true)
      }
    })
  })

  // return video file path
  // 影片檔案名稱: video.mp4
  // 路徑範例: C:\Users\User\AppData\Roaming\my-app
  // 路徑會自動抓
  ipcMain.on('get-video-path', async (event, arg) => {
    // console.log('get-video-path Constant:', Constant)
    const output = path.join(Constant.PROJECT_PATH, 'video')
    const output_file = path.join(output, 'video.mp4')
    console.log('output_file:', output_file)
    event.returnValue = output_file
  })

  ipcMain.on('get-output-video-path', async (event, arg) => {
    //const USER_DATA_PATH = app.getPath('userData')
    event.returnValue = Constant.OUTPUT_VIDEO_PATH
    event.reply('get-output-video-path-reply', Constant.PROJECT_PATH)
  })

  //收到start_PySceneDetect的訊息後，執行call_pySceneDetect
  ipcMain.on('start_PySceneDetect', async (event, arg) => {
    call_pySceneDetect(event)
    console.log('start PySceneDetect now')
  })

  createWindow()

  // const fs = require('fs');
  // const path = require('path');
  const ffmpeg = require('fluent-ffmpeg')

  ipcMain.on('mergeAudioToVideo', async (event) => {
    if (fs.existsSync(Constant.AUDIO_FOLDER)) {
      try {
        await fs.promises.rm(Constant.AUDIO_FOLDER, { recursive: true, force: true })
        console.log('The folder has been deleted!')

        await fs.promises.mkdir(Constant.AUDIO_FOLDER, { recursive: true })
        console.log('The folder has been created!')
      } catch (error) {
        console.error('Error clearing and creating folder:', error)
      }
    }
    try {
      const result = await call_readEXE_recursive(Constant)
      if (result) {
        await finally_video(Constant)
        event.reply('mergeAudioToVideo-reply', true)
      } else {
        console.error('Error: Not all EXE calls completed successfully.')
      }
    } catch (error) {
      console.error('Error in mergeAudioToVideo:', error)
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.on('write-file', (event, content) => {
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err)
        return
      }
      let jsonData
      try {
        jsonData = JSON.parse(data)
        console.log('content', content)
        console.log('jsonData', jsonData)
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError)
        return
      }
      let contentObject

      try {
        contentObject = JSON.parse(content)
      } catch (error) {
        console.error('Parsing error:', error)
      }
      jsonData = { ...jsonData, ...contentObject }
      // console.log("jsonData", jsonData);

      // console.log("jsonData", jsonData);
      /////////sort json by time
      const jsonArray = Object.entries(jsonData) // Convert json to array
      jsonArray.sort((a, b) => {
        //定義排序方式
        const timeA = a[1]['scene-start-time']
        const timeB = b[1]['scene-start-time']
        const [hourA, minA, secA, milliA] = timeA.split(/[:.]/)
        const [hourB, minB, secB, milliB] = timeB.split(/[:.]/)
        return (
          (hourA - hourB) * 3600000 +
          (minA - minB) * 60000 +
          (secA - secB) * 1000 +
          (milliA - milliB)
        )
      })
      /////
      const sortedJson = {} // Convert array to json
      jsonArray.forEach(([key, value]) => {
        sortedJson[key] = value
      })
      const updatedJsonData = JSON.stringify(sortedJson, null, 4)
      //////
      // console.log("updatedJsonData", updatedJsonData);
      fs.writeFile(Constant.OUTPUT_JSON_PATH, updatedJsonData, 'utf8', (err2) => {
        if (err2) {
          console.error('ERROR:', err2)
          return
        }
        console.log('File successfully written!')
      })
    })
  })

  ipcMain.on('read-file', async (event, filePath) => {
    console.log("546545",Constant)
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      // console.log('SUCCESS:', jsonData);
      event.reply('read-file-reply', { success: true, data: jsonData })
    })
  })




  //檢查AD選擇
  ipcMain.on('check-AD-choice', (event, now_Selected_AD) => {
    // console.log("now_Selected_AD",typeof now_Selected_AD);
    // console.log("ad_index",typeof ad_index);
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      const jsonArray = Object.entries(jsonData)
      // // console.log("jsonArray", jsonArray);
      // console.log("now_Selected_AD",now_Selected_AD, jsonArray[now_Selected_AD]);
      // console.log("now_Selected_AD", jsonArray[now_Selected_AD][1]["AD-content-ID"]);
      event.reply('now_Selected_AD-reply', jsonArray[now_Selected_AD][1]['AD-content-ID'])
    })
  })

  //修改AD選擇
  ipcMain.on('change-AD-choice', (event, now_Selected_AD, ad_index) => {
    // console.log("now_Selected_AD",typeof now_Selected_AD);
    // console.log("ad_index",typeof ad_index);
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      const jsonArray = Object.entries(jsonData)
      event.reply(
        'change-AD-choice-reply',
        jsonArray[now_Selected_AD][1]['AD-content'][ad_index - 1]
      )
      // // console.log("jsonArray", jsonArray);
      jsonArray[now_Selected_AD][1]['AD-content-ID'] = ad_index - 1
      // console.log("now_Selected_AD",now_Selected_AD, jsonArray[now_Selected_AD]);

      /////
      const sortedJson = {} // Convert array to json
      jsonArray.forEach(([key, value]) => {
        sortedJson[key] = value
      })
      const updatedJsonData = JSON.stringify(sortedJson, null, 4)
      //////

      fs.writeFile(Constant.OUTPUT_JSON_PATH, updatedJsonData, 'utf8', (err2) => {
        if (err2) {
          console.error('ERROR:', err2)
          return
        }
        // console.log('File successfully written!');
      })
    })
  })

  ipcMain.on('delete_write_file', (event, content) => {
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      delete jsonData[content]
      const jsonArray = Object.entries(jsonData)
      fs.writeFile(Constant.OUTPUT_JSON_PATH, JSON.stringify(jsonData, null, 4), 'utf8', (err2) => {
        if (err2) {
          console.error('ERROR:', err2)
          return
        }
        console.log('File successfully written!')
      })
    })
  })

  ipcMain.on(
    'save_AD',
    (event, NOW_select_AD_name_value, textareaValue_value, NOW_Ad_Choice, time1, time2, tim3) => {
      // console.log('save_AD:', content);
      fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
        if (err) {
          console.error('ERROR:', err)
          return
        }

        const jsonData = JSON.parse(data)
        // console.log('NOW_select_AD_name_value:', NOW_select_AD_name_value);
        // console.log('textareaValue_value:', textareaValue_value);
        // console.log('NOW_Ad_Choice:', NOW_Ad_Choice);
        jsonData[NOW_select_AD_name_value]['AD-content'][NOW_Ad_Choice] = textareaValue_value
        jsonData[NOW_select_AD_name_value]['scene-start-time'] = time1
        jsonData[NOW_select_AD_name_value]['scene-end-time'] = time2
        jsonData[NOW_select_AD_name_value]['AD-start-time'] = tim3
        fs.writeFile(Constant.OUTPUT_JSON_PATH, JSON.stringify(jsonData, null, 4), 'utf8', (err2) => { })
      })
    }
  )

  ipcMain.on('get_SceneData', (event, scene_start) => {
    let sceneData = scene_start

    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      const jsonDataArray = Object.values(jsonData)
      const jsonDataIndex = Object.keys(jsonData)
      let returnData = {}
      for (let i = 0; i < jsonDataArray.length; i++) {
        if (jsonDataArray[i]['scene-start-time'] == sceneData) {
          returnData['AD-start-time'] = jsonDataArray[i]['AD-start-time']
          returnData['scene-end-time'] = jsonDataArray[i]['scene-end-time']
          returnData['scene-start-time'] = jsonDataArray[i]['scene-start-time']
          returnData['AD-content'] = jsonDataArray[i]['AD-content']
          returnData['AD-content-ID'] = jsonDataArray[i]['AD-content-ID']
          returnData['index'] = jsonDataIndex[i] //為了知道index
          // console.log('SUCCESS:', returnData);
          event.reply('get_SceneData-reply', { success: true, data: returnData })
        }
      }
    })
  })

  ipcMain.on('start_gemini', async (event, arg) => {
    gemini_process_all(Constant.OUTPUT_JSON_PATH, event)
  })

  ipcMain.on('read-AD', async (event, arg, choice, theName) => {
    // console.log("arg", arg, choice,theName);
    call_readEXE(arg, choice, theName, 0, Constant)
  })

  const path = require('path')
  const { exec } = require('child_process')

  ipcMain.on('regen-AD', async (event, name, start, end, timestamp) => {
    const input = path.join(Constant.PROJECT_PATH, 'video/video.mp4')
    const output = path.join(Constant.PROJECT_PATH, 'video', `${name}.mp4`)
    const cmd = `"${video_cutEXE}" "${input}" "${output}" "${start}" "${end}"`

    console.log('cmd:', cmd)

    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        console.error('exec error:', error)
        event.reply('regen-AD-reply', 'Fail')
        return
      }

      if (stdout.trim().replace(/\r?\n/g, '') === 'Done') {
        console.log('PSD Done')
        gemini_with_scene(name, output).then((response) => {
          console.log('response:', response)
          event.reply('regen-AD-reply', response)
        })
      } else {
        console.log('PSD error:', stderr)
        event.reply('regen-AD-reply', 'Fail')
      }
    })

  })

  ipcMain.on('read-All-AD', async (event) => {
    call_readEXE_recursive(Constant)
  })

  ipcMain.on('get-Specific-Time', async (event,index,ttvalue) => {
    console.log(Constant.OUTPUT_JSON_PATH)
    fs.readFile(Constant.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      const jsonData = JSON.parse(data)
      const jsonDataArray = Object.values(jsonData)
      let all = [];
      // console.log('jsonDataArray:', jsonDataArray)
      for(let i = 0; i < jsonDataArray.length; i++){
        all[i] = jsonDataArray[i]["scene-start-time"];
      }
      const filteredTimes = all.filter(time => time.startsWith(`00:${(ttvalue-1).toString().padStart(2, '0')}:`));
      // console.log('filteredTimes:', filteredTimes)
      event.reply('get-Specific-Time-reply', filteredTimes[index])
      // console.log('all:', all)
    })
  })

  ipcMain.on('get-project-name', async (event, OLD_PATH) => {
    fs.readdir(OLD_PATH, (err, files) => {
      if (err) {
        console.error('ERROR:', err)
        return
      }
      let projectName = files[0]
      console.log('projectName:', projectName)
      Constant = constants(OLD_PATH,false,projectName);
      event.reply('get-project-name-reply', projectName);

    })

  })



  // 更改title name
  ipcMain.on('change-project-name', (event, newName) => {
    const pathParts = Constant.PROJECT_PATH.split(path.sep);
    const parentPath = pathParts.slice(0, -1).join(path.sep);

    console.log('Constant.PROJECT_PATH:', parentPath)
    const oldProjectNamePath = Constant.PROJECT_PATH
    const newProjectNamePath = path.join(parentPath, newName);

    fs.rename(oldProjectNamePath, newProjectNamePath, (err) => {
      if (err) {
        console.error('ERROR:', err);
        return;
      }
      console.log('專案名稱已更改');
    });
    console.log('INIT Constant:',Constant)
    Constant = constants(newProjectNamePath, true, newName);
    console.log('change Constant:', Constant)
  });

})

async function gemini_with_scene(name, videoPath) {
  let uri = await gemini_1_5_uploadFile(`${name}.mp4`, videoPath)
  console.log('uri:', uri)

  return await gemini_1_5_sendMultiModalPromptWithVideo(
    'gemini-rain-py',
    'us-central1',
    Constant.GEMINI_MODEL,
    uri,
    '創建一個簡短的口述影像描述。儘量貼近原作品再現的原則。無須描述對話。',
    '你是專業的口述影像搞生成器，以旁白角度轉寫講稿，不要使用畫面中等詞彙'
  )
}

function call_pySceneDetect(event) {
  console.log(mainPy)
  const output_json = path.join(Constant.PROJECT_PATH, 'json/main.json')
  // const output_image = path.join(USER_DATA_PATH, 'image');

  const output_json_folder = path.dirname(output_json)
  if (!fs.existsSync(output_json_folder)) {
    fs.mkdirSync(output_json_folder, { recursive: true })
  }
  fs.writeFileSync(output_json, '')
  // if (!fs.existsSync(output_image)) {
  //   fs.mkdirSync(output_image, { recursive: true });
  // }

  const psdEXEPath = mainEXE
  const psdPyPath = mainPy

  const inputVideo = path.join(Constant.PROJECT_PATH, 'video/video.mp4')

  // const inputVideo = path.join(__dirname, '../../input/net.mp4'); //要改????.mp4

  const MIN_SCENE_LEN = 10
  // const cmd = `"${psdEXEPath}" "${inputVideo}" "${output_json}" "${MIN_SCENE_LEN}" "${constants.CLIPS_FOLDER}"`
  const cmd = `python "${psdPyPath}" "${inputVideo}" "${Constant.OUTPUT_JSON_PATH}" "${MIN_SCENE_LEN}" "${Constant.CLIPS_FOLDER}"`

  exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`)
      return
    }
    // console.log(stdout);
    if (stdout.trim().replace(/\r?\n/g, '') === 'Done') {
      console.log('exe Done')
      event.reply('start_PySceneDetect', 'Success')
    } else {
      console.log('exe error')
      event.reply('start_PySceneDetect', 'Fail')
    }
  })
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
  const fs = require('fs')
  const path = require('path')
  //path: AD_json
  fs.readFile(AD_json, 'utf8', async (err, data) => {
    if (err) {
      console.error('ERROR:', err)
      return
    }
    const jsonData = JSON.parse(data)
    const jsonIndex = Object.keys(jsonData)
    for (const key of jsonIndex) {
      const filePath = path.join(Constant.CLIPS_FOLDER, key + '.mp4')
      const uri = await gemini_uploadFile(key + '.mp4', filePath)
      const response = await gemini_sendMultiModalPromptWithVideo(
        'gemini-rain-py',
        'us-central1',
        Constant.GEMINI_MODEL,
        uri
      )
      jsonData[key]['AD-content'][0] = response
      console.log('key:', key, 'response:', response)
      // 暫停1分鐘
      await new Promise((resolve) => setTimeout(resolve, 35000))
    }
    console.log('jsonData:', jsonData)
    fs.writeFile(AD_json, JSON.stringify(jsonData), (err) => {
      if (err) return 'FAIL'
      console.log('The file has been saved!')
      event.reply('gemini_end', 'Success')
    })
  })
}
