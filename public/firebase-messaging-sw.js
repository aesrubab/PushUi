/* eslint-disable no-undef */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => clients.claim());

importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAV4SNFrPNafJIkDTF1KviJnqYyEGPoX7E",
  authDomain: "elektromalln.firebaseapp.com",
  projectId: "elektromalln",
  appId: "1:915024041415:web:6e355d3de71323128cb5e2",
  messagingSenderId: "915024041415"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const url = payload?.data?.link || "/";
  self.registration.showNotification(
    payload?.notification?.title || "ElectroMall",
    { body: payload?.notification?.body, data: { url } }
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification?.data?.url || "/";
  e.waitUntil(clients.openWindow(url));
});
console.log("event clicked")
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  const title = data.title || "Bildiriş";
  const body  = data.body  || "";
  const icon  = data.icon  || "/icons/icon-192.png";
  const url   = data.url   || "/"; 
  console.log(`Data: ${data}`);

  event.waitUntil(self.registration.showNotification(title, { body, icon, data: { url } }));

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    clientsList.forEach(c => c.postMessage({ type: "NEW_NOTIFICATION" }));
  })());
});
