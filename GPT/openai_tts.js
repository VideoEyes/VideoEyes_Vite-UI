const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

const speechFile = path.resolve("./speech.mp3");

async function test() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "地鐵站裡，乘客來去匆匆。一位老婦人焦急地四處奔走，尋找著小孩，四處張望及詢問民眾。她在人潮中擠來擠去，神色不安。",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}

async function AD_tts(timestamp, text) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(`./speeches/${timestamp}.mp3`, buffer);
}
