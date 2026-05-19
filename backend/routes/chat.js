const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const ai = require('../utils/geminiClient');

// POST /api/chat
// Body:    { "prompt": "your message here" }
// Returns: { "success": true, "reply": "<model response>" }
// AI:      Google AI Studio — gemini-2.0-flash
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      const err = new Error('Request body must include a non-empty "prompt" string.');
      err.statusCode = 400;
      throw err;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt.trim(),
    });

    const reply = response.text ?? '';
    res.json({ success: true, reply });
  })
);

module.exports = router;
