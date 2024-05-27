import { constants } from './constants'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process')
import readFromJsonEXE from '../../resources/readFromJson.exe?asset&asarUnpack'


export async function call_readEXE(event,ADname,choice,theName) {
  let output_name =theName+".mp3";
  output_name = output_name.replace(/:/g, "_");
  // console.log(output_name);
  const output_audio = path.join(constants.AUDIO_FOLDER, output_name);
  if (!fs.existsSync(constants.AUDIO_FOLDER)) {
    fs.mkdirSync(constants.AUDIO_FOLDER, { recursive: true });
  }
  const readEXEPath = readFromJsonEXE;
  const cmd = `"${readEXEPath}" "${constants.OUTPUT_JSON_PATH}" "${output_audio}" "${ADname}" "${choice}"`;

  exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error}`);
      return;
    }
    // console.log(stdout);
    if (stdout.trim().replace(/\r?\n/g, '') === "Done") {
      console.log('exe Done');
      event.reply('readFromJson', "Success")
    } else {
      console.log('exe error');
      event.reply('readFromJson', "Fail")
    }
  });
};
