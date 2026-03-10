import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── YAPILANDIRMA ── */
const ADMIN_PASSWORD = "kurban2026";
const SB_URL = "https://pbevwbsvhivrfdgvqexc.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZXZ3YnN2aGl2cmZkZ3ZxZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU0NDgsImV4cCI6MjA4ODczMTQ0OH0.Yudg5A8hSHWT8b-TF2Ezsnc_QMGPU2ljKQ0JaacT7o8";
const SB_HDR = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` };

/* ── YARDIMCI ARAÇLAR ── */
const formatTL = (n) => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }).format(n);
const uid = () => Math.random().toString(36).substr(2, 9);
const zaman = () => new Date().toLocaleString("tr-TR");
const getBos = (h) => h.maxHisse - (h.hisseler ? h.hisseler.length : 0);

/* ── SUPABASE SERVİSİ ── */
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

/* ── GLOBAL TASARIM (MOBİL ODAKLI) ── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; background:#080503; color:#e8d5a3; font-family:${FONT}; -webkit-text-size-adjust: 100%; overflow-x: hidden; }
  
  /* MOBİL ERGONOMİ: Dev Giriş Alanları */
  input, select { 
    font-size: 16px !important; 
    padding: 16px !important;
    border-radius: 12px !important;
    background: #1a1108 !important;
    border: 1px solid #d4a01766 !important;
    color: #f5e6c0 !important;
    width: 100%;
    margin-bottom: 12px;
    font-family: ${FONT} !important;
  }
  
  /* MOBİL ERGONOMİ: Dev Butonlar */
  button { 
    min-height: 54px !important; 
    border-radius: 14px !important;
    font-size: 16px !important;
    font-weight: bold !important;
    cursor: pointer;
    border: none;
    font-family: ${FONT};
    transition: 0.2s;
  }
  button:active { transform: scale(0.97); opacity: 0.8; }

  /* Kayan Yazı Animasyonu */
  @keyframes kayDir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kayan-bant { background:linear-gradient(90deg,#2a0a00,#1a0800,#2a0a00); border-bottom:1px solid #d4a01744; padding:12px 0; overflow:hidden; }
  .kayan-yazi { display:inline-block; white-space:nowrap; animation:kayDir 30s linear infinite; color:#d4a017; font-size:18px; }

  .hayvan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px; }
  @media(max-width:480px){ .hayvan-grid { grid-template-columns: 1fr; padding: 12px; } }
  
  .kart { background:linear-gradient(160deg,#150a02,#0e0601); border:1px solid #d4a01733; border-radius:24px; padding:25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
`;

/* ── ANA UYGULAMA ── */
export default function App() {
  const [hayvanlar, setHayvanlar] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [view, setView] = useState("public");
  const [admin, setAdmin] = useState(false);
  const [sifre, setSifre] = useState("");
  const [yuklendi, setYuklendi] = useState(false);
  const timer = useRef({});

  const verileriGetir = async () => {
    const [h, t] = await Promise.all([sbOku("hayvanlar"), sbOku("talepler")]);
    setHayvanlar(h || []);
    setTalepler(t || []);
    setYuklendi(true);
  };

  useEffect(() => { verileriGetir(); }, []);

  const kaydet = useCallback((key, val) => {
    clearTimeout(timer.current[key]);
    timer.current[key] = setTimeout(() => sbYaz(key, val), 500);
  }, []);

  useEffect(() => { if(yuklendi) kaydet("hayvanlar", hayvanlar); }, [hayvanlar, yuklendi, kaydet]);
  useEffect(() => { if(yuklendi) kaydet("talepler", talepler); }, [talepler, yuklendi, kaydet]);

  if (!yuklendi) return <div style={{height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#080503", color:"#d4a017", fontSize:20}}>Bağlantı Kuruluyor...</div>;

  return (
    <div style={{minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      {view === "admin" && admin ? (
        <AdminPanel 
          hayvanlar={hayvanlar} talepler={talepler} 
          onOnayla={(tid) => {
            const t = talepler.find(x => x.id === tid);
            const h = hayvanlar.find(x => x.id === t.hayvanId);
            if (!h || getBos(h) <= 0) return alert("Kontenjan dolu!");
            const yeni = { id:uid(), ad:t.ad, telefon:t.telefon, tarih:zaman(), durum:"onaylı" };
            setHayvanlar(prev => prev.map(x => x.id === t.hayvanId ? {...x, hisseler:[...(x.hisseler||[]), yeni]} : x));
            setTalepler(prev => prev.map(x => x.id === tid ? {...x, durum:"onaylı"} : x));
          }}
          onSil={(id) => setHayvanlar(p => p.filter(x => x.id !== id))}
          onEkle={(h) => setHayvanlar(p => [...p, {...h, id:uid(), hisseler:[], durum:"aktif"}])}
          onYenile={verileriGetir} onCikis={() => setView("public")}
        />
      ) : view === "login" ? (
        <LoginPanel sifre={sifre} setSifre={setSifre} onGiris={() => sifre===ADMIN_PASSWORD ? (setAdmin(true)||setView("admin")) : alert("Hatalı!")} onGeri={()=>setView("public")} />
      ) : (
        <PublicPanel 
          hayvanlar={hayvanlar} 
          onTalep={(t) => setTalepler(p => [...p, {...t, id:uid(), tarih:zaman(), durum:"bekliyor"}])} 
          onAdmin={()=>setView("login")} 
        />
      )}
    </div>
  );
}

/* ── BİLEŞENLER ── */
function KayanBant() {
  const metin = ["بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", "Kurban Allah'a yakınlaşmaktır", "اَللّٰهُمَّ تَقَبَّلْ مِنَّا", "Murat Yalvaç Yurdu 2026"].join("   ✦   ");
  return (
    <div className="kayan-bant"><div className="kayan-yazi">{metin}   ✦   {metin}</div></div>
  );
}

function PublicPanel({ hayvanlar, onTalep, onAdmin }) {
  const [secili, setSecili] = useState(null);
  const [form, setForm] = useState({ ad:"", telefon:"" });

  return (
    <div>
      <div style={{textAlign:"center", padding:"50px 20px", background:"linear-gradient(180deg,#4a0a00,#080503)"}}>
        <div style={{fontSize:50, marginBottom:10}}>🕌</div>
        <h1 style={{margin:0}}>KURBAN 2026</h1>
        <div style={{color:"#d4a017", fontWeight:"bold", fontSize:14, letterSpacing:2}}>MURAT YALVAÇ ÖĞRENCİ YURDU</div>
        <button onClick={onAdmin} style={{marginTop:20, background:"transparent", color:"#444", border:"1px solid #222", fontSize:12, minHeight:30}}>YÖNETİCİ</button>
      </div>
      <KayanBant />
      <div className="hayvan-grid">
        {hayvanlar.map(h => (
          <div key={h.id} className="kart" style={{textAlign:"center"}}>
            <div style={{fontSize:50}}>{h.tip==="buyukbas"?"🐄":"🐑"}</div>
            <h3>#{h.numara} Nolu Hayvan</h3>
            <div style={{fontSize:24, color:"#d4a017", fontWeight:"bold"}}>{formatTL(h.fiyat / h.maxHisse)}</div>
            <p style={{color:getBos(h)>0?"#4ade80":"#f87171", fontWeight:"bold"}}>{getBos(h)>0 ? `🔓 ${getBos(h)} HİSSE BOŞ` : "🔒 DOLDU"}</p>
            {getBos(h) > 0 && <button onClick={()=>setSecili(h)} style={{width:"100%", background:"#8b1a1a", color:"#fff"}}>HİSSE TALEP ET</button>}
          </div>
        ))}
      </div>
      {secili && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", display:"flex", alignItems:"center", padding:20, zIndex:1000}}>
          <div className="kart" style={{width:"100%", maxWidth:450, margin:"auto", border:"1px solid #d4a017"}}>
            <h2 style={{marginTop:0}}>#{secili.numara} Hisse Talebi</h2>
            <input placeholder="AD SOYAD" onChange={e=>setForm({...form, ad:e.target.value.toUpperCase()})} />
            <input placeholder="TELEFON (05XX...)" type="tel" onChange={e=>setForm({...form, telefon:e.target.value})} />
            <button onClick={()=>{
              if(!form.ad || !form.telefon) return alert("Eksik bilgi!");
              onTalep({...form, hayvanId:secili.id, tutar: secili.fiyat/secili.maxHisse});
              alert("Talebiniz iletildi!"); setSecili(null);
            }} style={{width:"100%", background:"#8b1a1a", color:"#fff"}}>TALEBİ GÖNDER</button>
            <button onClick={()=>setSecili(null)} style={{width:"100%", marginTop:10, background:"transparent", color:"#666"}}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ hayvanlar, talepler, onOnayla, onSil, onEkle, onYenile, onCikis }) {
  const [sekme, setSekme] = useState("talepler");
  const [yeni, setYeni] = useState({ numara:"", fiyat:"", maxHisse:"7", tip:"buyukbas" });

  const wp = (t, hNo) => {
    const m = `Selamün Aleyküm ${t.ad}, kurban hisseniz onaylanmıştır. Hayvan No: #${hNo}. Allah kabul etsin.`;
    window.open(`https://wa.me/${t.telefon.replace(/\D/g,'')}?text=${encodeURIComponent(m)}`, '_blank');
  };

  return (
    <div style={{paddingBottom:80}}>
      <div style={{background:"#1a0800", padding:20, borderBottom:"2px solid #d4a017", textAlign:"center"}}>
        <h2 style={{margin:0}}>YURT YÖNETİMİ</h2>
        <button onClick={onYenile} style={{marginTop:10, background:"#14532d", color:"#fff", fontSize:13}}>🔄 VERİLERİ TAZELE</button>
      </div>
      <div style={{display:"flex", background:"#111"}}>
        <button onClick={()=>setSekme("talepler")} style={{flex:1, background:sekme==="talepler"?"#d4a017":"transparent", color:sekme==="talepler"?"#000":"#666"}}>TALEPLER</button>
        <button onClick={()=>setSekme("hayvanlar")} style={{flex:1, background:sekme==="hayvanlar"?"#d4a017":"transparent", color:sekme==="hayvanlar"?"#000":"#666"}}>HAYVANLAR</button>
      </div>
      <div style={{padding:15}}>
        {sekme === "talepler" && talepler.reverse().map(t => (
          <div key={t.id} className="kart" style={{marginBottom:15}}>
            <div style={{display:"flex", justifyContent:"space-between"}}><strong>{t.ad}</strong> <span style={{color:"#d4a017"}}>#{hayvanlar.find(x=>x.id===t.hayvanId)?.numara}</span></div>
            <div style={{fontSize:14, margin:"5px 0"}}>{t.telefon}</div>
            {t.durum === "bekliyor" ? (
              <button onClick={()=>onOnayla(t.id)} style={{width:"100%", background:"#8b1a1a", color:"#fff", marginTop:10}}>✓ ONAYLA</button>
            ) : (
              <button onClick={()=>wp(t, hayvanlar.find(x=>x.id===t.hayvanId)?.numara)} style={{width:"100%", background:"#25D366", color:"#fff", marginTop:10}}>📲 WP BİLDİR</button>
            )}
          </div>
        ))}
        {sekme === "hayvanlar" && (
          <div>
            <div className="kart" style={{borderStyle:"dashed", marginBottom:20}}>
              <input placeholder="Hayvan No" onChange={e=>setYeni({...yeni, numara:e.target.value})} />
              <input placeholder="Toplam Fiyat" onChange={e=>setYeni({...yeni, fiyat:e.target.value})} />
              <button onClick={()=>onEkle(yeni)} style={{width:"100%", background:"#d4a017", color:"#000"}}>➕ HAYVAN EKLE</button>
            </div>
            {hayvanlar.map(h => (
              <div key={h.id} className="kart" style={{marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <span>#{h.numara} - {getBos(h)} Boş</span>
                <button onClick={()=>onSil(h.id)} style={{background:"transparent", color:"#f87171", fontSize:24}}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onCikis} style={{width:"100%", background:"#222", color:"#fff", position:"fixed", bottom:0}}>ÇIKIŞ</button>
    </div>
  );
}

function LoginPanel({ sifre, setSifre, onGiris, onGeri }) {
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", padding:20}}>
      <div className="kart" style={{width:"100%", maxWidth:400, textAlign:"center"}}>
        <div style={{fontSize:50, marginBottom:10}}>🔐</div>
        <h2>Yönetici Girişi</h2>
        <input type="password" style={{textAlign:"center", fontSize:20}} onChange={e=>setSifre(e.target.value)} placeholder="Şifre" />
        <button onClick={onGiris} style={{width:"100%", background:"#d4a017", color:"#000"}}>SİSTEME GİRİŞ</button>
        <button onClick={onGeri} style={{marginTop:15, background:"transparent", color:"#666", width:"100%"}}>Geri Dön</button>
      </div>
    </div>
  );
}
