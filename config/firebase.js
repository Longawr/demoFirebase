require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_CONFIG;
const stringify = serviceAccount.replaceAll('\n', '\\n');
const json = JSON.parse(stringify);
try {
    admin.initializeApp({
        credential: admin.credential.cert(json),
        databaseURL: process.env.DATABASE_URL,
    });
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
}

const db = admin.database();
module.exports = db;
