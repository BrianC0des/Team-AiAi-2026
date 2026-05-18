# Team AiAi — Code Snippets Reference

> **Stack:** Vanilla HTML · CSS · JS · Node.js · Express · Firebase JS SDK
> Copy-paste ready. All snippets assume the project structure established in the skeleton.

---

## 1. Vanilla JS — Robust API Fetch Template

A reusable `apiFetch()` wrapper around the native `fetch()` API.
Handles loading spinners, non-2xx HTTP errors, and network failures cleanly.

### `frontend/app.js` — Drop-in fetch wrapper

```js
// ─── Config ───────────────────────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:3000'; // swap for Railway URL in production

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * setLoading
 * Toggles a CSS `hidden` class on a spinner element.
 * Pair with the `.spinner` + `.hidden` utility classes from SNIPPETS.md §3.
 *
 * @param {string}  spinnerId - id of the <div class="spinner"> element
 * @param {boolean} isLoading
 */
function setLoading(spinnerId, isLoading) {
  const el = document.getElementById(spinnerId);
  if (!el) return;
  el.classList.toggle('hidden', !isLoading);
}

/**
 * apiFetch
 * Thin wrapper around fetch() that:
 *  - Prepends the backend base URL automatically
 *  - Accepts JSON bodies and parses JSON responses
 *  - Throws a descriptive Error for non-2xx HTTP status codes
 *  - Manages a loading spinner before/after the request
 *
 * @param {string} endpoint         - e.g. '/health' or '/api/users'
 * @param {Object} [options={}]     - Standard fetch() options (method, body, headers…)
 * @param {string} [spinnerId=null] - Optional spinner element id to toggle
 * @returns {Promise<any>}          - Parsed JSON response body
 *
 * @throws {Error} On non-2xx responses or network failures
 */
async function apiFetch(endpoint, options = {}, spinnerId = null) {
  if (spinnerId) setLoading(spinnerId, true);

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Surface non-2xx as proper errors with the backend's message
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } finally {
    // Always hide the spinner, even on error
    if (spinnerId) setLoading(spinnerId, false);
  }
}

// ─── Usage Examples ───────────────────────────────────────────────────────

// GET request
async function fetchHealth() {
  try {
    const data = await apiFetch('/health', {}, 'main-spinner');
    console.log('[Health]', data);
  } catch (err) {
    console.error('[Health] Failed:', err.message);
  }
}

// POST request with a JSON body
async function createUser(payload) {
  try {
    const data = await apiFetch('/api/users', { method: 'POST', body: payload }, 'form-spinner');
    console.log('[Create User]', data);
  } catch (err) {
    console.error('[Create User] Failed:', err.message);
  }
}
```

### Matching HTML spinner markup

```html
<!-- Add anywhere in index.html. Hidden by default via the .hidden utility class. -->
<div id="main-spinner" class="spinner hidden" aria-label="Loading…"></div>
```

---

## 2. Firebase Auth Integration

Uses the **Firebase JS SDK v9+ modular API** loaded via CDN.
Ensure `frontend/config.js` has your real `firebaseConfig` values before using these.

### `frontend/config.js` — Enable Firebase App + Auth

```js
// Uncomment and replace the placeholders once you have real Firebase credentials.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

> **Note:** Change `<script src="config.js">` to `<script type="module" src="config.js">` in
> `index.html` when using ES module imports.

---

### Sign-Up (Email + Password)

```js
import { auth } from './config.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

/**
 * signUp
 * Creates a new Firebase user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[Auth] Signed up:', user.email, '| UID:', user.uid);
    return userCredential;
  } catch (err) {
    // Firebase error codes: https://firebase.google.com/docs/auth/admin/errors
    console.error('[Auth] Sign-up failed:', err.code, err.message);
    throw err;
  }
}
```

---

### Sign-In (Email + Password)

```js
import { auth } from './config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

/**
 * signIn
 * Signs in an existing Firebase user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[Auth] Signed in:', user.email, '| UID:', user.uid);
    return userCredential;
  } catch (err) {
    console.error('[Auth] Sign-in failed:', err.code, err.message);
    throw err;
  }
}
```

---

### Sign-Out

```js
import { auth } from './config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

async function logOut() {
  await signOut(auth);
  console.log('[Auth] User signed out.');
}
```

---

### Auth State Listener (`onAuthStateChanged`)

Set this up once at app startup. It fires immediately with the current auth state
and then again on every login / logout.

```js
import { auth } from './config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

/**
 * initAuthListener
 * Bootstraps the application based on the current auth state.
 * Call once from your main entry point (e.g. DOMContentLoaded).
 */
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // ── User is signed in ──────────────────────────────────────
      console.log('[Auth] Active session:', user.email, '| UID:', user.uid);

      // Example: show authenticated UI, fetch user data, etc.
      // showDashboard(user);
      // loadUserData(user.uid);
    } else {
      // ── User is signed out ─────────────────────────────────────
      console.log('[Auth] No active session — showing login.');

      // Example: redirect to login page, clear UI, etc.
      // showLoginScreen();
    }
  });
}

// Bootstrap on page load
document.addEventListener('DOMContentLoaded', initAuthListener);
```

---

## 3. Vanilla CSS Utility Classes

Drop into `frontend/style.css`. Designed to complement the existing dark-theme design system.

```css
/* ════════════════════════════════════════════════════════════════════════════
   UTILITY CLASSES
   Stateless, composable helpers — use directly in HTML class attributes.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Visibility ─────────────────────────────────────────────────────────── */
.hidden   { display: none !important; }
.invisible { visibility: hidden; }

/* ── Flexbox Helpers ────────────────────────────────────────────────────── */
.flex          { display: flex; }
.flex-col      { display: flex; flex-direction: column; }
.flex-center   { display: flex; align-items: center; justify-content: center; }
.flex-between  { display: flex; align-items: center; justify-content: space-between; }
.flex-wrap     { flex-wrap: wrap; }
.flex-1        { flex: 1; }
.gap-xs        { gap: 0.5rem; }
.gap-sm        { gap: 1rem; }
.gap-md        { gap: 1.5rem; }
.gap-lg        { gap: 2rem; }

/* ── Responsive Card Grid ───────────────────────────────────────────────── */
/*
  Usage:
    <div class="card-grid">
      <div class="card">…</div>
      <div class="card">…</div>
    </div>

  Columns auto-fill at a minimum of 280px, stretching to fill available space.
  Automatically collapses to a single column on narrow viewports.
*/
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

/* ── Card Component ─────────────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(108, 99, 255, 0.2);
  border-color: rgba(108, 99, 255, 0.4);
}

/* ── Spacing ────────────────────────────────────────────────────────────── */
.mt-sm  { margin-top: 0.5rem; }
.mt-md  { margin-top: 1rem; }
.mt-lg  { margin-top: 2rem; }
.mb-sm  { margin-bottom: 0.5rem; }
.mb-md  { margin-bottom: 1rem; }
.mb-lg  { margin-bottom: 2rem; }
.p-sm   { padding: 0.75rem; }
.p-md   { padding: 1.25rem; }
.p-lg   { padding: 2rem; }

/* ── Typography Helpers ─────────────────────────────────────────────────── */
.text-center  { text-align: center; }
.text-muted   { color: var(--text-secondary); }
.text-accent  { color: var(--accent); }
.text-sm      { font-size: 0.875rem; }
.text-lg      { font-size: 1.125rem; }
.font-bold    { font-weight: 700; }

/* ── Button Base ────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    box-shadow 0.15s ease;
}

.btn:hover  { transform: translateY(-2px); opacity: 0.92; }
.btn:active { transform: translateY(0px);  opacity: 1; }

.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 20px var(--accent-glow);
}

.btn-secondary {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
}

.btn-danger {
  background: rgba(248, 113, 113, 0.15);
  color: var(--red);
  border: 1px solid var(--red);
}

/* ── Loading Spinner ────────────────────────────────────────────────────── */
/*
  Usage:  <div id="my-spinner" class="spinner hidden"></div>
  Toggle: element.classList.toggle('hidden', !isLoading)
*/
.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Fade-in / Slide-up Animations ─────────────────────────────────────── */
/*
  Apply .animate-fade-in or .animate-slide-up to any element you want
  to transition into view on page load or after a state change.
*/
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in  { animation: fadeIn  0.4s ease both; }
.animate-slide-up { animation: slideUp 0.45s ease both; }

/* Stagger children with a small delay using inline style:
   <div class="card animate-slide-up" style="animation-delay: 0.1s"> */

/* ── Responsive Visibility ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .hide-mobile { display: none !important; }
}

@media (min-width: 641px) {
  .hide-desktop { display: none !important; }
}

/* ── Glassmorphism Surface ──────────────────────────────────────────────── */
/*
  Use .glass in place of .card for a frosted-glass aesthetic on elements
  that sit over a gradient or image background.
*/
.glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
}
```
