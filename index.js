import express from 'express';
import cors from 'cors';
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";


dotenv.config();


const app = express();


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

let users = [];
const secretKey = process.env.Secret_Key;
console.log(secretKey)
console.log(users)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '21d45ao305@gmail.com',
    pass: 'ejnb pjfr kjoq syfs',
  },
  tls: {
    rejectUnauthorized: false,
  }
});


// const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);
// const model = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash-exp",
// });

// const generationConfig = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "text/plain",
// };

// async function run(prompt) {
//   const chatSession = model.startChat({
//     generationConfig,
//     history: [],
//   });
  
//   const result = await chatSession.sendMessage(prompt);
//   return result.response.text();
// }

// import {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } from  "@google/generative-ai" ;

// const {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};


async function run(prompt) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating AI response:", error.message);
    throw new Error("Failed to fetch AI response.");
  }
}



app.post("/prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(404).json({ error: "Prompt is required and must be a string.", input: prompt, server: "server connected" });
    }

    const response = await run(prompt);
    res.status(200).json({ prompt, response });
    console.log(response)
  } catch (error) {
    console.log("Error occurred:", error);
    return res.status(404).json({ error: "An error occurred while processing the request." });
  }
});

app.post("/register", (req, res) => {
  const { email, username, password } = req.body;
 
 

  const user = users.find(u => u.username === username && u.password === password)

  if(user){
    res.status(200).json({message : "uername already taken"})
    console.log(users)
  }else{
    users.push({username : username,password : password})
    res.status(400).json({message : "resgistered sucesfully",username,password})

  }
  // if (!email) return res.status(400).json({ error: "Email is required" });

  // const otp_value = Math.floor(100000 + Math.random() * 900000);
  // const mailOptions = {
  //   from: '21d45ao305@gmail.com',
  //   to: email,
  //   subject: `${otp_value} OTP received`,
  //   text: `${otp_value} This is a test email sent using Node.js and NodeMailer.`,
  // };

  // transporter.sendMail(mailOptions, (err, info) => {
  //   if (err) {
  //     console.error('Error:', err);
  //     return res.status(500).json({ error: "Error sending email" });
  //   } else {
  //     console.log('Email sent:', info.response);
  //     return res.status(200).json({ message: "Email sent successfully", otp: otp_value });
  //   }
  // });

});

app.post("/getotp", (req, res) => {
  const otp = Math.floor(Math.random() * 1000) + 1000;
  res.json({ otp });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  console.log(users)
  
  if (user) {
    const token1 = jwt.sign({ username: users.username }, secretKey, { expiresIn: "1h" });
    console.log(token1)
    return res.json({ token1 ,username : users.username ,password : users.password});
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
});


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send('Token is required');

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = decoded;
    next();
  });
};


app.get('/profile', verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.username}` });
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
