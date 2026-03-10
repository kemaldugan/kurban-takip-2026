import React, { useState, useEffect, useRef, useCallback } from "react";

const ADMIN_PASSWORD = "kurban2026";
const formatTL = (n) => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }).format(n);
const uid   = () => Math.random().toString(36).substr(2, 9);
const zaman = () => new Date().toLocaleString("tr-TR");

function getBos(h) { return h.maxHisse - (h.hisseler ? h.hisseler.filter(x => x.durum === "onaylı").length : 0); }

/* ── Supabase config ── */
const SB_URL = "https://pbevwbsvhivrfdgvqexc.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZXZ3YnN2aGl2cmZkZ3ZxZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU0NDgsImV4cCI6MjA4ODczMTQ0OH0.Yudg5A8hSHWT8b-TF2Ezsnc_QMGPU2ljKQ0JaacT7o8";
const SB_HDR = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` };

async function sbOku(key) {
  const r = await fetch(`${SB_URL}/rest/v1/kurban_data?key=eq.${key}&select=value`, { headers:SB_HDR });
  const d = await r.json();
  return d.length > 0 ? JSON.parse(d[0].value) : null;
}
async function sbYaz(key, value) {
  await fetch(`${SB_URL}/rest/v1/kurban_data`, {
    method:"POST",
    headers:{ ...SB_HDR, "Prefer":"resolution=merge-duplicates" },
    body: JSON.stringify({ key, value: JSON.stringify(value) })
  });
}

const FONT = "'Amiri','Scheherazade New',Georgia,serif";

const KAYANYAZILAR = [
  "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  "Kurban, Allah'a yakınlaşmanın en güzel vesilesidir",
  "اَللّٰهُمَّ تَقَبَّلْ مِنَّا",
  "Murat Yalvaç Öğrenci Yurdu • 2026",
  "اَللّٰهُ أَكْبَرُ اَللّٰهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللّٰهُ",
];

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; background:#080503; color:#e8d5a3; font-family:${FONT}; overflow-x:hidden; -webkit-text-size-adjust: 100%; }
  
  /* Mobil Font ve Input Düzeltmeleri */
  input, select, textarea { 
    font-size: 16px !important; /* iOS zoom engelleme */
    padding: 14px !important;
    border-radius: 10px !important;
    font-family: ${FONT} !important;
  }
  
  h1 { font-size: 28px !important; }
  h2 { font-size: 22px !important; }
  h3 { font-size: 20px !important; }

  @keyframes kayDir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kayan-konteynir { background:linear-gradient(90deg,#2a0a00,#1a0800,#2a0a00); border-bottom:1px solid #d4a01744; padding:12px 0; overflow:hidden; }
  .kayan { display:inline-block; white-space:nowrap; animation:kayDir 30s linear infinite; color:#d4a017; font-size:18px; font-weight:bold; }
  
  .hayvan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px; }
  @media(max-width:480px){ 
    .hayvan-grid { grid-template-columns: 1fr; padding: 12px; } 
    .card { padding: 25px !important; }
  }
  
  .card { background:linear-gradient(145deg,#150a02,#0e0601); border:1px solid #d4a01733; border-radius:20px; padding:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  
  button { 
    cursor: pointer; 
    font-family:${FONT}; 
    border-radius:12px; 
    transition: 0.2s; 
    min-height: 50px; /* Parmakla basmaya uygun */
    font-size: 16px !important;
    font-weight: bold !important;
  }
`;

export default function App() {
  const [hayvanlar, setHayvanlar] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [view, setView] = useState("public");
  const [admin, setAdmin] = useState(false);
  const [sifre, setSifre] = useState("");
  const [sbYuklendi, setSbYuklendi] = useState(false);
  const yazmaTimer = useRef({});

  const verileriCek = async () => {
    const [h, t] = await Promise.all([sbOku("hayvanlar"), sbOku("talepler")]);
    setHayvanlar(h || []);
    setTalepler(t || []);
    setSbYuklendi(true);
  };

  useEffect(() => { verileriCek(); }, []);

  const sbKaydet = useCallback((key, value) => {
    clearTimeout(yazmaTimer.current[key]);
    yazmaTimer.current[key] = setTimeout(() => sbYaz(key, value), 400);
  }, []);

  useEffect(() => { if (sbYuklendi) sbKaydet("hayvanlar", hayvanlar); }, [hayvanlar, sbYuklendi, sbKaydet]);
  useEffect(() => { if (sbYuklendi) sbKaydet("talepler", talepler); }, [talepler, sbYuklendi, sbKaydet]);

  const onayla = (tid) => {
    const t = talepler.find(x => x.id === tid);
    const h = hayvanlar.find(x => x.id === t.hayvanId);
    if (!h || getBos(h) <= 0) return alert("Kontenjan dolu!");
    const yeniHisse = { id:uid(), ad:t.ad, telefon:t.telefon, tutar:t.tutar, tarih:zaman(), durum:"onaylı" };
    setHayvanlar(prev => prev.map(x => x.id === t.hayvanId ? {...x, hisseler:[...(x.hisseler||[]), yeniHisse]} : x));
    setTalepler(prev => prev.map(x => x.id === tid ? {...x, durum:"onaylı"} : x));
  };

  if (!sbYuklendi) return <div style={{height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#080503", color:"#d4a017", fontSize:20}}>Bağlantı Kuruluyor...</div>;

  return (
    <div>
      <style>{GLOBAL_CSS}</style>
      {view === "admin" && admin ? (
        <AdminPanel 
          hayvanlar={hayvanlar} talepler={talepler} onOnayla={onayla} 
          onSilH={(id) => setHayvanlar(p => p.filter(x => x.id !== id))}
          onEkleH={(h) => setHayvanlar(p => [...p, {...h, id:uid(), hisseler:[], durum:"aktif"}])}
          onYenile={verileriCek} onCikis={() => setView("public")}
        />
      ) : view === "login" ? (
        <LoginPanel sifre={sifre} setSifre={setSifre} onGiris={() => sifre === ADMIN_PASSWORD ? setAdmin(true)||setView("admin") : alert("Hatalı!")} onGeri={()=>setView("public")} />
      ) : (
        <PublicPanel hayvanlar={hayvanlar} onTalep={(t) => setTalepler(p => [...p, {...t, id:uid(), tarih:zaman(), durum:"bekliyor"}])} onAdmin={()=>setView("login")} />
      )}
    </div>
  );
}

function KayanBant() {
  const metin = KAYANYAZILAR.join("   ✦   ");
  return (
    <div className="kayan-konteynir">
      <div className="kayan">{metin}   ✦   {metin}</div>
    </div>
  );
}

function AdminPanel({ hayvanlar, talepler, onOnayla, onSilH, onEkleH, onYenile, onCikis }) {
  const [sekme, setSekme] = useState("talepler");
  const [yeniH, setYeniH] = useState({ numara:"", fiyat:"", maxHisse:"7" });

  const wpGonder = (t, hNo) => {
    const mesaj = `Selamün Aleyküm ${t.ad}, kurban hisseniz onaylanmıştır. Hayvan No: #${hNo}. Allah kabul etsin.`;
    window.open(`https://wa.me/${t.telefon.replace(/\D/g,'')}?text=${encodeURIComponent(mesaj)}`, '_blank');
  };

  return (
    <div style={{paddingBottom:100}}>
      <div style={{background:"linear-gradient(180deg,#2a0a00,#080503)", padding:25, borderBottom:"2px solid #d4a017", textAlign:"center"}}>
        <h2 style={{margin:0, color:"#f5e6c0"}}>YÖNETİCİ PANELİ</h2>
        <button onClick={onYenile} style={{marginTop:15, background:"#14532d", color:"#fff", border:"none", padding:"10px 20px", borderRadius:30, fontSize:14}}>🔄 Verileri Senkronize Et</button>
      </div>
      
      <div style={{display:"flex", background:"#111", borderBottom:"1px solid #333"}}>
        <button onClick={()=>setSekme("talepler")} style={{flex:1, padding:20, background:sekme==="talepler"?"#d4a017":"transparent", color:sekme==="talepler"?"#000":"#999", border:"none", fontSize:16, fontWeight:"bold"}}>TALEPLER</button>
        <button onClick={()=>setSekme("hayvanlar")} style={{flex:1, padding:20, background:sekme==="hayvanlar"?"#d4a017":"transparent", color:sekme==="hayvanlar"?"#000":"#999", border:"none", fontSize:16, fontWeight:"bold"}}>HAYVANLAR</button>
      </div>

      <div style={{padding:15}}>
        {sekme === "talepler" && talepler.filter(t=>t.durum==="bekliyor" || t.durum==="onaylı").reverse().map(t => (
          <div key={t.id} className="card" style={{marginBottom:15, borderLeft: t.durum === "onaylı" ? "5px solid #25D366" : "5px solid #8b1a1a"}}>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:18}}>
              <strong>{t.ad}</strong>
              <span style={{color:"#d4a017"}}>#{hayvanlar.find(x=>x.id===t.hayvanId)?.numara}</span>
            </div>
            <div style={{fontSize:16, color:"#806040", margin:"8px 0"}}>{t.telefon}</div>
            {t.durum === "bekliyor" ? (
              <button onClick={()=>onOnayla(t.id)} style={{width:"100%", padding:15, background:"#8b1a1a", border:"none", color:"#fff", marginTop:10, fontWeight:"bold", fontSize:16}}>✓ HİSSEYİ ONAYLA</button>
            ) : (
              <button onClick={()=>wpGonder(t, hayvanlar.find(x=>x.id===t.hayvanId)?.numara)} style={{width:"100%", padding:15, background:"#25D366", border:"none", color:"#fff", marginTop:10, fontWeight:"bold", fontSize:16}}>📲 WHATSAPP BİLDİR</button>
            )}
          </div>
        ))}

        {sekme === "hayvanlar" && (
          <div>
            <div className="card" style={{borderStyle:"dashed", marginBottom:20}}>
              <h3 style={{marginTop:0, color:"#d4a017"}}>Yeni Hayvan Kaydı</h3>
              <input placeholder="Hayvan No" style={{width:"100%", background:"#222", color:"#fff", border:"1px solid #444", marginBottom:12}} onChange={e=>setYeniH({...yeniH, numara:e.target.value})} />
              <input placeholder="Toplam Fiyat (TL)" style={{width:"100%", background:"#222", color:"#fff", border:"1px solid #444", marginBottom:12}} onChange={e=>setYeniH({...yeniH, fiyat:e.target.value})} />
              <button onClick={()=>{onEkleH(yeniH); alert("Sisteme Eklendi!");}} style={{width:"100%", background:"#d4a017", color:"#000", border:"none", fontWeight:"bold"}}>➕ LİSTEYE EKLE</button>
            </div>
            {hayvanlar.map(h => (
              <div key={h.id} className="card" style={{marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <span style={{fontSize:18}}>#{h.numara} - {getBos(h)} Boş Hisse</span>
                <button onClick={()=>onSilH(h.id)} style={{background:"transparent", color:"#f87171", border:"none", fontSize:28}}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onCikis} style={{width:"100%", padding:25, background:"#222", color:"#fff", border:"none", position:"fixed", bottom:0, fontWeight:"bold", fontSize:16}}>KAPAT VE ANA SAYFAYA DÖN</button>
    </div>
  );
}

function PublicPanel({ hayvanlar, onTalep, onAdmin }) {
  const [secili, setSecili] = useState(null);
  const [form, setForm] = useState({ ad:"", telefon:"" });

  return (
    <div>
      <div style={{textAlign:"center", padding:"50px 20px", background:"linear-gradient(180deg,#4a0a00,#080503)"}}>
        <div style={{fontSize:50, marginBottom:10}}>🕌</div>
        <h1 style={{margin:0, letterSpacing:2}}>KURBAN 2026</h1>
        <div style={{color:"#d4a017", letterSpacing:3, fontSize:14, marginTop:5, fontWeight:"bold"}}>MURAT YALVAÇ ÖĞRENCİ YURDU</div>
        <button onClick={onAdmin} style={{marginTop:25, background:"transparent", color:"#555", border:"1px solid #333", fontSize:12, padding:"8px 20px"}}>YÖNETİCİ GİRİŞİ</button>
      </div>

      <KayanBant />

      <div className="hayvan-grid">
        {hayvanlar.map(h => (
          <div key={h.id} className="card" style={{textAlign:"center", padding:"30px"}}>
            <div style={{fontSize:60, marginBottom:15}}>{h.tip==="buyukbas"?"🐄":"🐑"}</div>
            <h2 style={{margin:"0 0 10px 0"}}>#{h.numara} Nolu Hayvan</h2>
            <div style={{fontSize:26, fontWeight:"bold", color:"#d4a017", marginBottom:10}}>{formatTL(h.fiyat / h.maxHisse)}</div>
            <p style={{color:getBos(h)>0?"#4ade80":"#f87171", fontWeight:"bold", fontSize:16, marginBottom:20}}>
              {getBos(h)>0 ? `🔓 ${getBos(h)} HİSSE BOŞ` : "🔒 TAMAMI DOLDU"}
            </p>
            {getBos(h) > 0 && <button onClick={()=>setSecili(h)} style={{width:"100%", padding:18, background:"#8b1a1a", color:"#fff", border:"none", borderRadius:15, fontWeight:"bold", fontSize:16}}>HİSSE TALEP ET</button>}
          </div>
        ))}
      </div>

      {secili && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", display:"flex", alignItems:"center", padding:20, zIndex:1000}}>
          <div className="card" style={{width:"100%", maxWidth:450, margin:"auto", border:"1px solid #d4a017", padding:"30px"}}>
            <h2 style={{marginTop:0, color:"#d4a017"}}>#{secili.numara} Hisse Talebi</h2>
            <p style={{fontSize:15, opacity:0.8, marginBottom:20}}>Lütfen bilgilerinizi eksiksiz ve büyük harflerle giriniz.</p>
            
            <label style={{display:"block", marginBottom:5, fontSize:14, color:"#806040"}}>AD SOYAD</label>
            <input placeholder="ÖR: AHMET YILMAZ" style={{width:"100%", background:"#222", color:"#fff", border:"1px solid #444", marginBottom:15}} onChange={e=>setForm({...form, ad:e.target.value.toUpperCase()})} />
            
            <label style={{display:"block", marginBottom:5, fontSize:14, color:"#806040"}}>TELEFON NUMARASI</label>
            <input placeholder="ÖR: 05551234567" type="tel" style={{width:"100%", background:"#222", color:"#fff", border:"1px solid #444", marginBottom:25}} onChange={e=>setForm({...form, telefon:e.target.value})} />
            
            <button onClick={()=>{
              if(!form.ad || !form.telefon) return alert("Lütfen isim ve telefon alanlarını doldurun!");
              onTalep({...form, hayvanId:secili.id, tutar: secili.fiyat/secili.maxHisse}); 
              alert("Talebiniz iletildi! Allah kabul etsin."); 
              setSecili(null);
            }} style={{width:"100%", padding:20, background:"#8b1a1a", color:"#fff", border:"none", borderRadius:15, fontWeight:"bold", fontSize:18}}>TALEBİ GÖNDER</button>
            <button onClick={()=>setSecili(null)} style={{width:"100%", marginTop:15, background:"transparent", color:"#666", border:"none", fontSize:16}}>VAZGEÇ / KAPAT</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPanel({ sifre, setSifre, onGiris, onGeri }) {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", padding:20, background:"#080503"}}>
      <div className="card" style={{width:"100%", maxWidth:400, textAlign:"center", padding:"40px"}}>
        <div style={{fontSize:50, marginBottom:15}}>🔐</div>
        <h2 style={{marginBottom:20}}>Yönetici Girişi</h2>
        <input type="password" style={{width:"100%", padding:18, marginBottom:20, background:"#222", color:"#fff", border:"1px solid #444", textAlign:"center", fontSize:20}} onChange={e=>setSifre(e.target.value)} placeholder="Şifre" />
        <button onClick={onGiris} style={{width:"100%", padding:18, background:"#d4a017", color:"#000", border:"none", fontWeight:"bold", fontSize:18}}>SİSTEME GİRİŞ YAP</button>
        <button onClick={onGeri} style={{marginTop:20, background:"transparent", color:"#666", border:"none", fontSize:16}}>Geri Dön</button>
      </div>
    </div>
  );
}
