import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Phone from "./pages/Phone";
import Admin from "./pages/Admin";
import Campaign from "./pages/Campaign";
import "./index.css";

/* ✅ Root-scope Service Worker qeydiyyatı (PWA üçün iOS-da da işləsin) */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js", { scope: "/" })
    .catch(console.error);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Phone />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/kampaniya" element={<Campaign />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
