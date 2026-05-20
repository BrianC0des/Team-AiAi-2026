---
trigger: always_on
---

---
name: tech-stack-guide
description: Restricts the agents to the specified project architecture.
---
## Architectural Boundaries
1. **Frontend:** You must only use Vanilla HTML, CSS, and native JavaScript inside the `/frontend` directory. Do not install React, Vue, or Tailwind unless explicitly told.
2. **Backend:** Use Node.js with Express inside the `/backend` directory. Keep routing modular using Express Router.
3. **Database & Auth:** Use the Firebase JS SDK for authentication and data management. Do not spin up SQL or MongoDB databases locally.
4. **AI Integration:** Use the `@google/genai` SDK routed through **Google AI Studio** (API key auth). Do NOT use Vertex AI, ADC, or any GCP project-based authentication.