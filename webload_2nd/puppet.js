// npm install puppeteer
const puppeteer = require('puppeteer');

// define an asynchronous function to run the puppeteer script
(async () => {
    // launch a new browser instance
    const browser = await puppeteer.launch();

    // open a new page in the browser
    const page = await browser.newPage();

    // navigate to the specified url
    await page.goto('https://iamharichselvam.web.app/');

    // get the html content of the page
    const content = await page.content();

    // print the page content to the console
    console.log(content);

    // close the browser
    await browser.close();
})();
