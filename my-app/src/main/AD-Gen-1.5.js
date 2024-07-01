const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');


const vertexAI = new VertexAI({ project: 'gemini-rain-py', location: 'us-central1' });
const storage = new Storage({ projectId: 'gemini-rain-py' });
const bucketName = 'gemini-ad-gen';

export async function gemini_1_5_sendMultiModalPromptWithVideo(projectId, location, model, uri, prompt = `創建一個簡短的口述影像腳本並包含時間點(精確至毫秒)。儘量貼近原作品再現的原則。無須描述對話。以下方josn格式回覆": \
                            { \
                                \"time\": \"00:01:02.020\", \
                                \"content\": \"這是一個簡短的口述影像腳本\", \
                            }`, systemInstruction = `你是專業的口述影像搞生成器，以下方josn格式回覆: \
                            { \
                                \"time\": \"00:01:02.020\", \
                                \"content\": \"這是一個簡短的口述影像腳本\", \
                            }`) { 
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
                            text: prompt,
                            //創建一個簡短的口述影像腳本並包含時間點(精確至毫秒)。儘量貼近原作品再現的原則。無須描述對話。
                            //這是一個簡短的口述影像腳本
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
                //你是專業的口述影像搞生成器
                parts: [{ "text":  systemInstruction}]
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
        return Promise.resolve(`gs://${bucketName}/${destFileName}`);
        //return `gs://${bucketName}/${destFileName}`;
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    gemini_1_5_sendMultiModalPromptWithVideo,
    gemini_1_5_uploadFile
};
