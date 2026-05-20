// ─────────────────────────────────────────────────────────────────────────────
//  geminiRotator.js
//  Transparently patches the @google/genai module to automatically rotate
//  API keys upon rate limit (429) or quota exhaustion.
//  This runs completely invisibly and requires no changes to standard code.
// ─────────────────────────────────────────────────────────────────────────────

const genaiModule = require('@google/genai');
const OriginalGoogleGenAI = genaiModule.GoogleGenAI;

class PatchedGoogleGenAI extends OriginalGoogleGenAI {
  constructor(options) {
    super(options);

    // Gather all available keys from the environment settings
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean);

    // If there are no fallback keys, don't apply the rotation patch
    if (keys.length <= 1) {
      return;
    }

    console.log(`[geminiRotator] Intercepted GoogleGenAI client construction. Active failover keys: ${keys.length}`);

    // Create alternative client instances using the original class
    const alternateClients = keys.map(key => new OriginalGoogleGenAI({ ...options, apiKey: key }));
    let activeIndex = 0;

    // Wrap the models.generateContent function on the instance
    if (this.models && typeof this.models.generateContent === 'function') {
      this.models.generateContent = async (params) => {
        let lastError;

        for (let i = 0; i < alternateClients.length; i++) {
          const currentIndex = (activeIndex + i) % alternateClients.length;
          const currentClient = alternateClients[currentIndex];

          try {
            console.log(`[geminiRotator] Attempting AI generation using API key index: ${currentIndex + 1}/${alternateClients.length}`);
            // Call generateContent using the appropriate client's context
            const result = await currentClient.models.generateContent(params);
            
            // On success, save this index as the working one for all future requests
            activeIndex = currentIndex;
            return result;
          } catch (err) {
            console.warn(`[geminiRotator] API key index ${currentIndex + 1} failed:`, err.message || err);
            lastError = err;

            // Check if the error is a Rate Limit (429) or Quota issue
            const status = err.status || (err.response && err.response.status);
            const isRateLimit = status === 429 || (err.message && err.message.includes('429'));
            const isQuotaExceeded = err.message && (err.message.includes('quota') || err.message.includes('Quota'));

            if (isRateLimit || isQuotaExceeded) {
              console.log(`[geminiRotator] Rate limit or quota reached. Rotating to next API key...`);
              continue; // Move to the next key in the pool
            } else {
              // If it's a code or parameter error, fail fast instead of cycling keys
              throw err;
            }
          }
        }

        // If the loop finishes, it means ALL keys in the pool failed
        throw new Error(
          `[geminiRotator] All ${alternateClients.length} API keys in the rotation pool have been exhausted. ` +
          `Last error: ${lastError.message}`
        );
      };
    }
  }
}

// Override the exported class in the cached module
genaiModule.GoogleGenAI = PatchedGoogleGenAI;
