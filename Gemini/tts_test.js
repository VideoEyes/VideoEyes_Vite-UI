const path = require('path');
const fs = require('fs'); 
const { mergeAllAudioToVideo } = require('./audio_merge.js');

const videoFile = 'video.mp4';
//將speeches資料夾裡的音檔合併到影片上
async function main() {
    mergeAllAudioToVideo(videoFile, './speeches', 'output.mp4');
}

main().catch(console.error);


