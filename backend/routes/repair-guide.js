const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const ai = require('../utils/geminiClient');

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, category, description } = req.body;

    if (!name || !category) {
      const err = new Error('Request must include "name" and "category".');
      err.statusCode = 400;
      throw err;
    }

    const itemContext = `${name} (${category})${description ? ` — ${description}` : ''}`;

    const prompt = `Search the web and find the best way to repair this item: ${itemContext}.

Using real search results, provide:
1. A numbered step-by-step DIY repair guide specific to this item (4-6 steps)
2. The difficulty level (Easy / Medium / Hard)
3. Estimated repair time

Format your response EXACTLY like this (include all labels):
DIFFICULTY: <Easy|Medium|Hard>
TIME: <e.g. 30 minutes>
STEPS:
1. <step>
2. <step>
3. <step>
4. <step>

Do not add any other text outside this format.`;

    // Retry up to 2 times on 503 (high demand)
    let response;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });
        break; // success — exit retry loop
      } catch (err) {
        const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand');
        if (is503 && attempt < 2) {
          console.log(`[repair-guide] 503 on attempt ${attempt}, retrying…`);
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }

    const rawText = response.text ?? '';
    console.log('[repair-guide] Raw response:', rawText);

    // ── Parse structured text response ────────────────────────────
    const difficultyMatch = rawText.match(/DIFFICULTY:\s*(.+)/i);
    const timeMatch = rawText.match(/TIME:\s*(.+)/i);
    const stepsMatch = rawText.match(/STEPS:\s*([\s\S]+)/i);

    const difficulty = difficultyMatch ? difficultyMatch[1].trim() : 'Medium';
    const estimatedTime = timeMatch ? timeMatch[1].trim() : 'Unknown';

    let steps = [];
    if (stepsMatch) {
      steps = stepsMatch[1]
        .split(/\n/)
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line) => line.length > 0);
    }

    // ── Extract grounding sources (YouTube + guides) ──────────────
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const allLinks = groundingChunks
      .filter((chunk) => chunk.web?.uri)
      .map((chunk) => ({ title: chunk.web.title || 'View Source', url: chunk.web.uri }));

    const youtubeLinks = allLinks
      .filter((l) => l.url.includes('youtube.com') || l.url.includes('youtu.be'))
      .slice(0, 2);

    const guideLinks = allLinks
      .filter((l) => !l.url.includes('youtube.com') && !l.url.includes('youtu.be'))
      .slice(0, 3);

    // ── Fallback: generate YouTube search URL if no results ───────
    if (youtubeLinks.length === 0) {
      const query = encodeURIComponent(`how to repair ${itemContext}`);
      youtubeLinks.push({
        title: `Search YouTube: how to repair ${name}`,
        url: `https://www.youtube.com/results?search_query=${query}`,
      });
    }

    res.json({
      success: true,
      steps,
      youtubeLinks,
      guideLinks,
      difficulty,
      estimatedTime,
    });
  })
);

module.exports = router;
