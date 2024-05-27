import { constants } from './constants'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process')
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

  exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    // console.log(stdout);
    if (stdout.trim().replace(/\r?\n/g, '') === "Done") {
      console.log('exe Done');
      // event.reply('readFromJson', "Success")
    } else {
      console.log('exe error');
      // event.reply('readFromJson', "Fail")
    }
  });
};

export async function call_readEXE_recursive() {
  fs.readFile(constants.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('ERROR:', err);
      return;
    }

    const jsonData = JSON.parse(data);
    const jsonDataArray = Object.values(jsonData);
    const jsonDataIndex = Object.keys(jsonData);
    //
    for (let i = 0; i < jsonDataIndex.length; i++) {
      const ADname = jsonDataIndex[i];
      const ADChoice = jsonDataArray[i]["AD-content-ID"];
      let output_name =jsonDataArray[i]["scene-start-time"]+".mp3";
      output_name = output_name.replace(/:/g, "_");
      call_readEXE(ADname, ADChoice,output_name,1);
    }
  });
}
