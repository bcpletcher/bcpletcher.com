import { httpsCallable } from "firebase/functions";

export async function dataCreateDocument(functions, functionName, document) {
  try {
    const createFunction = httpsCallable(functions, functionName);
    const result = await createFunction({ document }); // Pass the document as an object
    return result.data;
  } catch (error) {
    console.error(`Error creating ${functionName}:`, error);
    throw error;
  }
}
