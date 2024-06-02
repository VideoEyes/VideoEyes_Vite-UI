const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI();

export async function AD_tts(timestamp, text, output_folder) {
  let mp3;
  try {
    mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
  }
  catch (err) {
    console.error(err);
    throw err;
  }
  const buffer = Buffer.from(await mp3.arrayBuffer());
  if (!fs.existsSync(output_folder)) {
      fs.mkdirSync(output_folder);
  }
  const timestampSafe = timestamp.replace(/:/g, '_');
  await fs.promises.writeFile(`${output_folder}/${timestampSafe}.mp3`, buffer);
}

module.exports = { AD_tts };