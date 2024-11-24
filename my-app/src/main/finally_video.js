import { constants } from './constants.js';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export async function finally_video(Constant) {
    const audioFiles = fs.readdirSync(Constant.AUDIO_FOLDER).filter(file => file.endsWith('.mp3'));

    // Check if output directory exists
    if (!fs.existsSync(Constant.OUTPUT_VIDEO_FOLDER)) {
        fs.mkdirSync(Constant.OUTPUT_VIDEO_FOLDER, { recursive: true });
    }

    // Prepare inputs and filters for ffmpeg
    const inputs = [];
    const filters = [];
    let filterIndex = 1; // Start from 1 because 0 is the video input

    for (const audioFile of audioFiles) {
        const audioPath = path.join(Constant.AUDIO_FOLDER, audioFile);

        // Parse delay from filename
        const delay = audioFile.replace('.mp3', '').replace(/_/g, ':');
        console.log('delay:', delay);

        const parts = delay.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseFloat(parts[2]);
        const now_time = parseInt(((hours * 60 * 60) + (minutes * 60) + seconds) * 1000);

  
        inputs.push(audioPath);

        
        filters.push({
            filter: 'adelay',
            options: `${now_time}|${now_time}`, 
            inputs: `[${filterIndex}:a]`,
            outputs: `[delayed${filterIndex}]`
        });
        filters.push({
            filter: 'loudnorm',
            options: 'I=-16:LRA=11:TP=-1.5', 
            inputs: `[delayed${filterIndex}]`,
            outputs: `[loudnorm${filterIndex}]`
        });
        filters.push({
            filter: 'volume',
            options: '4.0', 
            inputs: `[loudnorm${filterIndex}]`,
            outputs: `[volume${filterIndex}]`
        });

        filterIndex++;
    }

    // Construct the inputs for amix
    const amixInputs = `[0:a]` + filters
        .filter(f => f.filter === 'volume')
        .map((_, index) => `[volume${index + 1}]`)
        .join('');

    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        command.input(path.join(Constant.CLIPS_FOLDER, "video.mp4"));

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
                options: `inputs=${filters.length / 3 + 1}:duration=longest`, // Divide by 3 (adelay, loudnorm, volume per audio)
                inputs: amixInputs,
                outputs: 'a'
            }
        ]);

        command
            .outputOptions('-map 0:v') // Use the original video
            .outputOptions('-map [a]') // Use the mixed audio
            .outputOptions('-c:v copy') // Copy video codec
            .outputOptions('-c:a aac') // Use AAC for audio
            .outputOptions('-shortest') // Stop when the shortest stream ends
            .output(path.join(Constant.OUTPUT_VIDEO_FOLDER, "output.mp4"))
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