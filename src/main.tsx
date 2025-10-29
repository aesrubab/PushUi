import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Phone from "./pages/Phone";
import Admin from "./pages/Admin";
import Campaign from "./pages/Campaign";
import AdminLogin from "./pages/AdminLogin";
import PrivateOutlet from "./pages/PrivateOutlet";

import "./index.css";

/* Root-scope Service Worker (PWA + iOS) */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js", { scope: "/" })
    .catch(console.error);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Phone />} />
      <Route path="/kampaniya" element={<Campaign />} />

      {/* Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<PrivateOutlet />}>
        <Route path="/admin" element={<Admin />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
