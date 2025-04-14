const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(cors());

app.get("/user", (req, res) => {
  res.send({ msg: "okok" });
});

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

// Store conversation history for each session
// In a production app, you'd use a database or Redis
const sessions = {};

app.post("/talktome", async (req, res) => {
  try {
    const userMessage = req.body.value;

    // Get a unique identifier for the session (in a real app, use session IDs)
    // For simplicity, we'll use IP address here
    const sessionId = req.ip || "default";

    // Initialize session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = [
        {
          role: "system",
          content:
            "Please act as a smart human being with knowledge of field who can talk friendly. Answer questions and provide suggestions concisely in a friendly manner. Please try to make answers in most of 60 words, but if the answer can be short then give short answer. If a person says Hi or Hello then just say nice to meet you. Only say 'nice to meet you' on the first greeting of a conversation.",
        },
      ];
    }

    // Add user message to history
    sessions[sessionId].push({
      role: "user",
      content: userMessage,
    });

    // Limit conversation history to prevent token overflow
    // Keep the system message and last 10 exchanges (20 messages)
    if (sessions[sessionId].length > 21) {
      sessions[sessionId] = [
        sessions[sessionId][0], // Keep system message
        ...sessions[sessionId].slice(-20), // Keep last 20 messages
      ];
    }

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: sessions[sessionId],
      max_tokens: 130,
      temperature: 0,
    });

    const chatbotResponse =
      response.data.choices[0].message.content ||
      "I'm sorry, I don't know what to say.";

    // Add assistant response to history
    sessions[sessionId].push({
      role: "assistant",
      content: chatbotResponse,
    });

    res.status(200).send(chatbotResponse);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ message: error.message });
  }
});

app.post("/reset-conversation", (req, res) => {
  const sessionId = req.ip || "default";
  if (sessions[sessionId]) {
    // Keep only the system message
    sessions[sessionId] = [sessions[sessionId][0]];
    res.status(200).send({ message: "Conversation reset successfully" });
  } else {
    res.status(404).send({ message: "Session not found" });
  }
});

app.listen(process.env.port, () => {
  try {
    console.log(`port is running at ${process.env.port}`);
  } catch (err) {
    console.log(err);
  }
});
