require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorMiddleware } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve frontend static files ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/health', require('./routes/health'));
app.use('/api/chat', require('./routes/chat'));

// ── Global error handler (must be last in the pipeline) ──────────────────
app.use(errorMiddleware);

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
