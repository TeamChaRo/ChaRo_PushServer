import admin from "firebase-admin";
import serviceAccount from "../../push_key.json";

export default function () {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as object),
    });

    console.log("connected to firebase");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
