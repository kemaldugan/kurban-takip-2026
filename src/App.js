import React, { useState, useEffect, useRef, useCallback } from "react";

const ADMIN_PASSWORD = "kurban2026";
const formatTL = (n) => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }).format(n);
const uid   = () => Math.random().toString(36).substr(2, 9);
const zaman = () => new Date().toLocaleString("tr-TR");

function getBos(h) { return h.maxHisse - h.hisseler.filter(x => x.durum === "onaylı").length; }
function totalDolu(list) { return list.reduce((a,h) => a + h.hisseler.filter(x => x.durum === "onaylı").length, 0); }

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

/* ── Global CSS (Mobil Odaklı) ── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; background:#080503; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
  
  /* Mobil Grid Düzeltmesi */
  .hayvan-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 16px; 
    padding: 10px;
  }
  @media(max-width:480px){ 
    .hayvan-grid { grid-template-columns: 1fr; } 
    .stat-grid { grid-template-columns: 1fr !important; }
  }

  /* Admin Butonları */
  .admin-action-btn {
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    flex: 1;
    border: 1px solid rgba(212,160,23,0.3);
  }

  @keyframes kayDir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kayan { display:inline-block; white-space:nowrap; animation:kayDir 40s linear infinite; color:#d4a017; font-family:${FONT}; font-size:14px; letter-spacing:1px; }
`;

const S = {
  page:  { minHeight:"100vh", background:"#080503", fontFamily:FONT, color:"#e8d5a3", paddingBottom: "40px" },
  card:  { background:"linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.02))", border:"1px solid rgba(212,160,23,.3)", borderRadius:16 },
  inp:   { width:"100%", padding:"12px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(212,160,23,.3)", borderRadius:8, color:"#e8d5a3", fontSize:16 },
  btn:   (c="#d4a017") => ({ padding:"10px 16px", border:`1px solid ${c}`, borderRadius:8, background:"transparent", color:c, cursor:"pointer", fontSize:14 }),
  solid: (bg="#8b1a1a",c="#f5e6c0") => ({ padding:"12px 20px", border:"none", borderRadius:10, background:bg, color:c, cursor:"pointer", fontWeight:600, fontSize:15 })
};

export default function App() {
  const [hayvanlar, setHayvanlar] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [view, setView] = useState("public");
  const [admin, setAdmin] = useState(false);
  const [sifre, setSifre] = useState("");
  const [sbYuklendi, setSbYuklendi] = useState(false);
  const [sbHata, setSbHata] = useState(false);
  const yazmaTimer = useRef({});

  const verileriCek = async () => {
    try {
      const [h, t] = await Promise.all([sbOku("hayvanlar"), sbOku("talepler")]);
      if (h) setHayvanlar(h);
      if (t) setTalepler(t);
      setSbHata(false);
    } catch { setSbHata(true); }
    finally { setSbYuklendi(true); }
  };

  useEffect(() => { verileriCek(); }, []);

  const sbKaydet = useCallback((key, value) => {
    clearTimeout(yazmaTimer.current[key]);
    yazmaTimer.current[key] = setTimeout(async () => {
      try {
        await sbYaz(key, value);
        localStorage.setItem(`kurban_${key}`, JSON.stringify(value));
      } catch { setSbHata(true); }
    }, 500); // Debounce süresini kısalttık
  }, []);

  useEffect(() => { if (sbYuklendi) sbKaydet("hayvanlar", hayvanlar); }, [hayvanlar, sbYuklendi]);
  useEffect(() => { if (sbYuklendi) sbKaydet("talepler", talepler); }, [talepler, sbYuklendi]);

  const onayla = (tid) => {
    const t = talepler.find(x => x.id === tid);
    if (!t) return;
    const h = hayvanlar.find(x => x.id === t.hayvanId);
    if (!h || getBos(h) <= 0) { alert("Yer kalmadı!"); return; }
    
    const yeniHisse = { id:uid(), hayvanId:t.hayvanId, ad:t.ad, telefon:t.telefon, tutar:t.tutar, durum:"onaylı", tarih:zaman() };
    setHayvanlar(prev => prev.map(x => x.id === t.hayvanId ? {...x, hisseler:[...x.hisseler, yeniHisse]} : x));
    setTalepler(prev => prev.map(x => x.id === tid ? {...x, durum:"onaylı"} : x));
  };

  const silHayvan = (id) => {
    if(window.confirm("Bu hayvanı ve tüm hisselerini silmek istediğinize emin misiniz?")) {
      setHayvanlar(prev => prev.filter(x => x.id !== id));
    }
  };

  const talepGonder = (t) => {
    const h = hayvanlar.find(x => x.id === t.hayvanId);
    if (!h || getBos(h) <= 0) return false;
    setTalepler(prev => [...prev, { ...t, id:uid(), tarih:zaman(), durum:"bekliyor" }]);
    return true;
  };

  if (!sbYuklendi) return <div style={{background:"#080503", color:"#d4a017", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center"}}>Bağlanıyor...</div>;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {view === "admin" && admin ? (
        <AdminPanel 
          hayvanlar={hayvanlar} talepler={talepler} 
          onOnayla={onayla} onSilH={silHayvan} 
          onEkleH={(h) => setHayvanlar(p => [...p, {...h, id:uid(), hisseler:[], durum:"aktif"}])}
          onYenile={verileriCek}
          onCikis={() => {setAdmin(false); setView("public");}}
        />
      ) : view === "login" ? (
        <LoginPanel sifre={sifre} setSifre={setSifre} onGiris={() => {if(sifre===ADMIN_PASSWORD){setAdmin(true); setView("admin");}else{alert("Hatalı!");}}} onGeri={()=>setView("public")} />
      ) : (
        <PublicPanel hayvanlar={hayvanlar} talepler={talepler} onTalep={talepGonder} onAdmin={()=>setView("login")} />
      )}
    </>
  );
}

/* ── YÖNETİCİ PANELİ (Geliştirilmiş) ── */
function AdminPanel({ hayvanlar, talepler, onOnayla, onSilH, onEkleH, onYenile, onCikis }) {
  const [sekme, setSekme] = useState("talepler");
  const [yeniH, setYeniH] = useState({ tip:"buyukbas", numara:"", kesimSirasi:"", fiyat:"", maxHisse:"7" });

  return (
    <div style={S.page}>
      <div style={{ background:"#1a0800", padding:"15px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #d4a017" }}>
        <h2 style={{ fontSize:18, margin:0 }}>Yönetici</h2>
        <div style={{display:"flex", gap:10}}>
          <button onClick={onYenile} style={S.btn("#4ade80")}>🔄 Yenile</button>
          <button onClick={onCikis} style={S.btn("#f87171")}>Çıkış</button>
        </div>
      </div>

      <div style={{ display:"flex", overflowX:"auto", background:"#111", borderBottom:"1px solid #333" }}>
        <button onClick={()=>setSekme("talepler")} style={{...S.btn(), border:"none", padding:"15px", flex:1, color:sekme==="talepler"?"#d4a017":"#666"}}>📋 Talepler</button>
        <button onClick={()=>setSekme("hayvanlar")} style={{...S.btn(), border:"none", padding:"15px", flex:1, color:sekme==="hayvanlar"?"#d4a017":"#666"}}>🐄 Hayvanlar</button>
        <button onClick={()=>setSekme("ekle")} style={{...S.btn(), border:"none", padding:"15px", flex:1, color:sekme==="ekle"?"#d4a017":"#666"}}>➕ Ekle</button>
      </div>

      <div style={{ padding:15 }}>
        {sekme === "talepler" && (
          <div>
            {talepler.filter(t=>t.durum==="bekliyor").map(t => (
              <div key={t.id} style={{ ...S.card, padding:15, marginBottom:10 }}>
                <div style={{fontWeight:700, marginBottom:5}}>{t.ad}</div>
                <div style={{fontSize:12, color:"#806040"}}>{t.telefon}</div>
                <div style={{fontSize:14, margin:"10px 0"}}>{formatTL(t.tutar)} Talep</div>
                <button onClick={()=>onOnayla(t.id)} style={{...S.solid("#14532d","#4ade80"), width:"100%"}}>✓ Onayla</button>
              </div>
            ))}
          </div>
        )}

        {sekme === "hayvanlar" && (
          <div>
            {hayvanlar.map(h => (
              <div key={h.id} style={{ ...S.card, padding:15, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{fontWeight:700}}>#{h.numara} - {h.tip === "buyukbas" ? "Dana" : "Küçükbaş"}</div>
                  <div style={{fontSize:12}}>{getBos(h)} Boş / {h.maxHisse} Hisse</div>
                </div>
                <button onClick={()=>onSilH(h.id)} style={{...S.btn("#f87171"), padding:"5px 10px"}}>🗑️ Sil</button>
              </div>
            ))}
          </div>
        )}

        {sekme === "ekle" && (
          <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
            <input placeholder="Hayvan No" value={yeniH.numara} onChange={e=>setYeniH({...yeniH, numara:e.target.value})} style={S.inp} />
            <input placeholder="Kesim Sırası" value={yeniH.kesimSirasi} onChange={e=>setYeniH({...yeniH, kesimSirasi:e.target.value})} style={S.inp} />
            <input placeholder="Toplam Fiyat" value={yeniH.fiyat} onChange={e=>setYeniH({...yeniH, fiyat:e.target.value})} style={S.inp} />
            <button onClick={()=>{onEkleH(yeniH); alert("Eklendi");}} style={S.solid()}>Hayvanı Kaydet</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── HALKA AÇIK PANEL (Mobil Uyumlu) ── */
function PublicPanel({ hayvanlar, talepler, onTalep, onAdmin }) {
  const [detay, setDetay] = useState(null);
  const [form, setForm] = useState({ ad:"", telefon:"" });

  return (
    <div style={S.page}>
      <div style={{ textAlign:"center", padding:"30px 15px", background:"linear-gradient(180deg,#4a0a00,#080503)" }}>
        <h1 style={{ margin:0, fontSize:24 }}>KURBAN 2026</h1>
        <div style={{ fontSize:12, color:"#d4a017", marginTop:5 }}>MURAT YALVAÇ ÖĞRENCİ YURDU</div>
        <button onClick={onAdmin} style={{ ...S.btn(), marginTop:15, fontSize:12 }}>⚙ Yönetici Girişi</button>
      </div>

      <div className="hayvan-grid">
        {hayvanlar.map(h => (
          <div key={h.id} style={{ ...S.card, padding:20, textAlign:"center" }} onClick={()=>setDetay(h)}>
            <div style={{fontSize:40}}>{h.tip==="buyukbas"?"🐄":"🐑"}</div>
            <h3 style={{margin:"10px 0"}}>#{h.numara} Nolu Hayvan</h3>
            <div style={{color:"#d4a017", fontSize:20, fontWeight:700}}>{formatTL(h.fiyat / h.maxHisse)} / Hisse</div>
            <div style={{marginTop:10, fontSize:14, color:getBos(h)>0?"#4ade80":"#f87171"}}>
              {getBos(h) > 0 ? `${getBos(h)} Hisse Boş` : "TAMAMI DOLDU"}
            </div>
            <button style={{...S.solid(), width:"100%", marginTop:15}}>Detay ve Talep</button>
          </div>
        ))}
      </div>

      {detay && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:100, padding:20, overflowY:"auto" }}>
           <div style={{...S.card, padding:20, maxWidth:500, margin:"auto"}}>
              <h2>#{detay.numara} Detayları</h2>
              <p>Hisse Bedeli: {formatTL(detay.fiyat / detay.maxHisse)}</p>
              <hr style={{opacity:0.1}}/>
              <h3>Hisse Talep Formu</h3>
              <input placeholder="Ad Soyad" style={{...S.inp, marginBottom:10}} value={form.ad} onChange={e=>setForm({...form, ad:e.target.value})} />
              <input placeholder="Telefon" style={{...S.inp, marginBottom:10}} value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})} />
              <button onClick={()=>{
                if(onTalep({hayvanId:detay.id, ...form, tutar: detay.fiyat/detay.maxHisse})) {
                  alert("Talebiniz alındı! Yönetici onayı bekleniyor.");
                  setDetay(null);
                }
              }} style={{...S.solid(), width:"100%"}}>Talebi Gönder</button>
              <button onClick={()=>setDetay(null)} style={{...S.btn(), width:"100%", marginTop:10, border:"none"}}>Kapat</button>
           </div>
        </div>
      )}
    </div>
  );
}

function LoginPanel({ sifre, setSifre, onGiris, onGeri }) {
  return (
    <div style={{...S.page, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
      <div style={{...S.card, padding:30, width:"100%", maxWidth:350, textAlign:"center"}}>
        <h3>Yönetici Girişi</h3>
        <input type="password" value={sifre} onChange={e=>setSifre(e.target.value)} style={S.inp} placeholder="Şifre" />
        <button onClick={onGiris} style={{...S.solid(), width:"100%", marginTop:15}}>Giriş Yap</button>
        <button onClick={onGeri} style={{...S.btn(), border:"none", marginTop:10}}>Geri Dön</button>
      </div>
    </div>
  );
}
