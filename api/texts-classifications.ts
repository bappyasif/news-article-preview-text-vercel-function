import { pipeline } from '@huggingface/transformers';

export default async function handler(req, res) {
    const reviewer = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');

    try {
        const { texts } = req.body;

        if(!texts?.length) {
            return res.status(400).json({ error: 'Texts array is required' });
        }

        const results = await reviewer(texts);

        return res.status(200).json(results);
        
    } catch (error) {
        console.error("")
    }

    // const result = await reviewer('The Shawshank Redemption is a true masterpiece of cinema.');
    // [{label: '5 stars', score: 0.8167929649353027}]
}