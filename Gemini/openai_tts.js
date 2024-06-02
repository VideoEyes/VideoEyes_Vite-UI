const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

async function AD_tts(timestamp, text) {
  try {
    mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
  }
  catch (err) {
    console.error(err);
  }
  const buffer = Buffer.from(await mp3.arrayBuffer());
  if (!fs.existsSync('./speeches')) {
      fs.mkdirSync('./speeches');
  }
  const timestampSafe = timestamp.replace(/:/g, '_');
  await fs.promises.writeFile(`./speeches/${timestampSafe}.mp3`, buffer);
}

module.exports = { AD_tts };