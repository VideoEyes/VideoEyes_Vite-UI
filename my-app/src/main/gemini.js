const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');


const vertexAI = new VertexAI({ project: 'pacific-booking-430416-e4', location: 'us-central1' });
const storage = new Storage();
const bucketName = 'moreexample';

export async function gemini_sendMultiModalPromptWithVideo(projectId, location, model, uri) {
    try {
        const generativeVisionModel = await vertexAI.getGenerativeModel({
            model: model,
        });

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
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                topP: 0.4,
                maxOutputTokens: 150,
            },
            
        };

        const response = await generativeVisionModel.generateContent(request);
        const aggregatedResponse = await response.response;
        const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

        return fullTextResponse;
    } catch (err) {
        console.error(err);
    }
}


export async function gemini_uploadFile(destFileName, filePath) {
    const options = { destination: destFileName };
    await storage.bucket(bucketName).upload(filePath, options);
    return `gs://${bucketName}/${destFileName}`;
}

module.exports = {
    gemini_sendMultiModalPromptWithVideo,
    gemini_uploadFile
};
