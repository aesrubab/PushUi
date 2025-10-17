import "./phone.css";
import { useEffect, useState } from "react";
import { subscribePush } from "../push";

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
  { tagline: string; subscribed: string; iosHint: string; language: string; shareTitle: string }
> = {
  az: {
    tagline: "Məkanınıza işıqlıq və gözəllik qatın.",
    subscribed: "Abunə olundu ✅",
    iosHint:
      "iOS-da push üçün əvvəl tətbiqi quraşdır: Safari → Paylaş → Ana ekrana əlavə et.",
    language: "Dil",
    shareTitle: "Elektro Mall",
  },
  en: {
    tagline: "Add brightness and beauty to your space.",
    subscribed: "Subscribed ✅",
    iosHint:
      "On iOS, install the app first to enable push: Safari → Share → Add to Home Screen.",
    language: "Language",
    shareTitle: "Elektro Mall",
  },
  ru: {
    tagline: "Добавьте яркость и красоту вашему пространству.",
    subscribed: "Подписались ✅",
    iosHint:
      "На iOS сначала установите приложение: Safari → Поделиться → На экран «Домой».",
    language: "Язык",
    shareTitle: "Elektro Mall",
  },
};

type SLink = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const socialLinks: SLink[] = [
  {
    id: "fb",
    label: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3h-3.1V8.5c0-.9.3-1.5 1.7-1.5h1.5V4.2C16.1 4.1 15 4 13.8 4 11.3 4 9.6 5.5 9.6 8.2V11H7v3h2.6v8h3.9z"/></svg>
    )
  },
  {
    id: "wa",
    label: "WhatsApp",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1c-41.9-42-97.7-65.1-157-65.1-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480 117.7 449.1c32.4 17.7 68.9 27 106.1 27l.1 0c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1s56.2 81.2 56.1 130.5c0 101.8-84.9 184.6-186.6 184.6zM325.1 300.5c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.8c-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4c-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
    )
  },
  {
    id: "in",
    label: "LinkedIn",
    href: "#",
    icon: (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 32L31.9 32C14.3 32 0 46.5 0 64.3L0 447.7C0 465.5 14.3 480 31.9 480L416 480c17.6 0 32-14.5 32-32.3l0-383.4C448 46.5 433.6 32 416 32zM135.4 416l-66.4 0 0-213.8 66.5 0 0 213.8-.1 0zM102.2 96a38.5 38.5 0 1 1 0 77 38.5 38.5 0 1 1 0-77zM384.3 416l-66.4 0 0-104c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9l0 105.8-66.4 0 0-213.8 63.7 0 0 29.2 .9 0c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9l0 117.2z"/></svg>
    )
  },
  {
    id: "ig",
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1"/></svg>
    )
  },
  {
    id: "tg",
    label: "Telegram",
    href: "#",
    icon: (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM435 240.7C431.3 279.9 415.1 375.1 406.9 419C403.4 437.6 396.6 443.8 390 444.4C375.6 445.7 364.7 434.9 350.7 425.7C328.9 411.4 316.5 402.5 295.4 388.5C270.9 372.4 286.8 363.5 300.7 349C304.4 345.2 367.8 287.5 369 282.3C369.2 281.6 369.3 279.2 367.8 277.9C366.3 276.6 364.2 277.1 362.7 277.4C360.5 277.9 325.6 300.9 258.1 346.5C248.2 353.3 239.2 356.6 231.2 356.4C222.3 356.2 205.3 351.4 192.6 347.3C177.1 342.3 164.7 339.6 165.8 331C166.4 326.5 172.5 322 184.2 317.3C256.5 285.8 304.7 265 328.8 255C397.7 226.4 412 221.4 421.3 221.2C423.4 221.2 427.9 221.7 430.9 224.1C432.9 225.8 434.1 228.2 434.4 230.8C434.9 234 435 237.3 434.8 240.6z"/></svg>
    )
  },
  {
    id: "yt",
    label: "YouTube",
    href: "#",
    icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M581.7 188.1C575.5 164.4 556.9 145.8 533.4 139.5C490.9 128 320.1 128 320.1 128C320.1 128 149.3 128 106.7 139.5C83.2 145.8 64.7 164.4 58.4 188.1C47 231 47 320.4 47 320.4C47 320.4 47 409.8 58.4 452.7C64.7 476.3 83.2 494.2 106.7 500.5C149.3 512 320.1 512 320.1 512C320.1 512 490.9 512 533.5 500.5C557 494.2 575.5 476.3 581.8 452.7C593.2 409.8 593.2 320.4 593.2 320.4C593.2 320.4 593.2 231 581.8 188.1zM264.2 401.6L264.2 239.2L406.9 320.4L264.2 401.6z"/></svg>
  )},
  {
    id: "tt",
    label: "TikTok",
    href: "#",
    icon: (
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M544.5 273.9C500.5 274 457.5 260.3 421.7 234.7L421.7 413.4C421.7 446.5 411.6 478.8 392.7 506C373.8 533.2 347.1 554 316.1 565.6C285.1 577.2 251.3 579.1 219.2 570.9C187.1 562.7 158.3 545 136.5 520.1C114.7 495.2 101.2 464.1 97.5 431.2C93.8 398.3 100.4 365.1 116.1 336C131.8 306.9 156.1 283.3 185.7 268.3C215.3 253.3 248.6 247.8 281.4 252.3L281.4 342.2C266.4 337.5 250.3 337.6 235.4 342.6C220.5 347.6 207.5 357.2 198.4 369.9C189.3 382.6 184.4 398 184.5 413.8C184.6 429.6 189.7 444.8 199 457.5C208.3 470.2 221.4 479.6 236.4 484.4C251.4 489.2 267.5 489.2 282.4 484.3C297.3 479.4 310.4 469.9 319.6 457.2C328.8 444.5 333.8 429.1 333.8 413.4L333.8 64L421.8 64C421.7 71.4 422.4 78.9 423.7 86.2C426.8 102.5 433.1 118.1 442.4 131.9C451.7 145.7 463.7 157.5 477.6 166.5C497.5 179.6 520.8 186.6 544.6 186.6L544.6 274z"/></svg>
    )
  },
  {
    id: "mail",
    label: "Mail",
    href: "mailto:info@example.com",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z"/></svg>
    )
  },
  {
    id: "share",
    label: "Paylaş",
    href: "#",
    icon: (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M448 256C501 256 544 213 544 160C544 107 501 64 448 64C395 64 352 107 352 160C352 165.4 352.5 170.8 353.3 176L223.6 248.1C206.7 233.1 184.4 224 160 224C107 224 64 267 64 320C64 373 107 416 160 416C184.4 416 206.6 406.9 223.6 391.9L353.3 464C352.4 469.2 352 474.5 352 480C352 533 395 576 448 576C501 576 544 533 544 480C544 427 501 384 448 384C423.6 384 401.4 393.1 384.4 408.1L254.7 336C255.6 330.8 256 325.5 256 320C256 314.5 255.5 309.2 254.7 304L384.4 231.9C401.3 246.9 423.6 256 448 256z"/></svg>
    )
  }
];

export default function Phone(){
  const [subscribed, setSubscribed] = useState(false);
  const [lang, setLang] = useState<Lang>("az");

  const installed = isStandalone();
  const isiOS = isIos();

  useEffect(() => {}, []);

  async function enablePush(){
    try{
      await subscribePush();
      setSubscribed(true);
    }catch(e){
      console.error(e); 
      setSubscribed(false);
    }
  }

  async function shareSite(e: React.MouseEvent){
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

  return (
    <div className="stage">
      <div className="phone">
        <img src={EmLogo} className="em-logo" alt="EM" />

        <img src={Light1} className="lamp lamp-1 swing" alt="" />
        <img src={Light2} className="lamp lamp-2 swing-slow" alt="" />
        <img src={Light3} className="lamp lamp-3" alt="" />

        <img
          src={CallBell}
          className="bell-cta"
          alt="Push icazəsi"
          onClick={enablePush}
        />

        <div className="title"><div>ELEKTRO</div><div>MALL</div></div>

        {subscribed && <div className="subscribed" role="status">{I18N[lang].subscribed}</div>}

        <p className="tagline">{I18N[lang].tagline}</p>

        <div className="social-grid">
          <a className="gold-btn" href={socialLinks[0].href} aria-label={socialLinks[0].label}>{socialLinks[0].icon}</a>
          <a className="gold-btn" href={socialLinks[1].href} aria-label={socialLinks[1].label}>{socialLinks[1].icon}</a>
          <span className="spacer" aria-hidden="true" />
          <a className="gold-btn" href={socialLinks[2].href} aria-label={socialLinks[2].label}>{socialLinks[2].icon}</a>
          <a className="gold-btn" href={socialLinks[3].href} aria-label={socialLinks[3].label}>{socialLinks[3].icon}</a>

          <a className="gold-btn" href={socialLinks[4].href} aria-label={socialLinks[4].label}>{socialLinks[4].icon}</a>
          <a className="gold-btn" href={socialLinks[5].href} aria-label={socialLinks[5].label}>{socialLinks[5].icon}</a>
          <a className="gold-btn" href={socialLinks[6].href} aria-label={socialLinks[6].label}>{socialLinks[6].icon}</a>
          <a className="gold-btn" href={socialLinks[7].href} aria-label={socialLinks[7].label}>{socialLinks[7].icon}</a>
          <a className="gold-btn" href="#" onClick={shareSite} aria-label={socialLinks[8].label}>{socialLinks[8].icon}</a>
        </div>

        <div className="footer">Created by <b>WebOnly</b></div>
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

        {isiOS && !installed && (
          <div className="ios-hint">{I18N[lang].iosHint}</div>
        )}
      </div>
    </div>
  );
}
