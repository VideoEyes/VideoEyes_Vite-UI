import { constants } from './constants'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process')
const util = require('util');
const execPromise = util.promisify(exec);
import readFromJsonEXE from '../../resources/readFromJson.exe?asset&asarUnpack'
import saveMP3FromJsonEXE from '../../resources/saveMP3FromJson.exe?asset&asarUnpack'


export async function call_readEXE(ADname,choice,theName,mode=0) {
  let output_name =theName+".mp3";
  output_name = output_name.replace(/:/g, "_");
  // console.log(output_name);
  const output_audio = path.join(constants.AUDIO_FOLDER, output_name);
  if (!fs.existsSync(constants.AUDIO_FOLDER)) {
    fs.mkdirSync(constants.AUDIO_FOLDER, { recursive: true });
  }

  var cmd;
  if (mode === 0) 
    cmd = `"${readFromJsonEXE}" "${constants.OUTPUT_JSON_PATH}" "${output_audio}" "${ADname}" "${choice}"`;
  else if (mode === 1) 
    cmd = `"${saveMP3FromJsonEXE}" "${constants.OUTPUT_JSON_PATH}" "${output_audio}" "${ADname}" "${choice}"`;

  try {
    const { stdout } = await execPromise(cmd, { windowsHide: true });
    if (stdout.trim().replace(/\r?\n/g, '') === "Done") {
      console.log('exe Done');
      return 1;
    } else {
      console.log('exe error');
      return 0;
    }
  } catch (error) {
    console.error(`error: ${error}`);
    return 0;
  }
  // exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`error: ${error}`);
  //     return;
  //   }
  //   // console.log(stdout);
  //   if (stdout.trim().replace(/\r?\n/g, '') === "Done") {
  //     console.log('exe Done');
  //     return 1;
  //     // event.reply('readFromJson', "Success")
  //   } else {
  //     console.log('exe error');
  //     return 0;
  //     // event.reply('readFromJson', "Fail")
  //   }
  // });
};

// export async function call_readEXE_recursive() {
//   fs.readFile(constants.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
//     if (err) {
//       console.error('ERROR:', err);
//       return;
//     }
//     let sum = 0;
//     const jsonData = JSON.parse(data);
//     const jsonDataArray = Object.values(jsonData);
//     const jsonDataIndex = Object.keys(jsonData);
//     //
//     for (let i = 0; i < jsonDataIndex.length; i++) {
//       const ADname = jsonDataIndex[i];
//       const ADChoice = jsonDataArray[i]["AD-content-ID"];
//       let output_name =jsonDataArray[i]["scene-start-time"]+".mp3";
//       output_name = output_name.replace(/:/g, "_");
//       sum += call_readEXE(ADname, ADChoice,output_name,1);
//     }
//     if (sum === jsonDataIndex.length) {
//       return true
//     }else{
//       return false
//     }
//   });
// }

export async function call_readEXE_recursive() {
  try {
    const data = await fs.promises.readFile(constants.OUTPUT_JSON_PATH, 'utf8');
    let sum = 0;
    const jsonData = JSON.parse(data);
    const jsonDataArray = Object.values(jsonData);
    const jsonDataIndex = Object.keys(jsonData);

    for (let i = 0; i < jsonDataIndex.length; i++) {
      const ADname = jsonDataIndex[i];
      const ADChoice = jsonDataArray[i]["AD-content-ID"];
      const output_name = jsonDataArray[i]["scene-start-time"].replace(/:/g, "_");

      sum += await call_readEXE(ADname, ADChoice, output_name, 1);
    }

    return sum === jsonDataIndex.length;
  } catch (err) {
    console.error('ERROR:', err);
    return false;
  }
}