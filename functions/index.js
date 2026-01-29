
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURATION ---
// No longer needed for Google Fit client-side flow.
// Leaving basic setup if you need other functions later.

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Dexter Backend Active");
});
