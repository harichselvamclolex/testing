import { fileURLToPath } from 'url';
import path from 'path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import axios from 'axios';
import { load } from 'cheerio';
import readline from 'readline';

// Resolve __dirname in ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to your Llama model (.gguf file)
const modelPath = path.join('C:', 'Users', 'haric', '.node-llama-cpp', 'models', 'qwen2.5-0.5b-instruct-q2_k.gguf'); // Update this path accordingly

// Initialize readline interface for interactive CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>> '
});

/**
 * Function to prompt the user and get input asynchronously
 * @param {string} query - The question to prompt the user with
 * @returns {Promise<string>} - The user's input
 */
const promptUser = (query) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer.trim());
        });
    });
};

/**
 * Function to scrape webpage content using axios and cheerio
 * Extracts content from <head>, <p>, <caption>, and <title> tags
 * @param {string} url - The URL of the webpage to scrape
 * @returns {Promise<string>} - The concatenated text content
 */
const scrapeWebpage = async (url) => {
    try {
        console.log(`Fetching content from: ${url}`);
        const response = await axios.get(url);
        const html = response.data;

        const $ = load(html);

        // Extract text from <head>
        const headText = $('head').text();

        // Extract text from all <p> tags
        let pText = '';
        $('p').each((i, elem) => {
            pText += $(elem).text() + '\n';
        });

        // Extract text from all <caption> tags
        let captionText = '';
        $('caption').each((i, elem) => {
            captionText += $(elem).text() + '\n';
        });

        // Extract text from <title> tag
        const titleText = $('title').text();

        // Concatenate all extracted texts
        const concatenatedText = `${titleText}\n${headText}\n${pText}\n${captionText}`;

        // Optional: Limit the context size to avoid exceeding model's token limit
        const maxContextLength = 2000; // Adjust based on your model's capacity
        const trimmedContent = concatenatedText.substring(0, maxContextLength);

        console.log("Webpage content scraped successfully!");
        return trimmedContent;
    } catch (error) {
        console.error(`Error scraping webpage: ${error.message}`);
        return "";
    }
};

/**
 * Main function to run the chatbot
 */
const runChatbot = async () => {
    try {
        // Load the Llama model
        console.log(`Loading Llama model from: ${modelPath}`);
        const llama = await getLlama();
        const model = await llama.loadModel({
            modelPath: modelPath
        });
        console.log("Model loaded successfully!");

        // Create a new context for the model
        const contextInstance = await model.createContext();
        const session = new LlamaChatSession({
            contextSequence: contextInstance.getSequence()
        });

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
                const url = input.slice(5).trim();
                if (!url) {
                    console.log("Please provide a valid URL.");
                    rl.prompt();
                    return;
                }

                currentContext = await scrapeWebpage(url);
                if (currentContext) {
                    console.log("Context loaded and processed successfully!");
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
                    const prompt = `Context:\n${currentContext}\n\nUser: ${question}\nAI:`;
                    const botResponse = await session.prompt(prompt);
                    console.log(`AI: ${botResponse.trim()}`);
                } catch (error) {
                    console.error("Error generating reply:", error);
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
