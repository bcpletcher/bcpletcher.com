import { httpsCallable } from "firebase/functions";

export async function dataUpdateScrapbookDocumentOrder(
  functions,
  functionName,
  documents
) {
  try {
    const updateFunction = httpsCallable(functions, functionName);
    const result = await updateFunction({ documents }); // Pass the updates as an object
    return result.data;
  } catch (error) {
    console.error(`Error updating ${functionName}:`, error);
    throw error;
  }
}
