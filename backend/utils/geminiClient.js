// ─────────────────────────────────────────────────────────────────────────────
//  geminiClient.js
//  Initialises and exports a singleton Google GenAI client.
//
//  Dual-mode initialisation:
//    • GCP_PROJECT_ID set → Vertex AI (enterprise / production)
//    • GCP_PROJECT_ID absent → Google AI Studio (API key, local dev)
//
//  Usage:
//    const ai = require('./geminiClient');
//    const response = await ai.models.generateContent({ … });
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenAI } = require('@google/genai');

const isVertexAI = !!process.env.GCP_PROJECT_ID;

if (!isVertexAI && !process.env.GEMINI_API_KEY) {
  throw new Error(
    'Missing AI credentials: set GEMINI_API_KEY (Google AI Studio) ' +
    'or GCP_PROJECT_ID + GCP_LOCATION (Vertex AI).'
  );
}

const ai = isVertexAI
  ? new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_LOCATION || 'us-central1',
    })
  : new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

module.exports = ai;
