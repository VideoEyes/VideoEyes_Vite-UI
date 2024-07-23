const { app } = require('electron');
const path = require('path');

const USER_DATA_PATH = app.getPath('userData');
const PROJECT_NAME = 'Project_Name';
const PROJECT_PATH = path.join(USER_DATA_PATH, PROJECT_NAME);
const output_json = path.join(PROJECT_PATH, 'json/main.json');
const GEMINI_OUTPUT_PATH = path.join(PROJECT_PATH, 'json/gemini_output.json');
const CLIPS_FOLDER = path.join(PROJECT_PATH, 'video');
const VIDEO_PATH = path.join(CLIPS_FOLDER, 'video.mp4');
const AUDIO_FOLDER = path.join(PROJECT_PATH, 'audio');
const OUTPUT_VIDEO_FOLDER = path.join(PROJECT_PATH, 'output_video');
const OUTPUT_VIDEO_PATH = path.join(OUTPUT_VIDEO_FOLDER, 'output.mp4');
const FINALLY_FOLDER = path.join(PROJECT_PATH, 'finally');
const GEMINI_MODEL = 'gemini-1.5-pro-preview-0514';
const TTS_Type = 'openai'; // or 'python'
// const AUDIO_FOLDER = path.join(PROJECT_PATH, 'audio');

export const constants = {
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