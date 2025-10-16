import { getMessagingIfSupported } from "./firebase";
import { getToken, deleteToken } from "firebase/messaging";

const API   = import.meta.env.VITE_API_BASE as string;
const VAPID = import.meta.env.VITE_FB_VAPID_KEY as string;

// SW qeydiyyatı ilə token alıb backend-ə yazır
export async function subscribePush(lang = "az") {
  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error("Brauzer Web Push dəstəkləmir");

  // Service Worker mütləq qeydiyyatdan keçsin
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("İcazə verilmədi");

  const token = await getToken(messaging, {
    vapidKey: VAPID,
    serviceWorkerRegistration: reg,
  });
  if (!token) throw new Error("Token alına bilmədi");

  localStorage.setItem("pushToken", token);

  const r = await fetch(`${API}/api/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: navigator.userAgent, lang }),
  });
  if (!r.ok) throw new Error(`subscribe failed (${r.status})`);

  return token;
}

// Köhnə adı saxlamaq üçün alias
export const enablePush = subscribePush;

export async function disablePush() {
  const token = localStorage.getItem("pushToken");
  if (!token) return;

  const r = await fetch(`${API}/api/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!r.ok) throw new Error(`unsubscribe failed (${r.status})`);

  const messaging = await getMessagingIfSupported();
  if (messaging) await deleteToken(messaging);

  localStorage.removeItem("pushToken");
}
