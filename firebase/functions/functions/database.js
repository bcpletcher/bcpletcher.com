exports.getCollection = (data, context, firestore, collectionName) => {
  return firestore
      .collection(`${collectionName}/`)
      .get()
      .then((doc) => {
        const obj = {};
        const docs = doc.docs.map((doc) => doc);
        docs.forEach((el) => {
          obj[el.id] = el.data();
        });
        return obj;
      })
      .catch((error) => {
        console.warn(error);
        return {error: error.message};
      });
};

exports.createDocument = async (data, context, firestore, collectionName) => {
  try {
    const docRef = data.document.id ?
      firestore.collection(collectionName).doc(data.document.id) :
      firestore.collection(collectionName).doc(); // Auto-generate ID if null

    await docRef.set(data.document.data); // Store document data

    return {success: true, message: "Document created successfully.", id: docRef.id};
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    return {success: false, error: error.message};
  }
};

exports.updateScrapbookDocumentOrder = async (data, context, firestore, collectionName) => {
  try {
    // Fetch all documents in the collection
    const snapshot = await firestore.collection(collectionName).get();

    if (snapshot.empty) {
      return {success: false, message: "No documents found in the collection."};
    }

    // Prepare a Firestore batch
    const batch = firestore.batch();

    // Iterate over all documents and update the 'order' field
    snapshot.docs.forEach((doc) => {
      const docRef = firestore.collection(collectionName).doc(doc.id);

      // Assuming `data.orderUpdates` is a function or logic to calculate the new 'order'
      // Example: If `data.orderUpdates` is an object with { id: newOrderValue }
      const newOrderValue = data.documents[doc.id].order || doc.data().order; // Update or keep the existing value

      // Update the 'order' field
      batch.update(docRef, {order: newOrderValue});
    });

    // Commit the batch
    await batch.commit();

    return {success: true, message: "Collection updated successfully."};
  } catch (error) {
    console.error(`Error updating collection ${collectionName}:`, error);
    return {success: false, error: error.message};
  }
};

exports.updateDocument = async (data, context, firestore, collectionName) => {
  try {
    if (!data || !data.document || !data.document.id) {
      return {success: false, error: "Missing document id for update."};
    }

    const {id, data: documentData} = data.document;
    const docRef = firestore.collection(collectionName).doc(id);

    await docRef.set(documentData, {merge: true});

    return {success: true, message: "Document updated successfully.", id: docRef.id};
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    return {success: false, error: error.message};
  }
};
