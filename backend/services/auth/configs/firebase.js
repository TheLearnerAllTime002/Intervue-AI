import { initializeApp, cert } from "firebase-admin/app";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const localServiceAccountPath = fileURLToPath(
  new URL("../serviceAccountKey.json", import.meta.url),
);

const readServiceAccount = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message}`,
      );
    }
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      project_id: FIREBASE_PROJECT_ID,
      client_email: FIREBASE_CLIENT_EMAIL,
      private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  if (existsSync(localServiceAccountPath)) {
    return JSON.parse(readFileSync(localServiceAccountPath, "utf8"));
  }

  throw new Error(
    "Firebase Admin credentials are missing. Configure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
  );
};

export const app = initializeApp({
  credential: cert(readServiceAccount()),
});