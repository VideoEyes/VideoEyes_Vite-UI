const constants = require('./constants.js');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

async function AD_tts(timestamp, text) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(path.join(constants.AUDIO_FOLDER, `${timestamp}.mp3`), buffer);
}

module.exports = {
  AD_tts,
};