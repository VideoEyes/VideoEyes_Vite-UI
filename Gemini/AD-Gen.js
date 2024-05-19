const { VertexAI } = require('@google-cloud/vertexai');

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function sendMultiModalPromptWithVideo(
    projectId = '	gemini-rain-py',
    location = 'us-central1',
    model = 'gemini-1.5-pro-preview-0514',
    uri = 'gs://gemini-ad-gen/pixel8.mp4'
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({ project: projectId, location: location });

    const generativeVisionModel = vertexAI.getGenerativeModel({
        model: model,
        
    });

    // Pass multimodal prompt
    const request = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        fileData: {
                            fileUri: uri,
                            mimeType: 'video/mp4',
                        },
                    },
                    {
                        text: '創建一個簡短的口述影像腳本。僅包含50字旁白，儘量貼近原作品再現的原則。無須描述對話。'
                        //'你是一個口述影像撰稿員，謹守「反映及再現原作」，做到「信、達、雅」，儘量貼近原作品再現的原則。僅依照此影片片段產生150字畫面描述，無須完整故事，可觀描述人物動作、畫面即可。將不確定的是誤用A、B、C...表示',
                    },
                ],
            },
        ],
        generationConfig: {
            //temperature: 0.2,
            //topP: 0.4,
            // topK: 2,
            // candidateCount: integer,
            // maxOutputTokens: integer,
            // stopSequences: [
            //   string
            // ]
          }
    };

    // Create the response
    const response = await generativeVisionModel.generateContent(request);
    // Wait for the response to complete
    const aggregatedResponse = await response.response;
    // Select the text from the response
    const fullTextResponse =
        aggregatedResponse.candidates[0].content.parts[0].text;

    console.log(fullTextResponse);
}

// Read the video file and upload it to a Google Cloud Storage bucket
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

async function uploadFile(destFileName, filePath, bucketName) {
    const storage = new Storage();
    const options = {
        destination: destFileName,
        // Optional:
        // Set a generation-match precondition to avoid potential race conditions
        // and data corruptions. The request to upload is aborted if the object's
        // generation number does not match your precondition. For a destination
        // object that does not yet exist, set the ifGenerationMatch precondition to 0
        // If the destination object already exists in your bucket, set instead a
        // generation-match precondition using its generation number.
        // preconditionOpts: { ifGenerationMatch: generationMatchPrecondition },
    };

    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${filePath} uploaded to ${bucketName}`);
    return `gs://${bucketName}/${destFileName}`;
}
// Run the sample
const bucketName = 'gemini-ad-gen';
const videoFile = 'AD001.mp4';
async function main() {
    const vido_uri = await uploadFile(videoFile, videoFile, bucketName);
    // console.log('Video URI:', vido_uri);
    // console.log('Sending multimodal prompt with video...');
    sendMultiModalPromptWithVideo('gemini-rain-py', 'us-central1', 'gemini-1.5-pro-preview-0514', vido_uri);
}

main().catch(console.error);