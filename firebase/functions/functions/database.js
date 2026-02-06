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

// Fetch a collection with optional filters and field selection.
// Intended for lightweight reads (e.g. featured projects for the Home page).
//
// data:
// {
//   where: Array<{ field: string, op: FirebaseFirestore.WhereFilterOp, value: any }>,
//   select: string[]
// }
exports.getCollectionQuery = async (data, context, firestore, collectionName) => {
  try {
    let ref = firestore.collection(collectionName);

    const where = data && Array.isArray(data.where) ? data.where : [];
    where.forEach((w) => {
      if (!w || !w.field || w.value === undefined) return;
      ref = ref.where(w.field, w.op || "==", w.value);
    });

    const select = data && Array.isArray(data.select) ? data.select : [];
    if (select.length) {
      ref = ref.select(...select);
    }

    const snapshot = await ref.get();
    const obj = {};
    snapshot.docs.forEach((doc) => {
      obj[doc.id] = doc.data();
    });
    return obj;
  } catch (error) {
    console.warn(error);
    return { error: error.message };
  }
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
