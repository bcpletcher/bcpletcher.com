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

exports.getScrapbookCollection = callable(({ data, auth }) => {
  const context = { auth };
  return database.getCollection(data, context, firestore, "scrapbook");
});

// Lightweight featured-only query for Home page.
// Returns only active featured items with minimal fields.
exports.getFeaturedScrapbookCollection = callable(({ auth }) => {
  const context = { auth };
  return database.getCollectionQuery(
    {
      where: [
        { field: "featured", op: "==", value: true },
        { field: "deleted", op: "==", value: false },
      ],
      select: [
        "eyebrow",
        "title",
        "hero",
        "summary",
        "technology",
        "url",
        "order",
        "featured",
        "deleted",
      ],
    },
    context,
    firestore,
    "scrapbook"
  );
});

exports.createScrapbookDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.createDocument(data, context, firestore, "scrapbook");
});

exports.updateScrapbookDocumentOrder = callable(({ data, auth }) => {
  const context = { auth };
  return database.updateScrapbookDocumentOrder(
    data,
    context,
    firestore,
    "scrapbook"
  );
});

exports.updateScrapbookDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.updateDocument(data, context, firestore, "scrapbook");
});
