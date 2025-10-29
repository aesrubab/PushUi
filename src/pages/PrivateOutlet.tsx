import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function PrivateOutlet() {
  const loc = useLocation();
  if (!isAuthed()) return <Navigate to="/admin/login" state={{ from: loc }} replace />;
  return <Outlet />;
}
