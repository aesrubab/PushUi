import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// .env-dən oxuyuruq
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID
};

export const fbApp = initializeApp(firebaseConfig);

export async function getMessagingIfSupported() {
  const ok = await isSupported();
  return ok ? getMessaging(fbApp) : null;
}
