// Use only v2 entrypoints so firebase-functions v1 (and functions.config()) is never loaded.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

setGlobalOptions({ region: "us-central1" });

// Standard Admin SDK init pattern (safe for hot reload / emulator).
if (!getApps().length) {
  initializeApp();
}

// Admin SDK will automatically connect to the Firestore emulator when
// FIRESTORE_EMULATOR_HOST is set (Firebase Emulator Suite sets this for the
// functions runtime).

const firestore = getFirestore();
const database = require("./functions/database");

function callable(handler) {
  return onCall(async (request) => {
    try {
      return await handler(request);
    } catch (err) {
      // Always surface predictable errors to clients.
      if (err instanceof HttpsError) throw err;

      console.error("Unhandled callable error:", err);
      throw new HttpsError(
        "internal",
        err && err.message ? err.message : "Internal error"
      );
    }
  });
}

exports.getProjectsCollection = callable(({ data, auth }) => {
  const context = { auth };
  return database.getCollection(data, context, firestore, "projects");
});

exports.createProjectDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.createDocument(data, context, firestore, "projects");
});

exports.updateProjectDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.updateDocument(data, context, firestore, "projects");
});
