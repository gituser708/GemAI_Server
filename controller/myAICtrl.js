require('dotenv').config({ quiet: true });
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const ContentHistory = require('../models/ContentHistory');
const User = require('../models/User');

const myAICtrl = {
  geminiAI: asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    // 🔹 Validate request
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    try {
      // 🔹 Call Gemini API
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7, // 0.2 = factual, 1.0 = more creative
            maxOutputTokens: 512, // Limit to 512 tokens
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // 🔹 Extract generated content safely
      const content =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

      // 🔹 Save content history
      const newContent = await ContentHistory.create({
        user: req?.user?._id,
        content,
      });

      // 🔹 Update user history & request count
      const userFound = await User.findById(req?.user?.id);
      if (userFound) {
        userFound.history.push(newContent?._id);
        userFound.apiRequestCount += 1;
        await userFound.save();
      }

      // 🔹 Send response to frontend
      res.status(200).json({ content });
    } catch (error) {
      console.error('Gemini API Error:', error?.response?.data || error.message);

      res.status(error?.response?.status || 500).json({
        error: error?.response?.data?.error?.message || 'Something went wrong with Gemini API',
      });
    }
  }),
};

module.exports = myAICtrl;
