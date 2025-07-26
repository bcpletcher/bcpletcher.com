import { httpsCallable } from "firebase/functions";

export async function dataUpdateDocument(functions, functionName, updates) {
  try {
    const updateFunction = httpsCallable(functions, functionName);
    const result = await updateFunction({ updates }); // Pass the updates as an object
    return result.data;
  } catch (error) {
    console.error(`Error updating ${functionName}:`, error);
    throw error;
  }
}
