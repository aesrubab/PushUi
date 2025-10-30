// src/pages/Phone.tsx
import "./phone.css";
import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import { subscribePush } from "../push";
import { fetchUnreadCount, fetchNotifications, markRead, type Noti } from "../lib/notifyApi";

import EmLogo from "../assets/EmLogo.png";
import Light1 from "../assets/Light1.png";
import Light2 from "../assets/Light2.png";
import Light3 from "../assets/Light3.png";
import Wave65 from "../assets/65.png";
import CallBell from "../assets/Call.png";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches ||
  (navigator as any).standalone === true;

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

type Lang = "az" | "en" | "ru";
const I18N: Record<
  Lang,
  {
    tagline: string;
    subscribed: string;
    iosHint: string;
    language: string;
    shareTitle: string;

    overlayCallTitle: string;
    overlayWaTitle: string;
    close: string;
    callAria: string;
    waAria: string;
    shareAria: string;
    bellAlt: string;
    createdBy: string;
  }
> = {
  az: {
    tagline: "Məkanınıza işıqlıq və gözəllik qatın.",
    subscribed: "Abunə olundu ✅",
    iosHint:
      "iOS-da push üçün əvvəl tətbiqi quraşdır: Safari → Paylaş → Ana ekrana əlavə et.",
    language: "Dil",
    shareTitle: "Elektro Mall",

    overlayCallTitle: "Zəng et",
    overlayWaTitle: "WhatsApp ilə əlaqə",
    close: "Bağla",
    callAria: "Telefonla zəng et",
    waAria: "WhatsApp ilə yaz",
    shareAria: "Linki paylaş",
    bellAlt: "Push icazəsi",
    createdBy: "Created by",
  },
  en: {
    tagline: "Add brightness and beauty to your space.",
    subscribed: "Subscribed ✅",
    iosHint:
      "On iOS, install the app first to enable push: Safari → Share → Add to Home Screen.",
    language: "Language",
    shareTitle: "Elektro Mall",

    overlayCallTitle: "Call",
    overlayWaTitle: "Contact via WhatsApp",
    close: "Close",
    callAria: "Call by phone",
    waAria: "Message on WhatsApp",
    shareAria: "Share link",
    bellAlt: "Enable push notifications",
    createdBy: "Created by",
  },
  ru: {
    tagline: "Добавьте яркость и красоту вашему пространству.",
    subscribed: "Подписались ✅",
    iosHint:
      "На iOS сначала установите приложение: Safari → Поделиться → На экран «Домой».",
    language: "Язык",
    shareTitle: "Elektro Mall",

    overlayCallTitle: "Позвонить",
    overlayWaTitle: "Связаться в WhatsApp",
    close: "Закрыть",
    callAria: "Позвонить по телефону",
    waAria: "Написать в WhatsApp",
    shareAria: "Поделиться ссылкой",
    bellAlt: "Разрешить push-уведомления",
    createdBy: "Создано",
  },
};

type SLink = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
};

type Contact = { id: string; name: string; phone: string; wa?: string };
const CONTACTS: Contact[] = [
  { id: "orxan",    name: "Orxan",    phone: "+994 995 98 94 94" },
  { id: "imran",    name: "İmran",    phone: "+994 10 501 94 94" },
  { id: "fehxriyye",name: "Fəxriyyə", phone: "+994 50 498 94 94" },
  { id: "firidun",  name: "Firidun",  phone: "+994 70 810 94 98" },
  { id: "elvin",    name: "Elvin",    phone: "+994 50 598 94 94" },
  { id: "vuqar",    name: "Vüqar",    phone: "+994 51 968 50 79" },
  { id: "mircavad", name: "Mircavad", phone: "+994 70 710 94 98" },
  { id: "zaur",     name: "Zaur",     phone: "+994 10 256 50 88" },
];

const socialLinks: SLink[] = [
  { id: "fb", label: "Facebook", href: "#",
    icon: <svg viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3h-3.1V8.5c0-.9.3-1.5 1.7-1.5h1.5V4.2C16.1 4.1 15 4 13.8 4 11.3 4 9.6 5.5 9.6 8.2V11H7v3h2.6v8h3.9z"/></svg> },
  { id: "wa", label: "WhatsApp", href: "#",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1c-41.9-42-97.7-65.1-157-65.1-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480 117.7 449.1c32.4 17.7 68.9 27 106.1 27l.1 0c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zM325.1 300.5c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6z"/></svg> },
  { id: "in", label: "LinkedIn", href: "#",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 32L31.9 32C14.3 32 0 46.5 0 64.3L0 447.7C0 465.5 14.3 480 31.9 480L416 480c17.6 0 32-14.5 32-32.3l0-383.4C448 46.5 433.6 32 416 32zM135.4 416l-66.4 0 0-213.8 66.5 0 0 213.8-.1 0zM102.2 96a38.5 38.5 0 1 1 0 77 38.5 38.5 0 1 1 0-77zM384.3 416l-66.4 0 0-104c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9l0 105.8-66.4 0 0-213.8 63.7 0 0 29.2 .9 0c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9l0 117.2z"/></svg> },
  { id: "ig", label: "Instagram", href: "https://www.instagram.com/elektromall_az?igsh=NjEweWc3cWFicmZh",
    icon: <svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1"/></svg> },
  { id: "web", label: "Web", href: "https://www.elektro-mall.az/",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/></svg>},
  { id: "yt", label: "YouTube", href: "#",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/></svg> },
  { id: "tt", label: "TikTok", href: "#",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M544.5 273.9C500.5 274 457.5 260.3 421.7 234.7L421.7 413.4C421.7 446.5 411.6 478.8 392.7 506C373.8 533.2 347.1 554 316.1 565.6C285.1 577.2 251.3 579.1 219.2 570.9C187.1 562.7 158.3 545 136.5 520.1C114.7 495.2 101.2 464.1 97.5 431.2C93.8 398.3 100.4 365.1 116.1 336C131.8 306.9 156.1 283.3 185.7 268.3C215.3 253.3 248.6 247.8 281.4 252.3L281.4 342.2C266.4 337.5 250.3 337.6 235.4 342.6C220.5 347.6 207.5 357.2 198.4 369.9C189.3 382.6 184.4 398 184.5 413.8C184.6 429.6 189.7 444.8 199 457.5C208.3 470.2 221.4 479.6 236.4 484.4C251.4 489.2 267.5 489.2 282.4 484.3C297.3 479.4 310.4 469.9 319.6 457.2C328.8 444.5 333.8 429.1 333.8 413.4L333.8 64L421.8 64C421.7 71.4 422.4 78.9 423.7 86.2C426.8 102.5 433.1 118.1 442.4 131.9C451.7 145.7 463.7 157.5 477.6 166.5C497.5 179.6 520.8 186.6 544.6 186.6L544.6 274z"/></svg> },
  { id: "mail", label: "Mail", href: "mailto:info@example.com",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z"/></svg> },
  { id: "share", label: "Paylaş", href: "#",
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M448 256C501 256 544 213 544 160C544 107 501 64 448 64C395 64 352 107 352 160C352 165.4 352.5 170.8 353.3 176L223.6 248.1C206.7 233.1 184.4 224 160 224C107 224 64 267 64 320C64 373 107 416 160 416C184.4 416 206.6 406.9 223.6 391.9L353.3 464C352.4 469.2 352 474.5 352 480C352 533 395 576 448 576C501 576 544 533 544 480C544 427 501 384 448 384C423.6 384 401.4 393.1 384.4 408.1L254.7 336C255.6 330.8 256 325.5 256 320C256 314.5 255.5 309.2 254.7 304L384.4 231.9C401.3 246.9 423.6 256 448 256z"/></svg> },
];

export default function Phone(){
  const [subscribed, setSubscribed] = useState(false);
  const [lang, setLang] = useState<Lang>("az");
  const [overlay, setOverlay] = useState<null | "wa" | "phone">(null);

  // NEW: bildiriş state-ləri
  const [unread, setUnread] = useState(0);
  const [notis, setNotis] = useState<Noti[]>([]);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notiPage, setNotiPage] = useState(1);
  const [notiTotal, setNotiTotal] = useState(0);

  const installed = isStandalone();
  const isiOS = isIos();

  useEffect(() => {
    (async () => {
      try {
        const c = await fetchUnreadCount();
        setUnread(c);
        const res = await fetchNotifications(1, 20);
        setNotis(res.items);
        setNotiTotal(res.total);
        setNotiPage(1);
      } catch {}
    })();

    if (navigator.serviceWorker) {
      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === "NEW_NOTIFICATION") {
          setUnread(u => u + 1);
        }
      };
      navigator.serviceWorker.addEventListener("message", onMsg);
      return () => navigator.serviceWorker.removeEventListener("message", onMsg);
    }
  }, []);

 async function enablePush(){
  try{
    await subscribePush();
    setSubscribed(true);
    alert("Abunə olundu ✅");
  }catch(e:any){
    console.error("enablePush error:", e);
    alert("Bildiriş aktiv edilə bilmədi: " + (e?.message || "Unknown error"));
    setSubscribed(false);
  }
}


  async function shareSite(e: MouseEvent<HTMLAnchorElement>){
    e.preventDefault();
    const url = window.location.href;
    try{
      if (navigator.share){
        await navigator.share({ title: I18N[lang].shareTitle, text: I18N[lang].tagline, url });
      }else{
        await navigator.clipboard.writeText(url);
        alert("Link panoya kopyalandı ✅");
      }
    }catch{}
  }

  const showIosHint = isiOS && !installed && !subscribed;

  function normalizePhone(raw: string){
    return raw.replace(/[^\d+]/g, "");
  }

  function handleContactClick(c: Contact){
    if (overlay === "wa"){
      const wa = normalizePhone(c.wa ?? c.phone).replace("+", "");
      window.location.href = `https://wa.me/${wa}`;
    }else if (overlay === "phone"){
      const tel = normalizePhone(c.phone);
      window.location.href = `tel:${tel}`;
    }
  }

  // NEW: sheet açıb, görünənləri oxundu işarələ
  async function openNotiSheet(){
    try {
      const res = await fetchNotifications(1, 20);
      setNotis(res.items);
      setNotiTotal(res.total);
      setNotiPage(1);
      await markRead(res.items.filter(n => !n.isRead).map(n => n.id));
      setUnread(0);
      setNotis(s => s.map(n => ({...n, isRead:true})));
    } catch {}
    setNotiOpen(true);
  }

  // NEW: load more
  async function loadMore(){
    const next = notiPage + 1;
    try {
      const res = await fetchNotifications(next, 20);
      setNotis(s => [...s, ...res.items]);
      setNotiPage(next);
      await markRead(res.items.filter(n => !n.isRead).map(n => n.id));
    } catch {}
  }

  return (
    <div className="stage">
      <div className="phone">
        <img src={EmLogo} className="em-logo" alt="EM" />

        <img src={Light1} className="lamp lamp-1 swing" alt="" />
        <img src={Light2} className="lamp lamp-2 swing-slow" alt="" />
        <img src={Light3} className="lamp lamp-3" alt="" />

        {/* NEW: bell + badge (mövcud onClick qorunur) */}
        <div className="bell-wrap">
          <img
            src={CallBell}
            className="bell-cta"
            alt={I18N[lang].bellAlt}
            onClick={enablePush}
          />
          {unread > 0 && (
            <span
              className="noti-badge"
              onClick={(e)=>{ e.stopPropagation(); openNotiSheet(); }}
              title="Bildirişlər"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>

        <div className="title"><div>ELEKTRO</div><div>MALL</div></div>

        {showIosHint && (
          <div className="notice notice--wide">{I18N[lang].iosHint}</div>
        )}
        {subscribed && (
          <div className="notice notice--pill" role="status">
            {I18N[lang].subscribed}
          </div>
        )}

        <p className="tagline">{I18N[lang].tagline}</p>

        <div className="social-grid">
          <a className="gold-btn" href={socialLinks[0].href} aria-label="Facebook">{socialLinks[0].icon}</a>

          <a
            className="gold-btn"
            href="#"
            onClick={(e)=>{e.preventDefault(); setOverlay("wa");}}
            aria-label={I18N[lang].waAria}
          >
            {socialLinks[1].icon}
          </a>

          <span className="spacer" aria-hidden="true" />

          <a className="gold-btn" href={socialLinks[2].href} aria-label="LinkedIn">{socialLinks[2].icon}</a>
          <a className="gold-btn" href={socialLinks[3].href} aria-label="Instagram">{socialLinks[3].icon}</a>

          <a className="gold-btn" href={socialLinks[4].href} aria-label="Telegram">{socialLinks[4].icon}</a>
          <a className="gold-btn" href={socialLinks[5].href} aria-label="YouTube">{socialLinks[5].icon}</a>
          <a className="gold-btn" href={socialLinks[6].href} aria-label="TikTok">{socialLinks[6].icon}</a>
          <a className="gold-btn" href={socialLinks[7].href} aria-label="Mail">{socialLinks[7].icon}</a>

          <a className="gold-btn" href="#" onClick={shareSite} aria-label={I18N[lang].shareAria}>
            {socialLinks[8].icon}
          </a>

          <a
            className="gold-btn"
            href="#"
            aria-label={I18N[lang].callAria}
            onClick={(e)=>{e.preventDefault(); setOverlay("phone");}}
          >
            <svg viewBox="0 0 24 24"><path d="M6.6 10.2c1.4 2.7 3.5 4.9 6.2 6.2l2.1-2.1c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.7 0 1.3.6 1.3 1.3V20c0 .7-.6 1.3-1.3 1.3C10.4 21.3 2.7 13.6 2.7 3.3 2.7 2.6 3.3 2 4 2h3.6c.7 0 1.3.6 1.3 1.3 0 1.4.3 2.8.8 4.1.1.4 0 .9-.3 1.2l-2 1.6z"/></svg>
          </a>
        </div>

        <div className="footer">
          {I18N[lang].createdBy} <b>WebOnly</b>
        </div>
        <img src={Wave65} className="footer-wave" alt="" />

        <select
          className="lang"
          aria-label={I18N[lang].language}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          <option value="az">AZ</option>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        {overlay && (
          <div className="overlay" onClick={()=>setOverlay(null)}>
            <div className="sheet" onClick={(e)=>e.stopPropagation()}>
              <h3>{overlay === "wa" ? I18N[lang].overlayWaTitle : I18N[lang].overlayCallTitle}</h3>

              <div className="list">
                {CONTACTS.map((c) => (
                  <button
                    key={c.id}
                    className="contact-pill contact-item"
                    onClick={()=>handleContactClick(c)}
                    aria-label={`${overlay === "wa" ? I18N[lang].waAria : I18N[lang].callAria}: ${c.name}`}
                  >
                    {overlay === "wa" ? (
                      <svg width="18" height="18" viewBox="0 0 448 512"><path fill="currentColor" d="M380.9 97.1c-41.9-42-97.7-65.1-157-65.1-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480 117.7 449.1c32.4 17.7 68.9 27 106.1 27l.1 0c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.2c1.4 2.7 3.5 4.9 6.2 6.2l2.1-2.1c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.7 0 1.3.6 1.3 1.3V20c0 .7-.6 1.3-1.3 1.3C10.4 21.3 2.7 13.6 2.7 3.3 2.7 2.6 3.3 2 4 2h3.6c.7 0 1.3.6 1.3 1.3 0 1.4.3 2.8.8 4.1.1.4 0 .9-.3 1.2l-2 1.6z"/></svg>
                    )}
                    <span className="name">{c.name}</span>
                  </button>
                ))}
              </div>

              <div className="close" onClick={()=>setOverlay(null)}>{I18N[lang].close}</div>
            </div>
          </div>
        )}

        {/* NEW: Bildiriş sheet – overlay-lə yanaşı işləyir */}
        {notiOpen && (
          <div className="overlay" onClick={()=>setNotiOpen(false)}>
            <div className="sheet" onClick={(e)=>e.stopPropagation()}>
              <h3>Bildirişlər</h3>

              <div className="noti-list">
                {notis.length === 0 ? (
                  <div className="empty">Hələ bildiriş yoxdur</div>
                ) : (
                  notis.map(n => (
                    <a key={n.id} className={`noti-item ${n.isRead ? "is-read" : ""}`} href={n.url || "#"}>
                      <div className="noti-top">
                        <b className="noti-title">{n.title}</b>
                        <span className="noti-time">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="noti-body">{n.body}</div>
                    </a>
                  ))
                )}
              </div>

              {(notis.length < notiTotal) && (
                <button className="gold-btn more" onClick={loadMore}>Daha çox</button>
              )}

              <div className="close" onClick={()=>setNotiOpen(false)}>{I18N[lang].close}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
