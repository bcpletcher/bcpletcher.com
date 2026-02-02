const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp({
  databaseURL: "https://pletcher-portfolio-app.firebaseio.com",
});

const firestore = admin.firestore();
const database = require("./functions/database");

exports.getScrapbookCollection = functions.https.onCall((data, context) => {
  return database.getCollection(data, context, firestore, "scrapbook");
});

// Lightweight featured-only query for Home page.
// Returns only active featured items with minimal fields.
exports.getFeaturedScrapbookCollection = functions.https.onCall((data, context) => {
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
exports.createScrapbookDocument = functions.https.onCall((data, context) => {
  return database.createDocument(data, context, firestore, "scrapbook");
});
exports.updateScrapbookDocumentOrder = functions.https.onCall((data, context) => {
  return database.updateScrapbookDocumentOrder(data, context, firestore, "scrapbook");
});
exports.updateScrapbookDocument = functions.https.onCall((data, context) => {
  return database.updateDocument(data, context, firestore, "scrapbook");
});
