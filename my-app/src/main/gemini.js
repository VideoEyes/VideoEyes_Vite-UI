const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');

async function uploadFile(destFileName, filePath, bucketName) {
    const storage = new Storage();
    const options = {
        destination: destFileName,
    };

    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${filePath} uploaded to ${bucketName}`);
    return `gs://${bucketName}/${destFileName}`;
}

async function sendMultiModalPromptWithVideo(
    projectId = '	gemini-rain-py',
    location = 'us-central1',
    model = 'gemini-1.0-pro-vision',
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
                        text: 'Describe this video.'
                        //'你是一個口述影像撰稿員，謹守「反映及再現原作」，做到「信、達、雅」，儘量貼近原作品再現的原則。僅依照此影片片段產生150字畫面描述，無須完整故事，可觀描述人物動作、畫面即可。將不確定的是誤用A、B、C...表示',
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.4,
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
    return fullTextResponse;
}