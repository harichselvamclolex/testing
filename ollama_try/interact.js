import readline from 'readline';
import ollama from 'ollama';

// Create readline interface to interact with the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get a response
const askQuestion = async () => {
  rl.question('You: ', async (query) => {
    try {
      const response = await ollama.chat({
        model: 'qwen2.5:0.5b',  // Using the qwen2.5 model
        messages: [{ role: 'user', content: query }],
      });

      console.log('Bot:', response.message.content);
      askQuestion();  // Continue the conversation
    } catch (error) {
      console.error('Error interacting with the model:', error);
      rl.close();
    }
  });
};

// Start the conversation
askQuestion();
