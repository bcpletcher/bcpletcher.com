const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp({
  databaseURL: "https://pletcher-portfolio-app.firebaseio.com",
});

const firestore = admin.firestore();
const database = require("./functions/database");

exports.getContentCollection = functions.https.onCall((data, context) => {
  return database.getCollection(data, context, firestore, "content");
});
// exports.updateContentDocument = functions.https.onCall((data, context) => {
//   return database.updateDocument(data, context, firestore, "content");
// });

exports.getResourcesCollection = functions.https.onCall((data, context) => {
  return database.getCollection(data, context, firestore, "resources");
});
// exports.updateResourcesDocument = functions.https.onCall((data, context) => {
//   return database.updateDocument(data, context, firestore, "resources");
// });


exports.getScrapbookCollection = functions.https.onCall((data, context) => {
  return database.getCollection(data, context, firestore, "scrapbook");
});
exports.createScrapbookDocument = functions.https.onCall((data, context) => {
  return database.createDocument(data, context, firestore, "scrapbook");
});
exports.updateScrapbookDocumentOrder = functions.https.onCall((data, context) => {
  console.log(data);
  return database.updateScrapbookDocumentOrder(data, context, firestore, "scrapbook");
});
// exports.updateScrapbookDocument = functions.https.onCall((data, context) => {
//   return database.updateDocument(data, context, firestore, "scrapbook");
// });
