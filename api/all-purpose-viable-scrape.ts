import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';

async function getRobotsTxt(url) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    return res.text();
}

// Scraping and preview logic
export default async function handler(req, res) {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Fetch the robots.txt and check if scraping is allowed
        const robotsTxt = await getRobotsTxt(url);

        const robots = robotsParser(url, robotsTxt);

        if (!robots.isAllowed(url, 'my-user-agent')) {
            return res.status(403).json({ error: 'This site does not allow scraping.' });
        }

        // Fetch the page content
        const pageRes = await fetch(url);

        const html = await pageRes.text();

        // Parse the HTML with Cheerio
        const $ = cheerio.load(html);

        // const texts = $('body').text();

        // const text = $('article').first().find('section[name="articleBody"]').text();

        // Remove all script and style tags
        $('script, style, link, meta, title, head, noscript, header, footer, nav, aside, footer, address').remove();
        // $('body > *:not(article, main, section)').remove();

        // Extract the text content
        const text = $.text();

        // Remove excess whitespace and trim the text
        const cleanedText = text.trim().replace(/\s+/g, ' ');

        // Respond with preview text
        return res.status(200).json({ preview: cleanedText });
    } catch (error) {
        console.error('Error scraping:', error);
        return res.status(500).json({ error: 'An error occurred during scraping' });
    }
}