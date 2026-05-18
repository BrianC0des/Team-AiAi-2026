// ─────────────────────────────────────────────────────────────────────────────
//  groqClient.js
//  Initialises and exports a singleton Groq SDK client.
//
//  Usage:
//    const groq = require('./groqClient');
//    const completion = await groq.chat.completions.create({ … });
// ─────────────────────────────────────────────────────────────────────────────

const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing environment variable: GROQ_API_KEY');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = groq;
