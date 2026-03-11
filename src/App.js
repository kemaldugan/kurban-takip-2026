import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── YAPILANDIRMA (LÜTFEN NUMARANIZI YAZIN) ── */
const WA_YONETICI = "905552553456"; // Mesajın gideceği numara (Sizin numaranız)
const ADMIN_PASSWORD = "kurban2026";
const SB_URL = "https://pbevwbsvhivrfdgvqexc.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZXZ3YnN2aGl2cmZkZ3ZxZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU0NDgsImV4cCI6MjA4ODczMTQ0OH0.Yudg5A8hSHWT8b-TF2Ezsnc_QMGPU2ljKQ0JaacT7o8";
const SB_HDR = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` };

/* ── YARDIMCI FONKSİYONLAR ── */
const formatTL = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
const uid = () => Math.random().toString(36).substr(2, 9);
const zaman = () => new Date().toLocaleString("tr-TR");
const getBos = (h) => h.maxHisse - (h.hisseler ? h.hisseler.filter(x => x.durum === "onaylı").length : 0);

const waGonder = (tel, mesaj) => {
  const url = `https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(mesaj)}`;
  window.open(url, '_blank');
};

/* ── SUPABASE SERVİSİ ── */
async function sbOku(key) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/kurban_data?key=eq.${key}&select=value`, { headers: SB_HDR });
    const d = await r.json();
    return d.length > 0 ? JSON.parse(d[0].value) : null;
  } catch { return null; }
}

async function sbYaz(key, value) {
  await fetch(`${SB_URL}/rest/v1/kurban_data`, {
    method: "POST",
    headers: { ...SB_HDR, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ key, value: JSON.stringify(value) })
  });
}

const FONT = "'Amiri','Scheherazade New',Georgia,serif";

/* ── GLOBAL CSS (TAM MOBİL UYUMLU) ── */
const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  body { margin:0; background:#f5efe6; font-family:${FONT}; -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
  
  /* MOBİL ERGONOMİ: Fontlar 16px altında olamaz */
  input, select, textarea { font-size: 16px !important; padding: 14px !important; border-radius: 10px; border: 1px solid #c8861a66; width:100%; margin-bottom:10px; }
  
  /* DEV BUTONLAR: Parmakla rahat basım */
  button { min-height: 52px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: ${FONT}; font-size: 16px; border:none; transition: 0.2s; }
  button:active { transform: scale(0.96); opacity: 0.8; }

  @keyframes kayDir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kayan { display:inline-block; white-space:nowrap; animation:kayDir 40s linear infinite; color:#d4a017; font-size:16px; font-weight:bold; }
  
  .hgrid { display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 15px; }
  @media(max-width:480px){ .hgrid { grid-template-columns: 1fr; } }
  
  .kart { background:#ffffff; border:1px solid #c8861a33; border-radius:20px; padding:20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
`;

export default function App() {
  const [hayvanlar, setHayvanlar] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [view, setView] = useState("public");
  const [admin, setAdmin] = useState(false);
  const [sifre, setSifre] = useState("");
  const [yuklendi, setYuklendi] = useState(false);
  const timer = useRef({});

  const verileriCek = async () => {
    const [h, t] = await Promise.all([sbOku("hayvanlar"), sbOku("talepler")]);
    setHayvanlar(h || []);
    setTalepler(t || []);
    setYuklendi(true);
  };

  useEffect(() => { verileriCek(); }, []);

  const kaydet = useCallback((key, val) => {
    clearTimeout(timer.current[key]);
    timer.current[key] = setTimeout(() => sbYaz(key, val), 600);
  }, []);

  useEffect(() => { if (yuklendi) kaydet("hayvanlar", hayvanlar); }, [hayvanlar, yuklendi, kaydet]);
  useEffect(() => { if (yuklendi) kaydet("talepler", talepler); }, [talepler, yuklendi, kaydet]);

  if (!yuklendi) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5efe6", color: "#c8861a", fontSize: 20 }}>Bağlantı Kuruluyor...</div>;

  return (
    <div>
      <style>{CSS}</style>
      {view === "admin" && admin ? (
        <AdminPanel
          hayvanlar={hayvanlar} talepler={talepler}
          onOnayla={(tid, bilgi) => {
            const t = talepler.find(x => x.id === tid);
            const h = hayvanlar.find(x => x.id === t.hayvanId);
            if (!h || getBos(h) <= 0) return alert("Kontenjan dolu!");
            const yeni = { id: uid(), ...bilgi, ad: t.ad, telefon: t.telefon, tutar: t.tutar, tarih: zaman(), odenen: 0, durum: "onaylı" };
            setHayvanlar(prev => prev.map(x => x.id === t.hayvanId ? { ...x, hisseler: [...(x.hisseler || []), yeni] } : x));
            setTalepler(prev => prev.map(x => x.id === tid ? { ...x, durum: "onaylı" } : x));
          }}
          onSil={(id) => setHayvanlar(p => p.filter(x => x.id !== id))}
          onEkle={(h) => setHayvanlar(p => [...p, { ...h, id: uid(), hisseler: [], durum: "aktif" }])}
          onYenile={verileriCek} onCikis={() => setView("public")}
        />
      ) : view === "login" ? (
        <LoginPanel sifre={sifre} setSifre={setSifre} onGiris={() => sifre === ADMIN_PASSWORD ? (setAdmin(true) || setView("admin")) : alert("Hatalı!")} onGeri={() => setView("public")} />
      ) : (
        <PublicPanel
          hayvanlar={hayvanlar}
          onTalep={(t) => {
            setTalepler(p => [...p, { ...t, id: uid(), tarih: zaman(), durum: "bekliyor" }]);
            // YÖNETİCİYE WA MESAJI
            const h = hayvanlar.find(x => x.id === t.hayvanId);
            const mesaj = `*YENİ HİSSE TALEBİ*\n\n👤 Ad: ${t.ad}\n📞 Tel: ${t.telefon}\n🐄 Hayvan: #${h?.numara}\n💰 Tutar: ${formatTL(t.tutar)}\n\n_Sistem üzerinden onay bekliyor._`;
            waGonder(WA_YONETICI, mesaj);
          }}
          onAdmin={() => setView("login")}
        />
      )}
    </div>
  );
}

/* ── BİLEŞENLER ── */
function PublicPanel({ hayvanlar, onTalep, onAdmin }) {
  const [secili, setSecili] = useState(null);
  const [form, setForm] = useState({ ad: "", telefon: "" });

  return (
    <div style={{ paddingBottom: 50 }}>
      <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(180deg,#4a0a00,#2d1a08)", color: "#f5efe6" }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>KURBAN 2026</h1>
        <div style={{ color: "#d4a017", fontWeight: "bold", fontSize: 14, letterSpacing: 2 }}>MURAT YALVAÇ ÖĞRENCİ YURDU</div>
        <button onClick={onAdmin} style={{ marginTop: 20, background: "transparent", color: "#666", border: "1px solid #444", minHeight: 30, fontSize: 12 }}>YÖNETİCİ</button>
      </div>

      <div style={{ background: "#f0e6d3", padding: "12px 0", overflow: "hidden", borderBottom: "1px solid #d4a01744" }}>
        <div className="kayan">Bismillahirrahmanirrahim   ✦   Kurban Allah'a yakınlaşmaktır   ✦   Murat Yalvaç Yurdu 2026   ✦   </div>
      </div>

      <div className="hgrid">
        {hayvanlar.filter(h => h.durum === "aktif").map(h => (
          <div key={h.id} className="kart" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60 }}>{h.tip === "buyukbas" ? "🐄" : "🐑"}</div>
            <h3 style={{ margin: "10px 0" }}>#{h.numara} Nolu Hayvan</h3>
            <div style={{ fontSize: 24, color: "#8b4a10", fontWeight: "bold" }}>{formatTL(h.fiyat / h.maxHisse)} / Hisse</div>
            <p style={{ color: getBos(h) > 0 ? "#2d7a2d" : "#8b1a1a", fontWeight: "bold" }}>{getBos(h) > 0 ? `🔓 ${getBos(h)} HİSSE BOŞ` : "🔒 TAMAMI DOLDU"}</p>
            {getBos(h) > 0 && <button onClick={() => setSecili(h)} style={{ width: "100%", background: "#8b1a1a", color: "#fff" }}>HİSSE TALEP ET</button>}
          </div>
        ))}
      </div>

      {secili && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", padding: 20, zIndex: 1000 }}>
          <div className="kart" style={{ width: "100%", maxWidth: 450, margin: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Hisse Talebi (#{secili.numara})</h2>
            <input placeholder="AD SOYAD" onChange={e => setForm({ ...form, ad: e.target.value.toUpperCase() })} />
            <input placeholder="TELEFON (05XX...)" type="tel" onChange={e => setForm({ ...form, telefon: e.target.value })} />
            <button onClick={() => {
              if (!form.ad || !form.telefon) return alert("Bilgileri doldurun!");
              onTalep({ ...form, hayvanId: secili.id, tutar: secili.fiyat / secili.maxHisse });
              alert("Talebiniz iletildi ve yöneticiye bildirildi!");
              setSecili(null);
            }} style={{ width: "100%", background: "#8b1a1a", color: "#fff" }}>TALEBİ GÖNDER VE WA BİLDİR</button>
            <button onClick={() => setSecili(null)} style={{ width: "100%", marginTop: 10, background: "transparent", color: "#666" }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ hayvanlar, talepler, onOnayla, onSil, onEkle, onYenile, onCikis }) {
  const [sekme, setSekme] = useState("talepler");
  const [yeni, setYeni] = useState({ numara: "", fiyat: "", maxHisse: "7", tip: "buyukbas" });

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: "#2d1a08", padding: 20, color: "#fff", textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>YÖNETİCİ PANELİ</h2>
        <button onClick={onYenile} style={{ marginTop: 10, background: "#2d7a2d", color: "#fff", fontSize: 13, padding: "5px 15px" }}>🔄 VERİLERİ TAZELE</button>
      </div>
      <div style={{ display: "flex", background: "#f0e6d3" }}>
        <button onClick={() => setSekme("talepler")} style={{ flex: 1, background: sekme === "talepler" ? "#c8861a" : "transparent", color: sekme === "talepler" ? "#fff" : "#8a5c30" }}>TALEPLER</button>
        <button onClick={() => setSekme("hayvanlar")} style={{ flex: 1, background: sekme === "hayvanlar" ? "#c8861a" : "transparent", color: sekme === "hayvanlar" ? "#fff" : "#8a5c30" }}>HAYVANLAR</button>
      </div>
      <div style={{ padding: 15 }}>
        {sekme === "talepler" && talepler.filter(t => t.durum === "bekliyor").map(t => (
          <div key={t.id} className="kart" style={{ marginBottom: 15 }}>
            <strong>{t.ad}</strong> ({t.telefon})
            <div style={{ margin: "10px 0", color: "#8b4a10", fontWeight: "bold" }}>Hayvan: #{hayvanlar.find(x => x.id === t.hayvanId)?.numara}</div>
            <button onClick={() => { onOnayla(t.id, {}); alert("Onaylandı!"); }} style={{ width: "100%", background: "#2d7a2d", color: "#fff" }}>✓ HİSSEYİ ONAYLA</button>
          </div>
        ))}
        {sekme === "hayvanlar" && (
          <div>
            <div className="kart" style={{ borderStyle: "dashed", marginBottom: 20 }}>
              <input placeholder="Hayvan No" onChange={e => setYeni({ ...yeni, numara: e.target.value })} />
              <input placeholder="Toplam Fiyat" onChange={e => setYeni({ ...yeni, fiyat: e.target.value })} />
              <button onClick={() => { onEkle(yeni); alert("Eklendi"); }} style={{ width: "100%", background: "#c8861a", color: "#fff" }}>➕ HAYVAN EKLE</button>
            </div>
            {hayvanlar.map(h => (
              <div key={h.id} className="kart" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>#{h.numara} ({getBos(h)} Boş)</span>
                <button onClick={() => onSil(h.id)} style={{ background: "transparent", color: "#f87171", fontSize: 24 }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onCikis} style={{ width: "100%", background: "#444", color: "#fff", position: "fixed", bottom: 0 }}>ÇIKIŞ</button>
    </div>
  );
}

function LoginPanel({ sifre, setSifre, onGiris, onGeri }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", padding: 20 }}>
      <div className="kart" style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <h2>Yönetici Girişi</h2>
        <input type="password" style={{ textAlign: "center" }} onChange={e => setSifre(e.target.value)} placeholder="Şifre" />
        <button onClick={onGiris} style={{ width: "100%", background: "#c8861a", color: "#fff" }}>GİRİŞ YAP</button>
        <button onClick={onGeri} style={{ marginTop: 15, background: "transparent", color: "#666", border: "none" }}>Geri Dön</button>
      </div>
    </div>
  );
}
