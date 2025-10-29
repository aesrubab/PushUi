let deferredPrompt: any | null = null;
type Listener = (canInstall: boolean) => void;
let listeners: Listener[] = [];

/** beforeinstallprompt hadisəsini tut və düyməni aktiv et */
export function setupInstallPromptListener() {
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();          // brauzerin default bannerini dayandır
    deferredPrompt = e;          // sonradan öz düyməmizlə çağıracağıq
    listeners.forEach(fn => fn(true));
  });

  // quraşdırıldıqdan sonra flag-ları təmizlə
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach(fn => fn(false));
  });
}

/** UI-ya “quraşdır” düyməsini nə vaxt göstərmək lazım olduğunu deyir */
export function onInstallAvailability(cb: Listener) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(x => x !== cb); };
}

/** Öz “Tətbiqi quraşdır” düymən üçün çağırırsan */
export async function triggerInstall() {
  if (!deferredPrompt) return { ok: false, reason: "not-available" };
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice; // 'accepted' | 'dismissed'
  deferredPrompt = null;
  listeners.forEach(fn => fn(false));
  return { ok: outcome === "accepted", outcome };
}

/** PWA rejimindəsənmi (tam ekran)? */
export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true; // iOS Safari
}

/** iOS cihazıdırmı? */
export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
