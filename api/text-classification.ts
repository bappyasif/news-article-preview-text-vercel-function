import { pipeline } from '@huggingface/transformers';

export default async function handler(req, res) {
    const classifier = await pipeline('sentiment-analysis');

    try {
        const { text } = req.body;

        if(!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await classifier(text);

        return res.status(200).json(result);
        
    } catch (error) {
        console.error(error);
    }
}