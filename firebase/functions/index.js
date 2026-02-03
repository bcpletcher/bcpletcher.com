const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const firestore = admin.firestore();
const database = require("./functions/database");

exports.getScrapbookCollection = onCall((request) => {
  const { data, auth } = request;
  const context = { auth };
  return database.getCollection(data, context, firestore, "scrapbook");
});

// Lightweight featured-only query for Home page.
// Returns only active featured items with minimal fields.
exports.getFeaturedScrapbookCollection = onCall((request) => {
  const { auth } = request;
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
exports.createScrapbookDocument = onCall((request) => {
  const { data, auth } = request;
  const context = { auth };
  return database.createDocument(data, context, firestore, "scrapbook");
});
exports.updateScrapbookDocumentOrder = onCall((request) => {
  const { data, auth } = request;
  const context = { auth };
  return database.updateScrapbookDocumentOrder(data, context, firestore, "scrapbook");
});
exports.updateScrapbookDocument = onCall((request) => {
  const { data, auth } = request;
  const context = { auth };
  return database.updateDocument(data, context, firestore, "scrapbook");
});
