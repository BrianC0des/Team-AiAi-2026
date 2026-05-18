require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorMiddleware } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is healthy!',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler (must be last in the pipeline) ──────────────────
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
