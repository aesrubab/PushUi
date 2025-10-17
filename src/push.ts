import { getMessagingIfSupported } from "./firebase";
import { getToken, deleteToken } from "firebase/messaging";

// VITE_API_BASE qoyulubsa (məs. https://localhost:7168) onu istifadə edirik,
// qoyulmayıbsa "" qalır və Vite proxy işə düşür.
const RAW_API = (import.meta.env.VITE_API_BASE as string) || "";
const API = RAW_API.replace(/\/+$/, ""); // sondakı "/"-ları kəs
const VAPID = import.meta.env.VITE_FB_VAPID_KEY as string;

const STORAGE_KEY = "pushToken";

// Lokal dev üçün NGROK başlığı lazım deyil
const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

async function ensureSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  // public/ içində olmalıdır: public/firebase-messaging-sw.js
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;
  return reg;
}

async function requestPermission() {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Bildiriş icazəsi verilmədi");
}

async function apiPost<T = unknown>(path: string, body: any): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    try {
      return (await res.json()) as T;
    } catch {
      // cavab body boşdursa
      return undefined as unknown as T;
    }
  } finally {
    clearTimeout(timer);
  }
}

/** SW + FCM token alır və backend-ə subscribe edir */
export async function subscribePush(lang = "az"): Promise<string> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error("Brauzer Web Push dəstəkləmir");

  await requestPermission();
  const reg = await ensureSW();

  const token = await getToken(messaging, {
    vapidKey: VAPID,
    serviceWorkerRegistration: reg,
  });
  if (!token) throw new Error("FCM token alına bilmədi");

  localStorage.setItem(STORAGE_KEY, token);

  await apiPost("/api/push/subscribe", {
    token,
    platform: navigator.userAgent,
    lang,
  });

  return token;
}

// Köhnə adla da istifadə olunsun
export const enablePush = subscribePush;

/** Backend-ə unsubscribe edir və local FCM token-i silir */
export async function disablePush(): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return;

  await apiPost("/api/push/unsubscribe", { token });

  const messaging = await getMessagingIfSupported();
  if (messaging) {
    try {
      await deleteToken(messaging);
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(STORAGE_KEY);
}

/** Backend-in əlçatanlığını yoxlamaq üçün */
export async function pingApi(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/_ping`, { headers: DEFAULT_HEADERS });
    return r.ok;
  } catch {
    return false;
  }
}
