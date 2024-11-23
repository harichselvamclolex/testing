import readline from 'readline';
import puppeteer from 'puppeteer';
import ollama from 'ollama';

// Create readline interface to interact with the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to scrape the web content using Puppeteer
const fetchContentFromUrl = async (url) => {
  const browser = await puppeteer.launch();  // Launch the browser
  const page = await browser.newPage();  // Open a new page

  // Navigate to the URL
  await page.goto(url);

  // Extract the title, headings, and paragraphs
  const content = await page.evaluate(() => {
    const data = {};

    // Extract title
    data.title = document.title;

    // Extract headings (h1-h6)
    const headings = {};
    for (let i = 1; i <= 6; i++) {
      const headingTags = Array.from(document.querySelectorAll(`h${i}`));
      headings[`h${i}`] = headingTags.map(tag => tag.innerText);
    }

    // Extract all paragraph (p) tags
    const paragraphs = Array.from(document.querySelectorAll('p')).map(tag => tag.innerText);

    data.headings = headings;
    data.paragraphs = paragraphs;

    return data;
  });

  // Close the browser
  await browser.close();

  return content;
};

// Function to ask a question and get a response based on the scraped content
const askQuestion = async () => {
  rl.question('You: ', async (query) => {
    rl.question('Please provide a URL for the content to answer from: ', async (url) => {
      const content = await fetchContentFromUrl(url);
      if (!content) {
        console.log('Failed to retrieve content from the provided URL.');
        return askQuestion();
      }

      // Prepare the content for the model by converting it to a readable format
      const contentText = `
        Title: ${content.title}
        Headings: ${JSON.stringify(content.headings, null, 2)}
        Paragraphs: ${content.paragraphs.join('\n')}
      `;

      // Send the extracted content to Ollama to generate a response
      try {
        const response = await ollama.chat({
          model: 'qwen2.5:0.5b',  // Use the model you prefer
          messages: [
            { role: 'system', content: 'Please answer based solely on the provided content.' },
            { role: 'system', content: `Content: ${contentText}` },  // Add the scraped content
            { role: 'user', content: query }  // User query
          ],
        });

        console.log('Bot:', response.message.content);
        askQuestion();  // Continue the conversation
      } catch (error) {
        console.error('Error interacting with the model:', error);
        rl.close();
      }
    });
  });
};

// Start the conversation
askQuestion();
