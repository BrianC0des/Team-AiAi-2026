require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { asyncHandler, errorMiddleware } = require('./utils/errorHandler');
const groq = require('./utils/groqClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ── Serve frontend static files ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is healthy!',
    timestamp: new Date().toISOString(),
  });
});

// ── POST /api/chat ────────────────────────────────────────────────────────
//  Body: { "prompt": "your message here" }
//  Returns: { "success": true, "reply": "<model response>" }
app.post(
  '/api/chat',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      const err = new Error('Request body must include a non-empty "prompt" string.');
      err.statusCode = 400;
      throw err;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt.trim() }],
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    res.json({ success: true, reply });
  })
);

// ── Global error handler (must be last in the pipeline) ──────────────────
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
