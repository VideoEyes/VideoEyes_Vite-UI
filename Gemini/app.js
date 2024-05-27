const {gemini_sendMultiModalPromptWithVideo , gemini_uploadFile} = require('./AD-Gen-1.5.js');
const {AD_tts} = require('./openai_tts.js');
const {mergeAllAudioToVideo} = require('./audio_merge.js');
const path = require('path');
const fs = require('fs');

const videoFile = 'video.mp4';

async function main() {
    const videoUri = await gemini_uploadFile('video.mp4', videoFile);
    console.log(videoUri);
    const audioText = await gemini_sendMultiModalPromptWithVideo('gemini-rain-py', 'us-central1', 'gemini-1.5-flash-preview-0514', videoUri);
    console.log(audioText);
    const jsonMatch = audioText.match(/```json\s*([\s\S]*?)\s*```/);
    let audioText_json = [];
    // 確保匹配到了 JSON 部分
    if (jsonMatch && jsonMatch[1]) {
        const jsonString = jsonMatch[1];
        try {
            audioText_json = JSON.parse(jsonString);
            console.log(audioText_json);
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    } else {
        console.error('No JSON found in the text.');
    }
    for (let i = 0; i < audioText_json.length; i++) {
        const timestamp = audioText_json[i].time;
        const text = audioText_json[i].content;
        await AD_tts(timestamp, text);
    }
    
    mergeAllAudioToVideo(videoFile, './speeches', 'output.mp4');
}

main().catch(console.error);