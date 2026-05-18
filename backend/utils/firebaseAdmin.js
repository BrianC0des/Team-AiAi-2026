// ─────────────────────────────────────────────────────────────────────────────
//  firebaseAdmin.js
//  Initialises and exports the Firebase Admin SDK app (singleton pattern).
//
//  Reads the service account from FIREBASE_SERVICE_ACCOUNT_JSON — a single-line
//  JSON string stored as an environment variable (never a committed file).
//
//  Usage:
//    const { auth, db } = require('./firebaseAdmin');
//    const user = await auth.getUser(uid);
// ─────────────────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('Missing environment variable: FIREBASE_SERVICE_ACCOUNT_JSON');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch {
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. ' +
      'Ensure the value is a single-line escaped JSON string.'
  );
}

// Initialise only once (safe to require from multiple modules)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db };
