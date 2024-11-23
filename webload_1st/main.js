// main.js

import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { JSDOM } from "jsdom";
import readline from "readline";

// Get the directory name of the current module (this file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set the model path to the location you provided
const modelPath = "C:\\Users\\haric\\.node-llama-cpp\\models\\qwen2.5-0.5b-instruct-q2_k.gguf";

// Initialize readline interface for interactive CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>> '
});

async function runChat() {
    try {
        // Load the Llama model using node-llama-cpp
        console.log(`Loading model from: ${modelPath}`);
        const llama = await getLlama();
        const model = await llama.loadModel({
            modelPath: modelPath
        });
        console.log("Model loaded successfully!");

        // Create a new context for the model
        const context = await model.createContext();
        const session = new LlamaChatSession({
            contextSequence: context.getSequence()
        });

        console.log("Chatbot is ready!");
        console.log("Commands:");
        console.log("  load [URL] - Load context from a website URL");
        console.log("  ask [question] - Ask a question based on the loaded context");
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

                try {
                    console.log(`Fetching content from: ${url}`);
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch the URL: ${response.status} ${response.statusText}`);
                    }
                    const html = await response.text();

                    // Parse the HTML using JSDOM
                    const dom = new JSDOM(html);
                    const textContent = dom.window.document.body.textContent || "";

                    // Optional: Limit the context size to avoid exceeding model's token limit
                    const maxContextLength = 2000; // Adjust as needed
                    currentContext = textContent.substring(0, maxContextLength);
                    console.log("Context loaded and processed successfully!");
                } catch (error) {
                    console.error(`Error loading context: ${error.message}`);
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
        console.error("Error in chat:", error);
    }
}

// Run the chat function
runChat();
