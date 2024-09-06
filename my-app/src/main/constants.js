const { app } = require('electron');
const path = require('path');

// const AUDIO_FOLDER = path.join(PROJECT_PATH, 'audio');

// export const constants = {
//   USER_DATA_PATH: USER_DATA_PATH,
//   PROJECT_PATH: PROJECT_PATH,
//   OUTPUT_JSON_PATH: output_json,
//   CLIPS_FOLDER: CLIPS_FOLDER,
//   GEMINI_MODEL: GEMINI_MODEL,
//   AUDIO_FOLDER: AUDIO_FOLDER,
//   OUTPUT_VIDEO_FOLDER: OUTPUT_VIDEO_FOLDER,
//   OUTPUT_VIDEO_PATH: OUTPUT_VIDEO_PATH,
//   VIDEO_PATH: VIDEO_PATH,
//   AUDIO_FOLDER: AUDIO_FOLDER,
//   FINALLY_FOLDER: FINALLY_FOLDER,
//   TTS_Type: TTS_Type
// };


function constants(PATH,FLAG,P_NAME) {
  let PROJECT_NAME = 'Project_Name';
  if(P_NAME){
    PROJECT_NAME = P_NAME;
  }
  let PROJECT_PATH = path.join(PATH, PROJECT_NAME);
  if(FLAG){
    PROJECT_NAME = PATH.split('\\').pop();
    PROJECT_PATH = PROJECT_PATH.split('\\').slice(0,-1).join('\\');
  }
  const GEMINI_OUTPUT_PATH = path.join(PROJECT_PATH, 'json/gemini_output.json');
  const USER_DATA_PATH = app.getPath('userData');
  const output_json = path.join(PROJECT_PATH, 'json/main.json');
  const CLIPS_FOLDER = path.join(PROJECT_PATH, 'video');
  const VIDEO_PATH = path.join(CLIPS_FOLDER, 'video.mp4');
  const AUDIO_FOLDER = path.join(PROJECT_PATH, 'audio');
  const OUTPUT_VIDEO_FOLDER = path.join(PROJECT_PATH, 'output_video');
  const OUTPUT_VIDEO_PATH = path.join(OUTPUT_VIDEO_FOLDER, 'output.mp4');
  const FINALLY_FOLDER = path.join(PROJECT_PATH, 'finally');
  const GEMINI_MODEL = 'gemini-1.5-pro-001';
  const TTS_Type = 'openai';
  return {
    PROJECT_NAME :PROJECT_NAME,
    USER_DATA_PATH: USER_DATA_PATH,
    PROJECT_PATH: PROJECT_PATH,
    OUTPUT_JSON_PATH: output_json,
    CLIPS_FOLDER: CLIPS_FOLDER,
    GEMINI_MODEL: GEMINI_MODEL,
    AUDIO_FOLDER: AUDIO_FOLDER,
    OUTPUT_VIDEO_FOLDER: OUTPUT_VIDEO_FOLDER,
    OUTPUT_VIDEO_PATH: OUTPUT_VIDEO_PATH,
    VIDEO_PATH: VIDEO_PATH,
    AUDIO_FOLDER: AUDIO_FOLDER,
    FINALLY_FOLDER: FINALLY_FOLDER,
    TTS_Type: TTS_Type,
    GEMINI_OUTPUT_PATH: GEMINI_OUTPUT_PATH
  };
}

export { constants };