
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const cv = require('opencv4nodejs');
const path = require('path')


// 初始化 OpenAI API 客戶端
const client = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
});

// 讀取視頻並提取幀
const videoPath = 'AD001.mp4'
const video = new cv.VideoCapture(videoPath);

let base64Frames = [];
let frame;
while (frame = video.read()) {
  const base64Image = cv.imencode('.jpg', frame).toString('base64');
  base64Frames.push(base64Image);
}

console.log(`${base64Frames.length} frames read.`);

// 生成旁白腳本
async function generateVoiceoverScript() {
  const promptMessages = [
    {
      role: 'user',
      content: {
        text: '這些是影片的幀。創建一個簡短的口述影像腳本。僅包含50字旁白，儘量貼近原作品再現的原則。無須描述對話。',
        images: base64Frames.filter((_, index) => index % 60 === 0).map(img => ({ image: img, resize: 768 }))
      }
    }
  ];

  try {
    const response = await client.post('/chat/completions', {
      model: 'gpt-4o',
      messages: promptMessages,
      max_tokens: 500
    });
    console.log(response.data.choices[0].message.content);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating voiceover script:', error);
  }
}

// 生成語音旁白
async function generateVoiceover(script) {
  try {
    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1-1106',
      input: script,
      voice: 'onyx'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      responseType: 'stream'
    });

    const writer = fs.createWriteStream('voiceover.mp3');
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log('Voiceover saved to voiceover.mp3');
    });
  } catch (error) {
    console.error('Error generating voiceover:', error);
  }
}

// 主函數
(async () => {
  const script = await generateVoiceoverScript();
  if (script) {
    await generateVoiceover(script);
  }
})();
