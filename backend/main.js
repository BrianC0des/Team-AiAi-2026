const admin = require('firebase-admin')
let credential

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const serviceAccount = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
  credential = admin.credential.cert(serviceAccount)
} else {
  const serviceAccount = require('./serviceAccountKey.json')
  credential = admin.credential.cert(serviceAccount)
}

admin.initializeApp({ credential })
const db = admin.firestore()
module.exports = db
