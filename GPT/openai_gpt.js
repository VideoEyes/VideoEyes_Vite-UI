const OpenAI = require('openai');
const process = require('process');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

async function extractFrames(videoPath) {
  return new Promise((resolve, reject) => {
    const frames = [];
    const ffmpegProcess = spawn(ffmpeg, ['-i', videoPath, '-vf', 'fps=1', '-f', 'image2pipe', '-']);
    
    ffmpegProcess.stdout.on('data', (data) => {
      frames.push(data);
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve(frames);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

async function compressFrame(frameBuffer) {
  return sharp(frameBuffer)
    .resize(320, 240) // Resize the image to reduce size
    .jpeg({ quality: 50 }) // Compress the image to reduce size
    .toBuffer();
}

async function main() {
  const videoPath = './AD001.mp4';
  const frames = await extractFrames(videoPath);

  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: '這些是影片的幀。創建一個簡短的口述影像腳本。僅包含50字旁白，儘量貼近原作品再現的原則。無須描述對話。' },
  ];

  for (let index = 0; index < frames.length; index++) {
    const compressedFrame = await compressFrame(frames[index]);
    const base64Image = compressedFrame.toString('base64');
    messages.push({ role: 'user', content: base64Image });
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o',
  });

  console.log(chatCompletion.choices[0].message.content);
}

main().catch(error => console.error(error));
