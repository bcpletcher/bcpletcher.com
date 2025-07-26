import { signInWithEmailAndPassword } from "firebase/auth";

export async function adminSignIn(auth, email, password) {
  await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log(userCredential);
      return userCredential.user;
    })
    .catch((error) => {
      let errorMessage = "";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid Email";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Invalid Credentials";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests, try again later";
      } else {
        errorMessage = error.code;
      }
      return Promise.reject(errorMessage);
    });
}
