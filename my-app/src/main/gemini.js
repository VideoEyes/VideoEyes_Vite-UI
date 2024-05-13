const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');


const vertexAI = new VertexAI({ project: 'gemini-rain-py', location: 'us-central1' });
const storage = new Storage();
const bucketName = 'gemini-ad-gen';

async function sendMultiModalPromptWithVideo(projectId, location, model, uri) {
    const generativeVisionModel = vertexAI.getGenerativeModel({ model });

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
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.4,
          }
    };

    const response = await generativeVisionModel.generateContent(request);
    const aggregatedResponse = await response.response;
    const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

    return fullTextResponse;
}

async function uploadFile(destFileName, filePath) {
    const options = { destination: destFileName };
    await storage.bucket(bucketName).upload(filePath, options);
    return `gs://${bucketName}/${destFileName}`;
}

module.exports = {
    sendMultiModalPromptWithVideo,
    uploadFile
};
