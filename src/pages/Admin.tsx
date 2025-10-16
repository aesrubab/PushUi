import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./admin.css";
import { QRCodeCanvas } from "qrcode.react";
import HeaderImg from "../assets/HEADER.png";

const API = import.meta.env.VITE_API_BASE as string;

/* Ekrana sığışdırma tənzimləri */
const SCALE_BIAS = 1.0;
const SAFE_PAD   = 14;

type Stats = { qr: number; subs: number; sent: number; clicks: number; ctr: number };

// Backend yeni model (schedule/expiry/status)
type Campaign = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  createdAt: string;

  scheduledAtUtc?: string | null;
  expiresAtUtc?: string | null;
  isDispatched?: boolean;
  dispatchedAtUtc?: string | null;
  isCanceled?: boolean;
};

// datetime-local ⇄ UTC helper-ləri
function toInputLocalValue(utc?: string | null) {
  if (!utc) return "";
  const d = new Date(utc);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}
function toUtcIso(localInput?: string) {
  if (!localInput) return undefined;
  const d = new Date(localInput);
  const off = d.getTimezoneOffset();
  const utc = new Date(d.getTime() + off * 60000);
  return utc.toISOString();
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);

  // Sağ panel: son göndərilənlər
  const [sentList, setSentList] = useState<Campaign[]>([]);
  // Redaktə oluna bilənlər (planlanmış, göndərilməmiş)
  const [pendingList, setPendingList] = useState<Campaign[]>([]);

  // Form
  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/kampaniya",
    sendAtLocal: "",     // datetime-local value
    expiresAtLocal: ""   // datetime-local value
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fit-to-screen
  const boardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const recalc = () => {
      const el = boardRef.current;
      if (!el) return;
      const sw = (window.innerWidth  - SAFE_PAD * 2) / el.offsetWidth;
      const sh = (window.innerHeight - SAFE_PAD * 2) / el.offsetHeight;
      let s = Math.min(sw, sh) * SCALE_BIAS;
      s = Math.min(1, s);
      setScale(Math.max(0.6, s));
    };
    recalc();
    requestAnimationFrame(recalc);
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  async function loadStats() {
    try {
      const r = await fetch(`${API}/api/push/stats`);
      setStats(await r.json());
    } catch {
      setStats({ qr:0, subs:0, sent:0, clicks:0, ctr:0 });
    }
  }

  async function loadCampaigns() {
    try {
      const [p, s] = await Promise.all([
        fetch(`${API}/api/push/campaigns?state=pending&take=50`),
        fetch(`${API}/api/push/campaigns?state=sent&take=10`),
      ]);
      setPendingList(p.ok ? await p.json() : []);
      setSentList(s.ok ? await s.json() : []);
    } catch {
      setPendingList([]); setSentList([]);
    }
  }

  // İndi göndər
  async function sendNow() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/push/send-now`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          url: form.url || "/"
        })
      });
      alert(r.ok ? "Göndərildi" : "Xəta baş verdi");
      await Promise.all([loadStats(), loadCampaigns()]);
    } finally { setLoading(false); }
  }

  // Planla və ya yenilə
  async function scheduleOrUpdate() {
    if (!form.sendAtLocal) { alert("Göndərmə vaxtını seçin"); return; }
    setLoading(true);
    try {
      if (editingId) {
        // UPDATE
        const payload: any = {
          title: form.title,
          body: form.body,
          url: form.url
        };
        payload.sendAtUtc = toUtcIso(form.sendAtLocal);
        payload.expiresAtUtc = form.expiresAtLocal ? toUtcIso(form.expiresAtLocal) : null;

        const r = await fetch(`${API}/api/push/${editingId}`, {
          method:"PUT",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify(payload)
        });
        alert(r.ok ? "Yeniləndi" : "Xəta baş verdi");
      } else {
        // CREATE (schedule)
        const r = await fetch(`${API}/api/push/schedule`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            title: form.title,
            body: form.body,
            url: form.url,
            sendAtUtc: toUtcIso(form.sendAtLocal),
            expiresAtUtc: form.expiresAtLocal ? toUtcIso(form.expiresAtLocal) : null
          })
        });
        alert(r.ok ? "Planlandı" : "Xəta baş verdi");
      }

      await Promise.all([loadStats(), loadCampaigns()]);
      resetForm();
    } finally { setLoading(false); }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title:"", body:"", url:"/kampaniya", sendAtLocal:"", expiresAtLocal:"" });
  }

  // Redaktəyə başla
  function startEdit(c: Campaign) {
    setEditingId(c.id);
    setForm({
      title: c.title,
      body: c.body,
      url: c.url ?? "/",
      sendAtLocal: toInputLocalValue(c.scheduledAtUtc),
      expiresAtLocal: toInputLocalValue(c.expiresAtUtc)
    });
    // formun yanına scroll
    document.querySelector(".form-panel")?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  // Ləğv et (sil)
  async function cancelCampaign(id: number) {
    if (!confirm("Bu planı ləğv etmək istəyirsiniz?")) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/push/${id}/cancel`, { method:"POST" });
      alert(r.ok ? "Ləğv edildi" : "Xəta baş verdi");
      await loadCampaigns();
      if (editingId === id) resetForm();
    } finally { setLoading(false); }
  }

  useEffect(() => { loadStats(); loadCampaigns(); }, []);

  const qrUrl = `${API}/api/qr/open?to=/`;

  const canSendNow = !!form.title && !!form.body;
  const canSchedule = canSendNow && !!form.sendAtLocal;

  return (
    <div className="admin">
      <div
        ref={boardRef}
        className="board"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        <div className="header">
          <img src={HeaderImg} alt="Webonly — Digital Web Studio" className="header-img" />
        </div>

        <div className="stat-row">
          <StatCard title="QR Scans" value={stats?.qr ?? 0} />
          {/* ortadakı overlay solda + güzgü */}
          <StatCard title="Subscribers" value={stats?.subs ?? 0} className="left mirror" />
          <StatCard title="Sent Notifications" value={stats?.sent ?? 0} />
        </div>

        <div className="group">
          <div className="grid-2">
            {/* SOL PANEL: Notification form */}
            <div className="panel form-panel">
              <h3 className="section-title">Notification Message</h3>

              <div className="f-row">
                <div className="f-label">Notification Title</div>
                <input
                  className="f-input"
                  placeholder="Example Title"
                  value={form.title}
                  onChange={(e)=>setForm(f=>({...f, title:e.target.value}))}
                />
              </div>

              <div className="f-row">
                <div className="f-label">Notification Message</div>
                <input
                  className="f-input"
                  placeholder="Example Message"
                  value={form.body}
                  onChange={(e)=>setForm(f=>({...f, body:e.target.value}))}
                />
              </div>

              <div className="f-row">
                <div className="f-label">Notification Link</div>
                <input
                  className="f-input"
                  placeholder="Example Link"
                  value={form.url}
                  onChange={(e)=>setForm(f=>({...f, url:e.target.value}))}
                />
              </div>

              <h4 className="section-title sm">Timer</h4>

              {/* TIMER BLOKU */}
              <div className="timer-block">
                <div className="timer-grid">
                  <div className="t-input">
                    <input
                      className="t-text"
                      type="datetime-local"
                      value={form.sendAtLocal}
                      onChange={(e)=>setForm(f=>({...f, sendAtLocal:e.target.value}))}
                      placeholder="Send at (UTC)"
                    />
                    {/* calendar icon */}
                    <svg viewBox="0 0 24 24" className="t-ico" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8"  y1="2" x2="8"  y2="6"></line>
                      <line x1="3"  y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>

                  <div className="t-input">
                    <input
                      className="t-text"
                      type="datetime-local"
                      value={form.expiresAtLocal}
                      onChange={(e)=>setForm(f=>({...f, expiresAtLocal:e.target.value}))}
                      placeholder="Expire at (optional)"
                    />
                    {/* clock icon */}
                    <svg viewBox="0 0 24 24" className="t-ico" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M12 7v5l3 3"></path>
                    </svg>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-send"
                    disabled={loading || !canSchedule}
                    onClick={scheduleOrUpdate}
                    title={editingId ? "Yenilə" : "Planla"}
                  >
                    {editingId ? "Yenilə" : "Planla"}
                  </button>

                  <button
                    className="btn-send outline"
                    disabled={loading || !canSendNow}
                    onClick={sendNow}
                    title="Dərhal göndər"
                  >
                    Dərhal göndər
                  </button>

                  {editingId && (
                    <button className="btn-cancelEdit" onClick={resetForm}>
                      Redaktəni ləğv et
                    </button>
                  )}
                </div>
              </div>
              {/* /TIMER BLOKU */}
            </div>

            {/* SAĞ PANEL */}
            <div className="panel">
              <h3 className="section-title">Latest Notification Message</h3>

              {/* Redaktə oluna bilənlər (planlanmış) */}
              {pendingList.length > 0 && (
                <>
                  <div className="list-caption">Scheduled</div>
                  <ul className="list">
                    {pendingList.map(c=>(
                      <li key={c.id} className="list-item">
                        <div className="li-row">
                          <div className="li-main">
                            <div className="li-title">{c.title}</div>
                            <div className="li-body">{c.body}</div>
                            <div className="li-time">
                              Göndəriləcək: {c.scheduledAtUtc ? new Date(c.scheduledAtUtc).toLocaleString() : "-"}
                              {c.expiresAtUtc ? ` • Bitmə: ${new Date(c.expiresAtUtc).toLocaleString()}` : ""}
                            </div>
                          </div>
                          <div className="li-actions">
                            <button className="icon-btn" title="Düzəlt" onClick={()=>startEdit(c)}>
                              {/* pencil */}
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button className="icon-btn danger" title="Ləğv et" onClick={()=>cancelCampaign(c.id)}>
                              {/* trash */}
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Son göndərilənlər */}
              <div className="list-caption">Latest sent</div>
              <ul className="list">
                {sentList.map(c=>(
                  <li key={c.id} className="list-item">
                    <div className="li-title">{c.title}</div>
                    <div className="li-body">{c.body}</div>
                    <div className="li-time">{new Date(c.dispatchedAtUtc ?? c.createdAt).toLocaleString()}</div>
                  </li>
                ))}
                {sentList.length===0 && <li className="list-item empty">Hələ göndərilən yoxdur</li>}
              </ul>

              <div className="qr-box">
                <h4>QR – Telefon vitrini</h4>
                <QRCodeCanvas value={qrUrl} size={160}/>
                <p className="qr-link">{qrUrl}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, className="" }:{title:string; value:number; className?:string}){
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-top">Example text</div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
