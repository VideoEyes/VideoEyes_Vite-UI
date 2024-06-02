const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');


const vertexAI = new VertexAI({ project: 'gemini-rain-py', location: 'us-central1' });
const storage = new Storage({ projectId: 'gemini-rain-py' });
const bucketName = 'gemini-ad-gen';

export async function gemini_1_5_sendMultiModalPromptWithVideo(projectId, location, model, uri) {
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
                            text: "創建一個簡短的口述影像腳本並包含時間點(精確至毫秒)。儘量貼近原作品再現的原則。無須描述對話。以下方josn格式回覆: \
                            { \
                                \"time\": \"00:00:00.000\", \
                                \"content\": \"這是一個簡短的口述影像腳本\" \
                            }"
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                topP: 0.4,
                // maxOutputTokens: 150,
            },
            systemInstruction: {
                parts: [{ "text": `你是專業的口述影像搞生成器，只回覆json格式` }]
            },

        };

        const response = await generativeVisionModel.generateContent(request);
        const aggregatedResponse = await response.response;
        const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

        return fullTextResponse;
    } catch (err) {
        console.error(err);
        throw err;
    }
}


export async function gemini_1_5_uploadFile(destFileName, filePath) {
    try {
        const options = { destination: destFileName };
        await storage.bucket(bucketName).upload(filePath, options);
        return `gs://${bucketName}/${destFileName}`;
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    gemini_1_5_sendMultiModalPromptWithVideo,
    gemini_1_5_uploadFile
};
