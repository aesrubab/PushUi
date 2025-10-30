// src/push.ts
import { getMessagingIfSupported } from "./firebase";
import { getToken, deleteToken } from "firebase/messaging";

/* ====== API əsasları ====== */
const RAW_API = (import.meta.env.VITE_API_BASE as string) || "";
const API = RAW_API.replace(/\/+$/, ""); // sondakı "/"-ları kəs
const VAPID = import.meta.env.VITE_FB_VAPID_KEY as string;

const STORAGE_TOKEN = "pushToken";
const STORAGE_DEVICE = "em_device_id"; // <<< deviceId burda saxlanır

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

/* ====== Köməkçi detektorlar ====== */
function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (navigator as any).standalone === true
  );
}
function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/* ====== SW təminatı ====== */
async function ensureSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  // public/firebase-messaging-sw.js (root scope)
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  return reg;
}

/* ====== İcazə ====== */
async function requestPermission() {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Bildiriş icazəsi verilmədi");
}

/* ====== API helper ====== */
async function apiPost<T = unknown>(path: string, body: any): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    // deviceId varsa, avtomatik başlığa əlavə et
    const deviceId = localStorage.getItem(STORAGE_DEVICE) || "";
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...(deviceId ? { "X-Device-Id": deviceId } : {}),
    };

    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers,
      credentials: "include", // cookie/JWT üçün
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
      return undefined as unknown as T;
    }
  } finally {
    clearTimeout(timer);
  }
}

/* ====== Public API ====== */

type SubscribeResponse = {
  ok: boolean;
  deviceId?: string;   // backend PushController.Subscribe göndərir
  isNew?: boolean;
};

/** SW + FCM token alır və backend-ə subscribe edir; deviceId-i də saxlayır */
// --- Replace existing subscribePush with this improved implementation ---
export async function subscribePush(lang = "az"): Promise<{ token: string; deviceId?: string }> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) throw new Error("Brauzer Web Push dəstəkləmir");

  if (!VAPID) {
    throw new Error("VAPID açarı tapılmadı (VITE_FB_VAPID_KEY).");
  }

  // iOS yalnız PWA (standalone) rejimində icazə verir
  if (isIos() && !isStandalone()) {
    throw new Error(
      "iOS: Əvvəl Safari → Paylaş → 'Ana ekrana əlavə et' ilə tətbiqi quraşdır, sonra bildiriş icazəsi ver."
    );
  }

  // HTTPS (localhost istisna)
  if (
    location.protocol !== "https:" &&
    location.hostname !== "localhost" &&
    location.hostname !== "127.0.0.1"
  ) {
    throw new Error("Service Worker üçün HTTPS tələb olunur.");
  }

  await requestPermission();
  const reg = await ensureSW();

  let token: string | null = null;
  try {
    token = await getToken(messaging, {
      vapidKey: VAPID,
      serviceWorkerRegistration: reg,
    });
  } catch (e: any) {
    console.error("FCM getToken error:", e);
    throw new Error(
      "FCM token alınmadı. Zəhmət olmasa .env (.env.local) faylındakı VITE_FB_* dəyərlərinin Firebase Project ilə eyni olduğuna əmin ol."
    );
  }

  if (!token) throw new Error("FCM token alına bilmədi");

  // --- NEW: quick sanity checks to avoid sending wrong tokens (JWT etc) ---
  const sample = token.slice(0, 120);
  console.log("[push] got fcm token sample:", sample);

  // If token looks like a JWT (three dot-separated base64 parts), block and notify
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
    // don't send JWT-like tokens to subscribe endpoint
    console.error("[push] token looks like a JWT — refusing to send to /api/push/subscribe");
    throw new Error("Aldığımız token düzgün formatda deyil (JWT kimi görünür). Konsolda token sample-ı yoxla.");
  }

  // basic length check
  if (token.length < 20) {
    console.error("[push] token too short:", token.length);
    throw new Error("Aldığımız token çox qısadır; subscribe prosesi uğursuz oldu.");
  }

  // persist locally (so we don't POST repeatedly)
  localStorage.setItem(STORAGE_TOKEN, token);

  // Backend-ə qeydiyyat
  // Use absolute API (make sure env VITE_API_BASE is correct in production)
  try {
    const resp = await apiPost<SubscribeResponse>("/api/push/subscribe", {
      token,
      platform: "web",
      lang,
    });

    if (resp?.deviceId) {
      localStorage.setItem(STORAGE_DEVICE, resp.deviceId);
      console.log("[push] subscribed ok, deviceId:", resp.deviceId);
    } else {
      console.log("[push] subscribed ok, no deviceId returned");
    }

    return { token, deviceId: resp?.deviceId };
  } catch (e: any) {
    // If server responded that token invalid, clear local stored token to allow retry later
    console.error("[push] subscribe POST failed:", e?.message || e);
    // optionally remove saved token so next attempt re-creates
    localStorage.removeItem(STORAGE_TOKEN);
    throw e;
  }
}


// Köhnə adla uyğunluq
export const enablePush = subscribePush;

/** Backend-ə unsubscribe edir və local FCM token-i/deviceId-i silir */
export async function disablePush(): Promise<void> {
  const token = localStorage.getItem(STORAGE_TOKEN);
  try {
    if (token) {
      await apiPost("/api/push/unsubscribe", { token });
    }
  } catch {
    // ignore network error
  }

  const messaging = await getMessagingIfSupported();
  if (messaging) {
    try { await deleteToken(messaging); } catch {}
  }

  localStorage.removeItem(STORAGE_TOKEN);
  // deviceId-i də silmək istəyirsənsə, bunu da aç:
  // localStorage.removeItem(STORAGE_DEVICE);
}

/** Backend-in əlçatanlığını yoxlamaq üçün */
export async function pingApi(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/_ping`, { headers: DEFAULT_HEADERS, credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

/** Saxlanmış token/deviceId oxumaq üçün util (istəyə bağlı) */
export function getStoredPushIdentity() {
  return {
    token: localStorage.getItem(STORAGE_TOKEN) || null,
    deviceId: localStorage.getItem(STORAGE_DEVICE) || null,
  };
}
