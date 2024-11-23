import puppeteer from 'puppeteer';
import ollama from 'ollama';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize readline interface for interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>> ',
});

/**
 * Function to interact with Ollama using `ollama.js`
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} - The AI's response
 */
const getOllamaResponse = async (prompt) => {
  try {
    const response = await ollama.chat({
      model: 'qwen2.5:0.5b',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.message.content;
  } catch (error) {
    console.error(`Error communicating with Ollama: ${error.message}`);
    return "I'm sorry, I couldn't process that request.";
  }
};

/**
 * Function to scrape webpage content using Puppeteer
 * Extracts content from <title>, <h1>-<h6>, <p>, and <caption> tags
 * @param {string} url - The URL of the webpage to scrape
 * @returns {Promise<string>} - The concatenated text content
 */
const scrapeWebpage = async (url) => {
  let browser;
  try {
    console.log(`Launching headless browser to fetch: ${url}`);
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

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

      // Extract all caption tags
      const captions = Array.from(document.querySelectorAll('caption')).map(tag => tag.innerText);

      data.headings = headings;
      data.paragraphs = paragraphs;
      data.captions = captions;

      return data;
    });

    // Concatenate all extracted texts
    const concatenatedText = `
Title: ${content.title}

Headings:
${Object.entries(content.headings).map(([key, vals]) => `${key.toUpperCase()}:\n${vals.join('\n')}`).join('\n\n')}

Paragraphs:
${content.paragraphs.join('\n\n')}

Captions:
${content.captions.join('\n\n')}
        `;

    console.log("Webpage content scraped successfully!");
    console.log("Scraped Content:");
    console.log(concatenatedText);
    return concatenatedText;
  } catch (error) {
    console.error(`Error scraping webpage: ${error.message}`);
    return "";
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Main function to run the chatbot
 */
const runChatbot = async () => {
  try {
    console.log("Chatbot is ready!");
    console.log("Available Commands:");
    console.log("  load [URL] - Load context from a website URL");
    console.log("  ask [your question] - Ask a question based on the loaded context");
    console.log("  exit - Exit the chatbot");
    rl.prompt();

    let currentContext = "";

    rl.on('line', async (input) => {
      input = input.trim();

      if (input.toLowerCase() === 'exit') {
        console.log("Exiting chatbot. Goodbye!");
        rl.close();
        process.exit(0);
      }

      if (input.startsWith('load ')) {
        let url = input.slice(5).trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          console.log("Please provide a valid URL starting with http:// or https://.");
          rl.prompt();
          return;
        }

        currentContext = await scrapeWebpage(url);
        if (currentContext) {
          console.log("Context loaded successfully!");
        } else {
          console.log("Failed to load context from the provided URL.");
        }

        rl.prompt();
        return;
      }

      if (input.startsWith('ask ')) {
        const question = input.slice(4).trim();
        if (!question) {
          console.log("Please provide a valid question.");
          rl.prompt();
          return;
        }

        if (!currentContext) {
          console.log("No context loaded. Use 'load [URL]' to load context first.");
          rl.prompt();
          return;
        }

        try {
          console.log("Generating response...");
          const prompt = `Context:\n${currentContext}\n\nQuestion: ${question}`;
          const botResponse = await getOllamaResponse(prompt);
          console.log(`AI: ${botResponse}`);
        } catch (error) {
          console.error("Error generating reply:", error.message);
        }

        rl.prompt();
        return;
      }

      console.log("Invalid command. Use 'load [URL]', 'ask [your question]', or 'exit'.");
      rl.prompt();
    });

  } catch (error) {
    console.error("Error initializing chatbot:", error);
  }
};

// Start the chatbot
runChatbot();
