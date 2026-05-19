// ─────────────────────────────────────────────────────────────────────────────
//  geminiClient.js
//  Initialises and exports a singleton Google GenAI client (AI Studio mode).
//
//  Prerequisites:
//    • GEMINI_API_KEY — your Google AI Studio API key
//      Get one at: https://aistudio.google.com/app/apikey
//
//  Usage:
//    const ai = require('./geminiClient');
//    const response = await ai.models.generateContent({ … });
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    'Missing environment variable: GEMINI_API_KEY is required for Google AI Studio. ' +
    'Set GEMINI_API_KEY in your .env file. Get a key at https://aistudio.google.com/app/apikey'
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = ai;
