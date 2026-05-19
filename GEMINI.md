# Team AiAi - Gemini Architecture Rules
*Read these rules strictly before generating any code for this workspace.*

## 1. Tech Stack Boundaries
- **Backend:** Node.js 20, Express.js.
- **Frontend:** Vanilla HTML/CSS/JS (No React, No Vue).
- **AI Integration:** `@google/genai` (Google AI Studio — API key auth / gemini-2.0-flash).
- **Database:** `firebase-admin` (Backend only). Do NOT use the client-side Firebase SDK for database writes.
  
## 2. Coding Standards
- **Fetch:** Use native `fetch()`. NEVER use `axios` or `node-fetch`.
- **Async:** Every single Express API route MUST be wrapped in our `asyncHandler`.
- **Variables:** Use `const` and `let`. Avoid `var`. Use ES6 arrow functions.
- **Styling:** We use standard CSS variables. Do not use Tailwind utility classes unless explicitly asked.

## 3. File Structure Constraints
- Frontend logic strictly goes in `frontend/public/main.js`.
- Express routing strictly goes in `backend/routes/`.
- No backend code should ever reference the `document` or `window` objects.
