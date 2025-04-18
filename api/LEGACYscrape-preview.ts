// import * as cheerio from 'cheerio';
// import robotsParser from 'robots-parser';

// // Helper function to get robots.txt
// async function getRobotsTxt(url) {
//     const robotsUrl = new URL('/robots.txt', url).href;
//     const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
//     const res = await fetch(robotsUrl);
//     return res.text();
// }

// // Scraping and preview logic
// export default async function handler(req: Request, res) {
//     const { url } = await req.json();

//     if (!url) {
//         return res.status(400).json({ error: 'URL is required' });
//     }

//     try {
//         // Fetch the robots.txt and check if scraping is allowed
//         const robotsTxt = await getRobotsTxt(url);
//         const robots = robotsParser(url, robotsTxt);

//         if (!robots.isAllowed(url, 'my-user-agent')) {
//             return res.status(403).json({ error: 'This site does not allow scraping.' });
//         }

//         // Fetch the page content
//         const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
//         const pageRes = await fetch(url);
//         const html = await pageRes.text();

//         // Parse the HTML with Cheerio
//         const $ = cheerio.load(html);
//         const text = $('p').first().text().slice(0, 200); // Extract first 200 characters of first paragraph

//         // Respond with preview text
//         return res.status(200).json({ preview: text });
//     } catch (error) {
//         console.error('Error scraping:', error);
//         return res.status(500).json({ error: 'An error occurred during scraping' });
//     }
// }

// import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
// import RobotsParser from 'robots-parser';
import robotsParser from 'robots-parser';

// Helper function to get robots.txt
// async function getRobotsTxt(url) {
//     const robotsUrl = new URL('/robots.txt', url).href;
//     //   const res = await fetch(robotsUrl);
//     // Dynamically import node-fetch
//     const fetch = (await import('node-fetch')).default;
//     const res = await fetch(robotsUrl);
//     return res.text();
// }

async function getRobotsTxt(url) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    return res.text();
}

// Scraping and preview logic
export default async function handler(req, res) {
    // const { url } = await req.json();
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Fetch the robots.txt and check if scraping is allowed
        const robotsTxt = await getRobotsTxt(url);
        // const robots = new RobotsParser(robotsTxt, url);

        const robots = robotsParser(url, robotsTxt);

        if (!robots.isAllowed(url, 'my-user-agent')) {
            return res.status(403).json({ error: 'This site does not allow scraping.' });
        }

        // Fetch the page content
        const pageRes = await fetch(url);
        const html = await pageRes.text();

        // Parse the HTML with Cheerio
        const $ = cheerio.load(html);
        // const text = $('p').first().text().slice(0, 200); // Extract first 200 characters of first paragraph
        // 546 characters are initial response that been recieved from tnyt server along with preview text
        // const text = $('article').first().text().slice(546, 546 + 400); // Extract first 400 characters of first article element
        // const text = $('article').first().text() // lets get it in full
        const text = $('article').first().find('section[name="articleBody"]').text();

        // Respond with preview text
        return res.status(200).json({ preview: text });
    } catch (error) {
        console.error('Error scraping:', error);
        return res.status(500).json({ error: 'An error occurred during scraping' });
    }
}