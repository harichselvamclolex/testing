const puppeteer = require('puppeteer');

(async () => {
    // Launch a new browser instance
    const browser = await puppeteer.launch();

    // Open a new page in the browser
    const page = await browser.newPage();

    // Navigate to the specified URL
    await page.goto('https://iamharichselvam.web.app/');

    // Extract title, h1-h6, and p tags
    const content = await page.evaluate(() => {
        const data = {};

        // Extract title
        data.title = document.title;

        // Extract h1-h6 tags
        const headings = {};
        for (let i = 1; i <= 6; i++) {
            const headingTags = Array.from(document.querySelectorAll(`h${i}`));
            headings[`h${i}`] = headingTags.map(tag => tag.innerText);
        }

        // Extract all p tags
        const paragraphs = Array.from(document.querySelectorAll('p')).map(tag => tag.innerText);

        data.headings = headings;
        data.paragraphs = paragraphs;

        return data;
    });

    // Print extracted data to the console
    console.log(content);

    // Close the browser
    await browser.close();
})();
