const { app } = require('electron');
const path = require('path');

const USER_DATA_PATH = app.getPath('userData');
const PROJECT_NAME = 'Project_Name';
const PROJECT_PATH = path.join(USER_DATA_PATH, PROJECT_NAME);
const output_json = path.join(PROJECT_PATH, 'json/main.json');
const CLIPS_FOLDER = path.join(PROJECT_PATH, 'video');

export const constants = {
  USER_DATA_PATH: USER_DATA_PATH,
  PROJECT_PATH: PROJECT_PATH,
  OUTPUT_JSON_PATH: output_json,
  CLIPS_FOLDER: CLIPS_FOLDER
};