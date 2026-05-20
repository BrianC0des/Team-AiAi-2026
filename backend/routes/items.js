const express = require('express');
const router = express.Router();
const { db, auth } = require('../utils/firebaseAdmin.js');
const { asyncHandler } = require('../utils/errorHandler.js');

// ── Synchronise and Merge Items ───────────────────────────────────────────
router.post('/sync', asyncHandler(async (req, res) => {
  const { idToken, items } = req.body;

  if (!idToken) {
    const err = new Error('Missing idToken.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify the client-provided Firebase ID Token
  const decodedToken = await auth.verifyIdToken(idToken);
  const uid = decodedToken.uid;

  const userItemsRef = db.collection('users').doc(uid).collection('items');

  // 2. Retrieve existing items from Firestore
  const dbSnapshot = await userItemsRef.get();
  const dbItems = dbSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const localItems = Array.isArray(items) ? items : [];
  const syncedItems = [];

  // 3. Merge process
  // We use standard batch operations or sequential writes for safety.
  // Given low expected concurrency per user, sequential sets are simple and secure.
  for (const item of localItems) {
    // Generate unique ID on Firestore ref if not already present
    if (!item.id) {
      item.id = userItemsRef.doc().id;
    }

    // Match by ID or creation timestamp (unique identifier)
    const existing = dbItems.find(
      dbItem => dbItem.id === item.id || (item.createdAt && dbItem.createdAt === item.createdAt)
    );

    if (existing) {
      // Merge properties (local updates override DB, preserving IDs)
      const mergedItem = {
        ...existing,
        ...item,
        id: existing.id // Keep the existing Firestore document ID
      };
      await userItemsRef.doc(mergedItem.id).set(mergedItem);
      syncedItems.push(mergedItem.id);
    } else {
      // Save new item
      await userItemsRef.doc(item.id).set(item);
      syncedItems.push(item.id);
    }
  }

  // 4. Retrieve complete, updated items from Firestore to return to front-end
  const finalSnapshot = await userItemsRef.get();
  const finalItems = finalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by createdAt descending
  finalItems.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  res.json({
    success: true,
    items: finalItems
  });
}));

module.exports = router;
