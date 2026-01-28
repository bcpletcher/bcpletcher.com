import { httpsCallable } from "firebase/functions";

export async function dataUpdateDocument(functions, functionName, document) {
  try {
    const updateFunction = httpsCallable(functions, functionName);
    const result = await updateFunction({ document });
    return result.data;
  } catch (error) {
    console.error(`Error updating ${functionName}:`, error);
    throw error;
  }
}
