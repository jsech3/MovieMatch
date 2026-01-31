const admin = require('firebase-admin');
require('dotenv').config();

// Check if Firebase is already initialized to prevent multiple initializations
if (!admin.apps.length) {
  // If using environment variables with a JSON string for the private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Get the Realtime Database instance
const db = admin.database();

module.exports = {
  admin,
  db
};
