const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const ai = require('../utils/geminiClient');

const SYSTEM_PROMPT = `You are an expert sustainability assessor for a waste-reduction app called Scannable.
Your job is to analyze a physical item from its image and the user-provided details, then classify its condition and recommend the best eco-friendly action.

## Step 1 — Check if the image contains a physical item
First, determine whether the image shows a physical object that can be assessed for repair, recycling, or donation.

If the image does NOT show a physical item (e.g. it is a selfie, a group photo, food, a landscape, a screenshot, artwork, a document, or anything else that is not a tangible object), you must:
- Set "notAnItem" to true
- Set "detectedAs" to a short description of what the image actually shows (e.g. "a selfie", "food", "a landscape photo", "a screenshot")
- Set "unrecognizable" to false
- Leave all other fields as their default empty values
- Do NOT attempt to assess severity or recommend an action

If the image is clearly a physical item but you genuinely cannot assess its condition due to poor image quality, extreme blur, or insufficient detail:
- Set "unrecognizable" to true
- Set "notAnItem" to false
- Leave all other fields as their default empty values

## Step 2 — Assess the item condition (only if it is a physical item)

### Severity Categories

1. **Severely Damaged** — Broken beyond practical use, structurally compromised, heavily corroded, or poses a safety risk. Cannot be repaired or reused meaningfully.
   - Recommended action: "recycle"

2. **Slightly Damaged** — Visible wear, minor tears, surface scratches, or cosmetic damage but remains functional or wearable.
   - Recommended action: "donate" (preferred) or "recycle"

3. **Repairable** — Has a specific fixable defect (broken zipper, cracked screen, loose joint, dead battery) and can realistically be restored.
   - Recommended action: "repair"
   - Provide BOTH:
     a) "diyTips": 2–3 practical steps the user can do themselves at home
     b) "expertTips": 2–3 tips for bringing it to a professional (what type of expert, what to tell them, estimated complexity)

## Rules
- Base your judgment primarily on the IMAGE. Use category, name, and description as supporting context.
- Return ONLY a valid JSON object. No markdown, no extra text, no code fences.
- Confidence (0–100) reflects how certain you are about your assessment.

## Output Format (strict JSON)
{
  "severity": "Severely Damaged" | "Slightly Damaged" | "Repairable" | null,
  "recommendedAction": "recycle" | "donate" | "repair" | null,
  "confidence": <number 0-100>,
  "summary": "<1–3 sentence plain-English explanation>",
  "diyTips": ["<step 1>", "<step 2>"],
  "expertTips": ["<tip 1>", "<tip 2>"],
  "unrecognizable": false,
  "notAnItem": false,
  "detectedAs": ""
}`;

const cleanBase64 = (base64Str) => {
  if (typeof base64Str !== 'string') {
    return { mimeType: 'image/jpeg', data: '' };
  }
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (matches) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: 'image/jpeg',
    data: base64Str
  };
};

const buildPromptParts = ({ imageBase64, mimeType, category, name, description }) => {
  const textContext = `
Item Name: ${name}
Category: ${category}
User Description: ${description || 'No description provided.'}

Please assess this item and return your JSON report.`.trim();

  return [
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    },
    { text: textContext },
  ];
};

const parseGeminiResponse = (rawText) => {
  // Log raw response for debugging
  console.log('[analyze] Raw Gemini response:', rawText);

  if (typeof rawText !== 'string') {
    throw new Error('Gemini response is not a string');
  }

  // 1. Strip markdown fences if present
  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // 2. Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // fall through
  }

  // 3. Regex fallback — extract the first {...} block found anywhere in the text
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      let jsonSegment = match[0]
        .replace(/[\u0000-\u001F]+/g, ' ') // Clean control characters
        .replace(/,\s*}/g, '}')           // Clean trailing commas in objects
        .replace(/,\s*]/g, ']');          // Clean trailing commas in arrays
      return JSON.parse(jsonSegment);
    } catch (_) {
      // fall through
    }
  }

  throw new Error('No valid JSON structure found in Gemini response');
};

const validateResult = (parsed) => {
  const validSeverities = ['Severely Damaged', 'Slightly Damaged', 'Repairable'];
  const validActions = ['recycle', 'donate', 'repair'];

  // Not a physical item (selfie, food, landscape, etc.)
  if (parsed.notAnItem === true) {
    return {
      severity: null,
      recommendedAction: null,
      confidence: 0,
      summary: '',
      diyTips: [],
      expertTips: [],
      unrecognizable: false,
      notAnItem: true,
      detectedAs: typeof parsed.detectedAs === 'string' ? parsed.detectedAs : 'a non-item',
    };
  }

  // Item present but cannot be assessed (blurry, unclear)
  if (parsed.unrecognizable === true) {
    return {
      severity: null,
      recommendedAction: null,
      confidence: 0,
      summary: '',
      diyTips: [],
      expertTips: [],
      unrecognizable: true,
      notAnItem: false,
      detectedAs: '',
    };
  }

  return {
    severity: validSeverities.includes(parsed.severity) ? parsed.severity : 'Slightly Damaged',
    recommendedAction: validActions.includes(parsed.recommendedAction) ? parsed.recommendedAction : 'recycle',
    confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 70,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    diyTips: Array.isArray(parsed.diyTips) ? parsed.diyTips.slice(0, 3) : [],
    expertTips: Array.isArray(parsed.expertTips) ? parsed.expertTips.slice(0, 3) : [],
    unrecognizable: false,
    notAnItem: false,
    detectedAs: '',
  };
};

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { imageBase64: rawImageBase64, imageData, mimeType, category, name, description } = req.body;
    const imageBase64 = rawImageBase64 || imageData;

    // ── Validation ────────────────────────────────────────────────
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({
        success: false,
        needsImage: true,
        error: 'No image provided. Please upload or capture an image of the item.',
      });
    }

    if (!category || !name) {
      const err = new Error('Request must include "category" and "name".');
      err.statusCode = 400;
      throw err;
    }

    // ── Build multimodal prompt ───────────────────────────────────
    const { mimeType: detectedMimeType, data: cleanImageBase64 } = cleanBase64(imageBase64);
    const parts = buildPromptParts({
      imageBase64: cleanImageBase64,
      mimeType: mimeType || detectedMimeType,
      category,
      name,
      description
    });

    // ── Call Gemini 2.5 Flash (with retry on 503/429) ─────────────
    let response;
    const delays = [1000, 3000]; // wait 1s then 3s before retrying
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        });
        break; // success
      } catch (err) {
        const msg = err?.message || '';
        const status = err?.status;

        const is503 =
          status === 503 ||
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE');

        const is429 =
          status === 429 ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('quota');

        if (is429) {
          // Extract suggested retry delay from the error if available
          const retryMatch = msg.match(/retry in (\d+(\.\d+)?)s/i);
          const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : 6000;

          if (attempt < 1) {
            // Try once after the suggested delay
            console.log(`[analyze] 429 rate limit, retrying in ${waitMs}ms…`);
            await new Promise((r) => setTimeout(r, waitMs));
          } else {
            return res.status(429).json({
              success: false,
              retryable: false,
              error: 'Daily AI quota reached. Please try again tomorrow or upgrade your Gemini API plan.',
            });
          }
        } else if (is503 && attempt < delays.length) {
          console.log(`[analyze] 503 on attempt ${attempt + 1}, retrying in ${delays[attempt]}ms…`);
          await new Promise((r) => setTimeout(r, delays[attempt]));
        } else if (is503) {
          return res.status(503).json({
            success: false,
            retryable: true,
            error: 'Gemini is currently busy. Please wait a moment and try again.',
          });
        } else {
          throw err; // non-503/429 error — rethrow
        }
      }
    }

    const rawText = response.text ?? '';

    if (!rawText.trim()) {
      const err = new Error('Gemini returned an empty response.');
      err.statusCode = 502;
      throw err;
    }

    // ── Parse & validate ──────────────────────────────────────────
    let parsed;
    try {
      parsed = parseGeminiResponse(rawText);
    } catch (parseError) {
      console.error('[analyze] Failed to parse Gemini JSON:', rawText, parseError);
      const snippet = rawText.length > 80 ? rawText.substring(0, 80) + '...' : rawText;
      const err = new Error(`AI returned an unreadable response: "${snippet}". Please try again.`);
      err.statusCode = 502;
      throw err;
    }

    const result = validateResult(parsed);

    res.json({ success: true, ...result });
  })
);

module.exports = router;
