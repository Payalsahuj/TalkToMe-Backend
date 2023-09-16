const express=require("express")
const cors=require("cors")
const app=express()
require("dotenv").config()
app.use(express.json())
app.use(cors())

app.get("/user",(req,res)=>{
    res.send({msg:"okok"})
})

const { Configuration, OpenAIApi } = require("openai");


const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

const conversationHistory = [];

app.post("/talktome", async (req, res) => {
  try {
    const userMessage = req.body.value;

    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: userMessage });

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Please act as a smart human being with knowledge of field who can talk friendly. Answer questions and provide suggestions concisely in a friendly manner.Please try to make answers in most of 60 words, but if the answer can be short then give short answer, If a person say Hi or Hello then just say nice to meet you ",
        },
        ...conversationHistory, // Include conversation history
      ],
      max_tokens: 130,
      temperature: 0,
    });

    // Extract the chatbot's response from the API response
    const chatbotResponse =
      response.data.choices[0].message.content || "I'm sorry, I don't know what to say.";

    // Add chatbot's response to conversation history
    conversationHistory.push({ role: "assistant", content: chatbotResponse });

    res.status(200).send(chatbotResponse);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});




app.listen(process.env.port,()=>{
    try{
        console.log(`port is running at ${process.env.port}`)
    }
    catch(err){
        console.log(err)
    }
})