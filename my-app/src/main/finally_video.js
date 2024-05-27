import { get } from 'http';

const constants = require('./constants.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

export async function finally_video() {
    // var total_mp3 = get_audio_files_count();
    fs.readdir(constants.AUDIO_FOLDER, (err, files) => {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
        files.forEach(file => {
            var flag = true;
            var delay = "";
            if (flag) {
                var videoPath = constants.CLIPS_FOLDER + '/video.mp4';
                flag = false;
            } else {
                var videoPath = constants.FINALLY_FOLDER + '/final.mp4';
            }
            fs.readFile(constants.OUTPUT_JSON_PATH, 'utf8', (err, data) => {
                if (err) {
                    console.error('ERROR:', err);
                    return;
                }
                const jsonData = JSON.parse(data);
                delay = jsonData[scene_output_video]["scene-start-time"];
                var parts = delay.split(':');
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                const seconds = parseFloat(parts[2]);
                var now_time = 0;
                now_time = parseInt(((hours * 60 * 60) + (minutes * 60) + seconds) * 1000);
                return new Promise((resolve, reject) => {
                    ffmpeg()
                        .input(videoPath)
                        .input(file)
                        .complexFilter(
                            `[1:a]adelay=${now_time}|${now_time}[delayed]; [0:a][delayed]amix=inputs=2:duration=first[a]`
                        )
                        .outputOptions('-map 0:v')
                        .outputOptions('-map [a]')
                        .outputOptions('-c:v copy')
                        .outputOptions('-c:a aac')
                        .outputOptions('-shortest')
                        .output(constants.FINALLY_FOLDER + '/final.mp4')
                        .on('start', commandLine => console.log(`Spawned Ffmpeg with command: ${commandLine}`))
                        .on('error', (err, stdout, stderr) => {
                            console.error('Error:', err);
                            console.error('ffmpeg stdout:', stdout);
                            console.error('ffmpeg stderr:', stderr);
                            reject(err);
                        })
                        .on('end', () => {
                            console.log('Finished processing');
                            resolve();
                        })
                        .run();
                });
            });
        });
    });
}

// export function get_audio_files_count() {
//     fs.readdir(constants.AUDIO_FOLDER, (err, files) => {
//         if (err) {
//             console.error('ERROR:', err);
//             return;
//         }
//         console.log('Number of files:', files.length);
//         return files.length;
//     });
// }