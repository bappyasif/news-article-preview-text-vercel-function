import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';  // Modern import style
import robotsParser from 'robots-parser';

async function getRobotsTxt(url) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    return res.text();
}

export default async function handler(req, res) {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        // Fetch the robots.txt and check if scraping is allowed
        const robotsTxt = await getRobotsTxt(url);

        const robots = robotsParser(url, robotsTxt);

        if (!robots.isAllowed(url, 'my-user-agent')) {
            return res.status(403).json({ error: 'This site does not allow scraping.' });
        }

        // Fetch the page content
        const response = await fetch(url);
        const html = await response.text();

        // First, Cheerio to quickly check if the page has an <article> or meaningful content
        const $ = cheerio.load(html);

        // Optional: you can pre-validate if page structure is good enough
        const mainContentExists = $('article').length > 0 || $('main').length || $('section').length || $('body').length || $('body').find('firs-child > div').length > 0;
        if (!mainContentExists) {
            return res.status(400).json({ error: 'No article/main content found' });
        }

        // Now feed it into Readability for clean parsing
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            return res.status(500).json({ error: 'Failed to parse article' });
        }

        // Take first 200 characters
        // const previewText = article.textContent?.slice(0, 200) + "...";

        // trim and take ourt all html tags and advertisements
        const previewText = article.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) + "...";

        // const cleanedBody = article.textContent?.replace(/<[^>]*>/g, '').trim();

        const cleanedBody = article.textContent?.replace(/<[^>]*>/g, '')
            .replace(/By .*?\./g, '') // remove author names
            .replace(/\d{1,2} [a-zA-Z]{3,9} \d{4}/g, '') // remove dates
            .replace(/at .*? ET/g, '') // remove times
            .replace(/\d+ min read/g, '') // remove read times
            .replace(/Getty Images/g, '') // remove image credits
            .trim();

        res.status(200).json({
            title: article.title,
            preview: previewText,
            sourceUrl: url,
            content: article.content,
            body: article.textContent,
            cleanedBody: cleanedBody
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
}
