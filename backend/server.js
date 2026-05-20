require('dotenv').config();
require('./utils/geminiRotator'); // Transparently patches GoogleGenAI for failover rotation
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorMiddleware } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Serve frontend static files ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/health', require('./routes/health'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/repair-guide', require('./routes/repair-guide'));
app.use('/api/nearby-shops', require('./routes/nearby-shops'));

// ── Global error handler (must be last in the pipeline) ──────────────────
app.use(errorMiddleware);

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
