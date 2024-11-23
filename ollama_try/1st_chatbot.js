import express from 'express';
import ollama from 'ollama';

const app = express();
const router = express.Router();

// Middleware to parse JSON bodies
app.use(express.json());

// API endpoint to handle queries
router.post('/ask-query', async (req, res) => {
  const { query } = req.body;

  // Make sure the query is provided
  if (!query) {
    return res.status(400).send({ error: 'Query is required' });
  }

  try {
    // Call Ollama's chat API with the `qwen2.5:0.5b` model and the user's query
    const response = await ollama.chat({
      model: 'qwen2.5:0.5b', // Using the qwen2.5 model
      messages: [{ role: 'user', content: query }],
    });

    // Send the response from Ollama
    res.json({ reply: response.message.content });
  } catch (error) {
    console.error('Error interacting with the model:', error);
    res.status(500).send({ error: 'Error interacting with the model' });
  }
});

// Use the router for the /api path
app.use('/api', router);

// Set up the server to listen on a specific port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
