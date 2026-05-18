// ─────────────────────────────────────────────────────────────────────────────
//  geminiClient.js
//  Initialises and exports a singleton Google GenAI client (Vertex AI mode).
//
//  Prerequisites:
//    • GCP_PROJECT_ID  — your Google Cloud project ID
//    • GCP_LOCATION    — region, e.g. us-central1 (defaults to us-central1)
//    • ADC credentials — run `gcloud auth application-default login` locally,
//                        or attach a service account on Cloud Run / GKE.
//
//  Usage:
//    const ai = require('./geminiClient');
//    const response = await ai.models.generateContent({ … });
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenAI } = require('@google/genai');

if (!process.env.GCP_PROJECT_ID) {
  throw new Error(
    'Missing environment variable: GCP_PROJECT_ID is required for Vertex AI. ' +
    'Set GCP_PROJECT_ID (and optionally GCP_LOCATION) in your .env file.'
  );
}

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION || 'us-central1',
});

module.exports = ai;
