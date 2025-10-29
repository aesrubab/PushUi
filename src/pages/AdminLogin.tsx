import { useState } from "react";
import { post } from "../lib/api";
import { saveToken } from "../lib/auth";
import EmLogo from "../assets/EmLogo.png";
import "./admin.css";

export default function AdminLogin() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await post<{ token: string }>("/api/auth/login", {
        username: u,
        password: p,
      });
      saveToken(r.token);
      location.replace("/admin");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap darkgold">
      <div className="login-bg" aria-hidden="true" />
      <form className="login-card gold" onSubmit={onSubmit}>
        <div className="login-head">
          <div className="login-logo">
            <img src={EmLogo} alt="EM" />
          </div>
          <div className="login-title">
            <h2>Admin Login</h2>
            <p>Panela daxil olun</p>
          </div>
        </div>

        <label className="f">
          <span>İstifadəçi adı</span>
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
            placeholder="admin"
          />
        </label>

        <label className="f">
          <span>Şifrə</span>
          <div className="pwd">
            <input
              type={show ? "text" : "password"}
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="eye"
              aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"}
              onClick={() => setShow((s) => !s)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                {show ? (
                  <path
                    d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.11 1 12c.54-1.27 1.33-2.46 2.31-3.5M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-.88M10.73 5.08A10.94 10.94 0 0112 4c5 0 9.27 3.89 11 8-.55 1.3-1.35 2.5-2.34 3.55M1 1l22 22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                ) : (
                  <>
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </label>

        {err && <div className="alert">{err}</div>}

        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" aria-hidden="true" /> : "Daxil ol"}
        </button>

        <div className="login-foot">© WebOnly • ElektroMall</div>
      </form>
    </div>
  );
}
