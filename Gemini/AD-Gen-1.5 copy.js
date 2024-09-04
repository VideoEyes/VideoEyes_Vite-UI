const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');


const vertexAI = new VertexAI({ project: 'gemini-rain-py', location: 'us-central1' });
const storage = new Storage({ projectId: 'gemini-rain-py' });
const bucketName = 'gemini-ad-gen';

async function gemini_sendMultiModalPromptWithVideo(projectId, location, model, uri) {
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
        };

        const response = await generativeVisionModel.generateContent(request);
        const aggregatedResponse = await response.response;
        const fullTextResponse = aggregatedResponse.candidates[0].content.parts[0].text;

        return fullTextResponse;
    } catch (err) {
        console.error(err);
    }
}


async function gemini_uploadFile(destFileName, filePath) {
    try {
        const options = { destination: destFileName };
        await storage.bucket(bucketName).upload(filePath, options);
        return `gs://${bucketName}/${destFileName}`;
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    const projectId = 'gemini-rain-py';
    const location = 'us-central1';
    const model = 'gemini-1.5-flash-001';
    const filePath = "E:/VideoMME/data/ejFVFtJdP3s.mp4";
    const destFileName = 'ejFVFtJdP3s.mp4';

    const uri = await gemini_uploadFile(destFileName, filePath);
    const response = await gemini_sendMultiModalPromptWithVideo(projectId, location, model, uri);
    console.log(response);
}

main().catch(console.error);