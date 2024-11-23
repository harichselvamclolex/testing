// npm install axios cheerio
const axios = require('axios');
const cheerio = require('cheerio');

// make a GET request to the specified URL
axios
    .get('https://iamharichselvam.web.app/')
    .then((response) => {
        // load the response data into Cheerio
        const $ = cheerio.load(response.data);

        // log the entire HTML content to the console
        console.log($.html());
    })
    .catch((error) => {
        // handle any errors that occur during the request
        console.error('Error:', error);
    });
