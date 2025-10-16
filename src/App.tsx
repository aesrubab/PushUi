import "./App.css";

// Şəkillərini assets-dən gətir (adları səndə fərqli ola bilər)
import EmLogo from "./assets/EmLogo.png";
import Light1 from "./assets/Light1.png";
import Light2 from "./assets/Light2.png";
import Light3 from "./assets/Light3.png";

export default function App() {
  return (
    <div className="stage">
      <div className="phone">

        {/* logo */}
        <img src={EmLogo} alt="EM" className="em-logo" />

        {/* lampalar (üst-üstə qatlar) */}
        <img src={Light1} alt="light 1" className="lamp lamp-1" />
        <img src={Light2} alt="light 2" className="lamp lamp-2" />
        <img src={Light3} alt="light 3" className="lamp lamp-3" />

        {/* başlıq + mətn */}
        <div className="title">
          <div>ELEKTRO</div>
          <div>MALL</div>
        </div>
        <p className="tagline">Məkanınıza işıqlıq və gözəllik qatın.</p>

        {/* sosial ikonlar (hazırda “qızıl” dairələr + hərflər) */}
        <div className="social-grid">
          {["f","wa","in","ig","tg","map","tt","mail","share"].map((k)=>(
            <a key={k} href="#" className="gold-btn" aria-label={k}>{k}</a>
          ))}
        </div>

        {/* footer */}
        <div className="footer">
          <span>Created by <b>WebOnly</b></span>
          <select className="lang">
            <option>Dil</option>
            <option>AZ</option>
            <option>RU</option>
            <option>EN</option>
          </select>
        </div>
      </div>
    </div>
  );
}
