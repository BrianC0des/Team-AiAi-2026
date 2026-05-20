# Team AiAi — Dev Setup Guide

Everything a new teammate needs to go from a fresh clone to a running server.

---

## 1. Prerequisites

| Tool | Why | Download |
|---|---|---|
| **Node.js 20+** | Runs the backend | [nodejs.org](https://nodejs.org) |
| **Git for Windows** | Clone + VS Code tasks use `bash.exe` | [git-scm.com](https://git-scm.com) |
| **VS Code** | Recommended IDE | [code.visualstudio.com](https://code.visualstudio.com) |

---

## 2. Fix PowerShell Script Execution (Windows — one-time)

If you see `npm.ps1 cannot be loaded because running scripts is disabled`, run this **once** in any PowerShell terminal:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

No admin rights required. After this, `npm` will work in every PowerShell session on your machine.

Alternatively, switch your VS Code terminal to **Command Prompt**:
> Terminal → `+` dropdown → **Command Prompt**

---

## 3. Clone & Open

```bash
git clone https://github.com/meekoUrabe/Team-AiAi-2026.git
```

In VS Code: **File → Open Folder** → select the cloned folder.

---

## 4. Create `backend/.env` (manual — never committed)

This file is gitignored. Create it yourself at `backend/.env`:

```env
PORT=3000
GEMINI_API_KEY=<get from team lead>
FIREBASE_SERVICE_ACCOUNT_JSON=<get from team lead>
```

Get the actual key values from the team lead — they cannot be shared in the repo.

**Where to get `GEMINI_API_KEY`:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (free, no billing needed).

---

## 5. Install Dependencies

Open the integrated terminal (`Ctrl+`` ` ``), then:

```bash
cd backend
npm install
```

Only needed once after cloning (or after `package.json` changes).

---

## 6. Run the Server

### Option A — VS Code (recommended)

| Shortcut | Action |
|---|---|
| **F5** | Starts server with debugger. Breakpoints in `server.js` will hit. |
| **Ctrl+Shift+B** | Runs full health check (install → start → curl `/health`) |
| **Shift+F5** | Stops the server |

F5 automatically runs `npm install` via `preLaunchTask` before booting, but if `node_modules` is missing it can fail silently — just run `npm install` manually first (step 5) to be safe.

### Option B — Terminal

```bash
cd backend
node server.js
```

Then visit `http://localhost:3000`.

---

## 7. Verify It's Working

`GET http://localhost:3000/health` should return:
```json
{ "status": "ok", "message": "Backend is healthy!", "timestamp": "..." }
```

---

## 8. Project Structure

```
Team-AiAi-2026/
├── backend/
│   ├── server.js          ← Express entry point
│   ├── utils/
│   │   ├── geminiClient.js  ← Google AI Studio client (API key auth)
│   │   └── errorHandler.js  ← asyncHandler + global error middleware
│   ├── firebase.js        ← Firebase Admin SDK init
│   ├── .env               ← ⚠ NOT in git — create manually
│   └── .env.example       ← Template showing required variables
├── frontend/
│   └── public/            ← Static HTML/CSS/JS served by Express
├── .vscode/
│   ├── tasks.json         ← Ctrl+Shift+B build tasks
│   └── launch.json        ← F5 debug config
└── .github/
    └── workflows/
        └── verify-build-ci.yml  ← GitHub Actions CI
```

---

## 9. Tech Stack Rules (GEMINI.md summary)

- **Backend:** Node.js 20 + Express — all routes must use `asyncHandler`
- **Frontend:** Vanilla HTML/CSS/JS only — no React, no Vue, no Tailwind
- **AI:** `@google/genai` via **Google AI Studio** (API key) — model: `gemini-2.0-flash`
- **Database:** `firebase-admin` (backend only) — never use client SDK for writes
- **HTTP:** Native `fetch()` only — never `axios` or `node-fetch`

---

## 10. Git Workflow

```bash
git pull origin master        # always pull before starting work
# ... make changes ...
git add .
git commit -m "feat: your message"
git push origin master
```

If `git pull` fails with `vi` editor error, complete the merge with:
```bash
git commit --no-edit
```

To avoid the `vi` issue permanently, set VS Code as your Git editor:
```bash
git config --global core.editor "code --wait"
```

---

## 11. Troubleshooting Common Auth Issues

### A. Firebase Error `auth/unauthorized-domain`
When testing Google Auth on a deployment (like Hugging Face Spaces or custom domain), you may get a popup block or unauthorized domain error:
* **Cause**: Firebase Authentication blocks authentication requests from unauthorized domains for security.
* **Resolution**:
  1. Go to the **Firebase Console** -> **Build** -> **Authentication** -> **Settings** tab.
  2. Scroll down to **Authorized domains**.
  3. Click **Add domain** and enter your space's direct URL (e.g., `devchan123-scanable.hf.space` without `https://` or path info).
  4. Click **Save**.

### B. Popup Blocked / Browser Shield Block
If the Google Auth popup is blocked:
* **Cause**: Browsers or adblockers (such as Brave Shields) might block the Firebase sign-in window.
* **Resolution**: Whitelist the site or allow popups/redirects in your browser settings.

