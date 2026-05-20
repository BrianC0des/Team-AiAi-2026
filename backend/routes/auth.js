const express = require('express');
const router = express.Router();
const { auth, db } = require('../utils/firebaseAdmin.js');
const { asyncHandler } = require('../utils/errorHandler.js');


router.post('/signup', asyncHandler(async (req, res) => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    const err = new Error('Missing uid or email in request body.');
    err.statusCode = 400;
    throw err;
  }

  await db.collection('users').doc(uid).set({
    email,
    bio: "Hello, I'm new here!",
    createdAt: new Date().toISOString(),
    profilePicture: null,
  });

  res.json({ success: true, message: "User profile created in database" });
}));


router.post('/login-sync', asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    const err = new Error('Missing idToken.');
    err.statusCode = 400;
    throw err;
  }

  const decodedToken = await auth.verifyIdToken(idToken);
  const uid = decodedToken.uid;

  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    return res.status(404).json({ error: "User profile not found. Please sign up." });
  }

  res.json({
    success: true,
    user: userDoc.data()
  });
}));


router.post('/google-sync', asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    const err = new Error('Missing idToken.');
    err.statusCode = 400;
    throw err;
  }

  const decodedToken = await auth.verifyIdToken(idToken);
  const { uid, email, picture } = decodedToken;

  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();

  let userData;
  if (!doc.exists) {
    userData = {
      email,
      profilePicture: picture || null,
      bio: "Hello, I'm new here!",
      createdAt: new Date().toISOString()
    };
    await userRef.set(userData);
  } else {
    userData = doc.data();
  }

  res.json({ success: true, user: userData });
}));

// ── Update Profile ───────────────────────────────────────────────────────
router.patch('/profile', asyncHandler(async (req, res) => {
  const { idToken, bio, profilePicture } = req.body;

  if (!idToken) {
    const err = new Error('Missing idToken.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify the user
  const decodedToken = await auth.verifyIdToken(idToken);
  const uid = decodedToken.uid;

  // 2. Build update object
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
  updateData.updatedAt = new Date().toISOString();

  // 3. Update Firestore
  await db.collection('users').doc(uid).update(updateData);

  res.json({ success: true, message: "Profile updated successfully" });
}));

module.exports = router;
