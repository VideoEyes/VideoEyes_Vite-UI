const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

export async function mergeAllAudioToVideo(videoPath, speechesFolderPath, outputFolder) {
    const outputPath = path.join(outputFolder, 'output.mp4');
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }
    
    const audioFiles = fs.readdirSync(speechesFolderPath).filter(file => file.endsWith('.mp3'));

    // Prepare inputs and filters for ffmpeg
    const inputs = [];
    const filters = [];
    let filterIndex = 1; // Start from 1 because 0 is the video input

    for (const audioFile of audioFiles) {
        const audioPath = path.join(speechesFolderPath, audioFile);

        const delay = audioFile.replace('.mp3', '').replace(/_/g, ':');
        console.log('delay:', delay);

        const parts = delay.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseFloat(parts[2]);
        const now_time = parseInt(((hours * 60 * 60) + (minutes * 60) + seconds) * 1000);
        console.log('delay:', now_time);

        inputs.push(audioPath);
        filters.push({
            filter: 'adelay',
            options: `${now_time}|${now_time}`,
            inputs: `[${filterIndex}:a]`,
            outputs: `[delayed${filterIndex}]`
        });
        filters.push({
            filter: 'volume',
            options: '3.0',  // Increase volume by 2 times
            inputs: `[delayed${filterIndex}]`,
            outputs: `[volume${filterIndex}]`
        });
        filterIndex++;
    }

    const amixInputs = `[0:a]` + filters.filter(f => f.filter === 'volume').map((_, index) => `[volume${index + 1}]`).join('');

    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        command.input(videoPath);

        // Add all audio inputs
        inputs.forEach(audioPath => command.input(audioPath));

        // Apply all filters
        filters.forEach(filter => {
            command.complexFilter([filter]);
        });

        // Mix all audio tracks including the original audio track
        command.complexFilter([
            ...filters,
            {
                filter: 'amix',
                options: `inputs=${filters.length / 2 + 1}:duration=longest`,
                inputs: amixInputs,
                outputs: 'a'
            }
        ]);

        command
            .outputOptions('-map 0:v')
            .outputOptions('-map [a]')
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .outputOptions('-shortest')
            .output(outputPath)
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
}




export async function mergeAudioToVideo(videoPath, audioPath, outputPath, now_time) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .complexFilter(
                `[1:a]adelay=${now_time}|${now_time}[delayed]; [0:a][delayed]amix=inputs=2:duration=first[a]`
            )
            .outputOptions('-map 0:v')
            .outputOptions('-map [a]')
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .outputOptions('-shortest')
            .output(outputPath)
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
}

module.exports = { mergeAllAudioToVideo, mergeAudioToVideo };


// module.exports = { mergeAudioToVideo };
