import { useEffect, useState } from "react";
import "./admin.css";
import { QRCodeCanvas } from "qrcode.react";
import HeaderImg from "../assets/HEADER.png";
import { API, get, post } from "../lib/api";
import { clearToken } from "../lib/auth";
import { useNavigate } from "react-router-dom";

type Stats = { qr: number; subs: number; sent: number; clicks: number; ctr: number };
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

function localInputFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function toInputLocalValue(utc?: string | null) {
  if (!utc) return "";
  return localInputFromDate(new Date(utc));
}
function toUtcIso(localInput?: string) {
  if (!localInput) return undefined;
  return new Date(localInput).toISOString();
}
function nowLocalPlus(mins = 5) {
  return localInputFromDate(new Date(Date.now() + mins * 60_000));
}

function Pager({
  page, total, onPrev, onNext,
}: { page: number; total: number; onPrev(): void; onNext(): void; }) {
  return (
    <div className="pager">
      <span className="pager-count">{total ? `${page + 1}/${total}` : "0/0"}</span>
      <button className="pager-btn" onClick={onPrev} disabled={page <= 0} aria-label="Previous">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button className="pager-btn" onClick={onNext} disabled={page >= total - 1} aria-label="Next">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);

  const [sentList, setSentList] = useState<Campaign[]>([]);
  const [pendingList, setPendingList] = useState<Campaign[]>([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [sentPage, setSentPage] = useState(0);

  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/kampaniya",
    sendAtLocal: nowLocalPlus(5),
    expiresAtLocal: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function bumpToLoginIf401(e: any) {
    if (e?.message === "Unauthorized") {
      clearToken();
      navigate("/admin/login", { replace: true });
      return true;
    }
    return false;
  }

  async function loadStats() {
    try {
      setStats(await get<Stats>("/api/push/stats"));
    } catch (e: any) {
      if (bumpToLoginIf401(e)) return;
      setStats({ qr: 0, subs: 0, sent: 0, clicks: 0, ctr: 0 });
    }
  }

  async function loadCampaigns() {
    try {
      const [p, s] = await Promise.all([
        get<Campaign[]>("/api/push/campaigns?state=pending&take=50"),
        get<Campaign[]>("/api/push/campaigns?state=sent&take=50"),
      ]);
      setPendingList(p || []);
      setSentList(s || []);
      setPendingPage(0);
      setSentPage(0);
    } catch (e: any) {
      if (bumpToLoginIf401(e)) return;
      setPendingList([]);
      setSentList([]);
    }
  }

  useEffect(() => {
    loadStats();
    loadCampaigns();
    const id = setInterval(() => loadCampaigns(), 10_000);
    return () => clearInterval(id);
  }, []);

  const PER = 2;
  const pendingTotal = Math.max(1, Math.ceil(pendingList.length / PER));
  const sentTotal = Math.max(1, Math.ceil(sentList.length / PER));
  const pendingPageItems = pendingList.slice(pendingPage * PER, pendingPage * PER + PER);
  const sentPageItems = sentList.slice(sentPage * PER, sentPage * PER + PER);

  async function sendNow() {
    if (!form.title || !form.body) return;
    setLoading(true);
    try {
      await post("/api/push/send-now", {
        title: form.title,
        body: form.body,
        url: form.url || "/",
      });
      
      alert("Göndərildi");
      await Promise.all([loadStats(), loadCampaigns()]);
    } catch (e: any) {
      if (bumpToLoginIf401(e)) return;
      alert(`Xəta: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function scheduleOrUpdate() {
    if (!form.sendAtLocal) {
      alert("Göndərmə vaxtını seçin");
      return;
    }
    if (form.expiresAtLocal) {
      if (new Date(form.expiresAtLocal) <= new Date(form.sendAtLocal)) {
        alert("Expire vaxtı Send vaxtından böyük olmalıdır");
        return;
      }
    }
    setLoading(true);
    try {
      if (editingId) {
        const payload: any = {
          title: form.title,
          body: form.body,
          url: form.url,
          sendAtUtc: toUtcIso(form.sendAtLocal),
        };
        if (form.expiresAtLocal) payload.expiresAtUtc = toUtcIso(form.expiresAtLocal);
        await post(`/api/push/${editingId}`, payload); // server PUT dəstəkləyirsə uyğunlaşdırın
        alert("Yeniləndi");
      } else {
        await post("/api/push/schedule", {
          title: form.title,
          body: form.body,
          url: form.url,
          sendAtUtc: toUtcIso(form.sendAtLocal),
          expiresAtUtc: form.expiresAtLocal ? toUtcIso(form.expiresAtLocal) : null,
        });
        alert("Planlandı");
      }
      await Promise.all([loadStats(), loadCampaigns()]);
      resetForm();
    } catch (e: any) {
      if (bumpToLoginIf401(e)) return;
      alert(`Xəta: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", body: "", url: "/kampaniya", sendAtLocal: nowLocalPlus(5), expiresAtLocal: "" });
  }

  function startEdit(c: Campaign) {
    setEditingId(c.id);
    setForm({
      title: c.title,
      body: c.body,
      url: c.url ?? "/",
      sendAtLocal: toInputLocalValue(c.scheduledAtUtc),
      expiresAtLocal: toInputLocalValue(c.expiresAtUtc),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cancelCampaign(id: number) {
    if (!confirm("Bu planı ləğv etmək istəyirsiniz?")) return;
    setLoading(true);
    try {
      await post(`/api/push/${id}/cancel`, {});
      await loadCampaigns();
      if (editingId === id) resetForm();
    } catch (e: any) {
      if (bumpToLoginIf401(e)) return;
      alert(`Xəta: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    navigate("/admin/login", { replace: true });
  }

  const qrUrl = `${API}/api/qr/open?to=/`;
  const canSendNow = !!form.title && !!form.body;
  const canSchedule = canSendNow && !!form.sendAtLocal;

  return (
    <div className="admin">
      <div className="board">
        <div className="header">
          <img src={HeaderImg} alt="Webonly — Digital Web Studio" className="header-img" />
          <button className="logout-btn" onClick={logout} title="Çıxış">Logout</button>
        </div>

        <div className="stat-row">
          <StatCard title="QR Scans" value={stats?.qr ?? 0} />
          <StatCard title="Subscribers" value={stats?.subs ?? 0} className="left mirror" />
          <StatCard title="Sent Notifications" value={stats?.sent ?? 0} />
        </div>

        <div className="group">
          <div className="grid-2">
            <div className="panel form-panel">
              <h3 className="section-title">Notification Message</h3>

              <div className="f-row">
                <div className="f-label">Notification Title</div>
                <input className="f-input" placeholder="Example Title"
                  value={form.title} onChange={(e)=>setForm(f=>({...f, title:e.target.value}))}/>
              </div>

              <div className="f-row">
                <div className="f-label">Notification Message</div>
                <input className="f-input" placeholder="Example Message"
                  value={form.body} onChange={(e)=>setForm(f=>({...f, body:e.target.value}))}/>
              </div>

              <div className="f-row">
                <div className="f-label">Notification Link</div>
                <input className="f-input" placeholder="Example Link"
                  value={form.url} onChange={(e)=>setForm(f=>({...f, url:e.target.value}))}/>
              </div>

              <h4 className="section-title sm">Timer</h4>

              <div className="timer-block">
                <div className="timer-grid">
                  <div className="t-field">
                    <div className="t-label">Send date</div>
                    <div className="t-input">
                      <input className="t-text" type="datetime-local" value={form.sendAtLocal}
                        min={nowLocalPlus(1)}
                        onChange={(e)=>{
                          const send = e.target.value;
                          setForm(f=>{
                            let exp = f.expiresAtLocal;
                            if (exp && new Date(exp) <= new Date(send)) {
                              const m = new Date(send); m.setMinutes(m.getMinutes()+30);
                              exp = localInputFromDate(m);
                            }
                            return { ...f, sendAtLocal: send, expiresAtLocal: exp };
                          });
                        }}/>
                      <svg viewBox="0 0 24 24" className="t-ico" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>

                  <div className="t-field">
                    <div className="t-label">Expire date (optional)</div>
                    <div className="t-input">
                      <input className="t-text" type="datetime-local" value={form.expiresAtLocal}
                        min={form.sendAtLocal || nowLocalPlus(2)}
                        onChange={(e)=>setForm(f=>({...f, expiresAtLocal:e.target.value}))}/>
                      <svg viewBox="0 0 24 24" className="t-ico" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M12 7v5l3 3"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-send" disabled={loading || !canSchedule}
                    onClick={scheduleOrUpdate} title={editingId ? "Yenilə" : "Planla"}>
                    {editingId ? "Yenilə" : "Planla"}
                  </button>

                  <button className="btn-send outline" disabled={loading || !canSendNow}
                    onClick={sendNow} title="Dərhal göndər">
                    Dərhal göndər
                  </button>

                  <button className="btn-cancelEdit" onClick={()=>setForm(f=>({...f, expiresAtLocal:""}))}>
                    Expire sahəsini təmizlə
                  </button>

                  {editingId && (
                    <button className="btn-cancelEdit" onClick={resetForm}>Redaktəni ləğv et</button>
                  )}
                </div>
              </div>
            </div>

            <div className="panel right-panel">
              <h3 className="section-title">Latest Notification Message</h3>

              <div className="list-caption row">
                <span>Scheduled</span>
                <Pager
                  page={Math.min(pendingPage, Math.max(0, pendingTotal - 1))}
                  total={pendingList.length ? Math.ceil(pendingList.length / PER) : 0}
                  onPrev={()=>setPendingPage(p=>Math.max(0, p-1))}
                  onNext={()=>setPendingPage(p=>Math.min(Math.ceil(pendingList.length/ PER)-1, p+1))}
                />
              </div>
              <ul className="list">
                {pendingPageItems.map(c=>(
                  <li key={c.id} className="list-item">
                    <div className="li-main">
                      <div className="li-title">
                        {c.title} <span className="badge badge-pending">Pending</span>
                      </div>
                      <div className="li-body">{c.body}</div>
                      <div className="li-time">
                        Göndəriləcək: {c.scheduledAtUtc ? new Date(c.scheduledAtUtc).toLocaleString() : "-"}
                        {c.expiresAtUtc ? ` • Bitmə: ${new Date(c.expiresAtUtc).toLocaleString()}` : ""}
                      </div>
                    </div>
                    <div className="li-actions">
                      <button className="icon-btn" title="Düzəlt" onClick={()=>startEdit(c)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button className="icon-btn danger" title="Ləğv et" onClick={()=>cancelCampaign(c.id)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
                {!pendingList.length && <li className="list-item empty">Plan yoxdur</li>}
              </ul>

              <div className="list-caption row">
                <span>Latest sent</span>
                <Pager
                  page={Math.min(sentPage, Math.max(0, sentTotal - 1))}
                  total={sentList.length ? Math.ceil(sentList.length / PER) : 0}
                  onPrev={()=>setSentPage(p=>Math.max(0, p-1))}
                  onNext={()=>setSentPage(p=>Math.min(Math.ceil(sentList.length/ PER)-1, p+1))}
                />
              </div>
              <ul className="list">
                {sentPageItems.map(c=>(
                  <li key={c.id} className="list-item">
                    <div className="li-main">
                      <div className="li-title">
                        {c.title} {c.isCanceled ? <span className="badge badge-canceled">Canceled</span> : <span className="badge badge-sent">Sent</span>}
                      </div>
                      <div className="li-body">{c.body}</div>
                      <div className="li-time">{new Date(c.dispatchedAtUtc ?? c.createdAt).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
                {!sentList.length && <li className="list-item empty">Hələ göndərilən yoxdur</li>}
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

function StatCard({ title, value, className="" }:{title:string; value:number; className?:string}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-top">Example text</div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}


