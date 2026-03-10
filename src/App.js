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

/* Supabase yardımcı fonksiyonları */
async function sbOku(key) {
  const r = await fetch(`${SB_URL}/rest/v1/kurban_data?key=eq.${key}&select=value`, { headers:SB_HDR });
  const d = await r.json();
  return d.length > 0 ? JSON.parse(d[0].value) : null;
}
async function sbYaz(key, value) {
  // upsert — varsa güncelle, yoksa ekle
  await fetch(`${SB_URL}/rest/v1/kurban_data`, {
    method:"POST",
    headers:{ ...SB_HDR, "Prefer":"resolution=merge-duplicates" },
    body: JSON.stringify({ key, value: JSON.stringify(value) })
  });
}

/* ── Google Fonts ── */
const _fl = document.createElement("link");
_fl.rel = "stylesheet";
_fl.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap";
document.head.appendChild(_fl);

const FONT = "'Amiri','Scheherazade New',Georgia,serif";

/* ── Kayan yazılar ── */
const KAYANYAZILAR = [
  "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  "Kurban, Allah'a yakınlaşmanın en güzel vesilesidir",
  "اَللّٰهُمَّ تَقَبَّلْ مِنَّا",
  "Her kurban bir niyazdır, her niyet bir ibadettir",
  "وَلِكُلِّ أُمَّةٍ جَعَلْنَا مَنسَكًا",
  "Murat Yalvaç Öğrenci Yurdu • Kurban Organizasyonu 2026",
  "اَللّٰهُ أَكْبَرُ اَللّٰهُ أَكْبَرُ لَا إِلَهَ إِلَّا اللّٰهُ",
  "Kurbanınız kabul olsun — Hayırlı Bayramlar",
];

/* ── Global CSS ── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; background:#080503; -webkit-tap-highlight-color: transparent; }
  input, select, textarea, button { font-family: ${FONT}; }

  /* Kayan bant */
  @keyframes kayDir { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .kayan { display:inline-block; white-space:nowrap; animation:kayDir 40s linear infinite; color:#d4a017; font-family:${FONT}; font-size:14px; letter-spacing:1px; }
  @media(max-width:480px){ .kayan{font-size:12px;} }

  /* Kart hover sadece masaüstünde */
  @media(hover:hover){ .hayvan-kart:hover { transform:translateY(-4px); box-shadow:0 12px 36px rgba(212,160,23,.22); } }

  /* Mobil grid: 1 sütun */
  .hayvan-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
  @media(max-width:600px){ .hayvan-grid { grid-template-columns:1fr; gap:12px; } }

  /* İstatistik grid */
  .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
  @media(max-width:400px){ .stat-grid { gap:8px; } }

  /* Admin sekme butonları */
  .sekme-bar { display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; border-bottom:1px solid rgba(212,160,23,.2); padding:0 16px; scrollbar-width:none; }
  .sekme-bar::-webkit-scrollbar { display:none; }
  .sekme-btn { flex-shrink:0; padding:12px 16px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; font-family:${FONT}; font-size:14px; white-space:nowrap; }

  /* Modal scroll */
  .modal-icerik { background:linear-gradient(160deg,#150a02,#0e0601); border:1px solid #d4a017; border-radius:20px; width:100%; max-width:490px; max-height:92vh; overflow-y:auto; box-shadow:0 0 60px rgba(212,160,23,.15); }
  @media(max-width:520px){ .modal-icerik { border-radius:16px; max-height:96vh; } }

  /* Talep modal */
  .talep-modal { background:linear-gradient(160deg,#1a1208,#100c04); border:1px solid #d4a017; border-radius:16px; padding:24px; width:100%; max-width:400px; }
  @media(max-width:440px){ .talep-modal { padding:18px; border-radius:12px; } }

  /* Hissedar form flex */
  .hform-row { display:flex; gap:8px; flex-wrap:wrap; }
  .hform-row > div { flex:1; min-width:130px; }

  /* Detay grid 2x2 */
  .detay-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0; }
  @media(max-width:340px){ .detay-grid { grid-template-columns:1fr; } }

  /* Yönetici butonu mobilde küçük */
  .admin-btn { position:absolute; top:12px; right:12px; }
  @media(max-width:360px){ .admin-btn { top:8px; right:8px; font-size:11px; padding:5px 10px !important; } }

  /* Scroll davranışı */
  html { scroll-behavior: smooth; }
`;

/* ── Ortak stil nesneleri ── */
const S = {
  page:  { minHeight:"100vh", background:"#080503", fontFamily:FONT, color:"#e8d5a3" },
  card:  { background:"linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))", border:"1px solid rgba(212,160,23,.3)", borderRadius:16 },
  btn:   (c="#d4a017") => ({ padding:"8px 16px", border:`1px solid ${c}`, borderRadius:8, background:"transparent", color:c, cursor:"pointer", fontFamily:FONT, fontSize:13, touchAction:"manipulation" }),
  solid: (bg="#8b1a1a",c="#f5e6c0") => ({ padding:"11px 20px", border:"none", borderRadius:8, background:bg, color:c, cursor:"pointer", fontFamily:FONT, fontWeight:600, fontSize:14, touchAction:"manipulation" }),
  lbl:   { fontSize:12, color:"#a08060", display:"block", marginBottom:5 },
  inp:   { width:"100%", padding:"11px 12px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(212,160,23,.28)", borderRadius:8, color:"#e8d5a3", fontFamily:FONT, fontSize:16, boxSizing:"border-box" },
  sel:   { width:"100%", padding:"11px 12px", background:"#120d04", border:"1px solid rgba(212,160,23,.28)", borderRadius:8, color:"#e8d5a3", fontFamily:FONT, fontSize:16 },
};
// fontSize:16 inputlarda — iOS'ta zoom engeller

/* ════════════════════════════════════════════
   KAYAN YAZI
════════════════════════════════════════════ */
function KayanBant() {
  const metin = KAYANYAZILAR.join("   ✦   ");
  return (
    <div style={{ background:"linear-gradient(90deg,#2a0a00,#1a0800,#2a0a00)", borderTop:"1px solid rgba(212,160,23,.2)", borderBottom:"1px solid rgba(212,160,23,.2)", padding:"9px 0", overflow:"hidden" }}>
      <div className="kayan">{metin}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;{metin}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ANA UYGULAMA
════════════════════════════════════════════ */
export default function App() {
  const [hayvanlar,   setHayvanlar]   = useState([]);
  const [talepler,    setTalepler]    = useState([]);
  const [view,        setView]        = useState("public");
  const [admin,       setAdmin]       = useState(false);
  const [sifre,       setSifre]       = useState("");
  const [sifreErr,    setSifreErr]    = useState(false);
  const [sbYuklendi,  setSbYuklendi]  = useState(false);  // ilk yükleme tamamlandı mı
  const [sbHata,      setSbHata]      = useState(false);  // bağlantı hatası var mı
  const yazmaTimer = useRef({});                           // debounce timer

  const hayvanlarRef = useRef(hayvanlar);
  const taleplerRef  = useRef(talepler);
  useEffect(() => { hayvanlarRef.current = hayvanlar; }, [hayvanlar]);
  useEffect(() => { taleplerRef.current  = talepler;  }, [talepler]);

  /* ── İlk yükleme: Supabase'den oku ── */
  useEffect(() => {
    (async () => {
      try {
        const [h, t] = await Promise.all([sbOku("hayvanlar"), sbOku("talepler")]);
        // Supabase'den dolu veri geldiyse onu kullan
        if (h && h.length > 0) {
          setHayvanlar(h);
        } else {
          // Supabase boşsa localStorage'a bak (PC'den taşı)
          try {
            const lh = JSON.parse(localStorage.getItem("kurban_hayvanlar")||"[]");
            if (lh.length > 0) {
              setHayvanlar(lh);
              await sbYaz("hayvanlar", lh); // localStorage'daki veriyi Supabase'e yükle
            }
          } catch{}
        }
        if (t && t.length > 0) {
          setTalepler(t);
        } else {
          try {
            const lt = JSON.parse(localStorage.getItem("kurban_talepler")||"[]");
            if (lt.length > 0) {
              setTalepler(lt);
              await sbYaz("talepler", lt);
            }
          } catch{}
        }
        setSbHata(false);
      } catch {
        setSbHata(true);
        try { const h = JSON.parse(localStorage.getItem("kurban_hayvanlar")||"[]"); if(h.length) setHayvanlar(h); } catch{}
        try { const t = JSON.parse(localStorage.getItem("kurban_talepler") ||"[]"); if(t.length) setTalepler(t);  } catch{}
      } finally {
        setSbYuklendi(true);
      }
    })();
  }, []);

  /* ── Değişince Supabase'e yaz (debounce 800ms) ── */
  const sbKaydet = useCallback((key, value) => {
    clearTimeout(yazmaTimer.current[key]);
    yazmaTimer.current[key] = setTimeout(async () => {
      try {
        await sbYaz(key, value);
        // localStorage'a da yaz (offline yedek)
        localStorage.setItem(`kurban_${key}`, JSON.stringify(value));
        setSbHata(false);
      } catch { setSbHata(true); }
    }, 800);
  }, []);

  useEffect(() => { if (sbYuklendi) sbKaydet("hayvanlar", hayvanlar); }, [hayvanlar, sbYuklendi]);
  useEffect(() => { if (sbYuklendi) sbKaydet("talepler",  talepler);  }, [talepler,  sbYuklendi]);

  const giris = () => {
    if (sifre === ADMIN_PASSWORD) { setAdmin(true); setView("admin"); setSifreErr(false); setSifre(""); }
    else setSifreErr(true);
  };

  const onayla = (tid) => {
    const t = taleplerRef.current.find(x => x.id === tid); if (!t) return;
    const h = hayvanlarRef.current.find(x => x.id === t.hayvanId);
    const bos = h ? h.maxHisse - h.hisseler.filter(x=>x.durum==="onaylı").length : 0;
    if (!h || bos <= 0) { alert("Boş yer kalmadı!"); return; }
    const yh = { id:uid(), hayvanId:t.hayvanId, ad:t.ad, telefon:t.telefon, tutar:t.tutar, durum:"onaylı", tarih:zaman() };
    setHayvanlar(p => p.map(x => x.id===t.hayvanId ? {...x, hisseler:[...x.hisseler,yh]} : x));
    setTalepler(p  => p.map(x => x.id===tid ? {...x,durum:"onaylı"} : x));
  };
  const reddet   = (tid)     => setTalepler(p => p.map(x => x.id===tid ? {...x,durum:"reddedildi"} : x));
  const ekleH    = (h)       => setHayvanlar(p => [...p, {...h,id:uid(),hisseler:[],durum:"aktif"}]);
  const guncH    = (id,d)    => setHayvanlar(p => p.map(x => x.id===id ? {...x,...d} : x));
  const silHisse = (hid,xid) => setHayvanlar(p => p.map(h => h.id===hid ? {...h,hisseler:h.hisseler.filter(x=>x.id!==xid)} : h));
  const durumH   = (id,d)    => setHayvanlar(p => p.map(x => x.id===id ? {...x,durum:d} : x));

  const hisseDirekt = (hayvanId, ad, telefon) => {
    const h = hayvanlarRef.current.find(x=>x.id===hayvanId);
    if (!h) return false;
    const bos = h.maxHisse - h.hisseler.filter(x=>x.durum==="onaylı").length;
    if (bos <= 0) { alert("Bu hayvanda boş yer kalmadı!"); return false; }
    const tutar = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
    setHayvanlar(p => p.map(x => x.id===hayvanId ? {...x, hisseler:[...x.hisseler,{id:uid(),hayvanId,ad,telefon,tutar,durum:"onaylı",tarih:zaman()}]} : x));
    return true;
  };

  const talepGonder = (t) => {
    const h   = hayvanlarRef.current.find(x=>x.id===t.hayvanId);
    const bek = taleplerRef.current.filter(x=>x.hayvanId===t.hayvanId&&x.durum==="bekliyor").length;
    if (!h) return false;
    const bos = h.maxHisse - h.hisseler.filter(x=>x.durum==="onaylı").length;
    if (bos <= 0 || bos - bek <= 0) return false;
    setTalepler(p => [...p, {...t, id:uid(), tarih:zaman(), durum:"bekliyor"}]);
    return true;
  };

  /* ── İlk yükleme ekranı ── */
  if (!sbYuklendi) return (
    <div style={{ minHeight:"100vh", background:"#080503", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🕌</div>
      <div style={{ fontSize:16, color:"#d4a017", marginBottom:8 }}>Veriler yükleniyor...</div>
      <div style={{ fontSize:12, color:"#604030" }}>Supabase bağlantısı kuruluyor</div>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* Bağlantı durum çubuğu */}
      {sbHata && (
        <div style={{ background:"#7f1d1d", color:"#fca5a5", fontSize:12, textAlign:"center", padding:"6px", fontFamily:FONT }}>
          ⚠️ Supabase bağlantısı yok — veriler yalnızca bu cihazda saklanıyor. İnternet bağlantınızı kontrol edin.
        </div>
      )}
      {view==="login" && <LoginPanel sifre={sifre} setSifre={setSifre} err={sifreErr} onGiris={giris} onGeri={()=>setView("public")} />}
      {view==="admin" && admin && <AdminPanel hayvanlar={hayvanlar} talepler={talepler} onOnayla={onayla} onReddet={reddet} onEkleH={ekleH} onGuncH={guncH} onSilHisse={silHisse} onDurum={durumH} onHisseDirekt={hisseDirekt} onCikis={()=>{setAdmin(false);setView("public");}} sbHata={sbHata} />}
      {(view==="public" || (view==="admin" && !admin)) && <PublicPanel hayvanlar={hayvanlar} talepler={talepler} onTalep={talepGonder} onAdmin={()=>setView("login")} />}
    </>
  );
}

/* ════════════════════════════════════════════
   PUBLIC PANEL
════════════════════════════════════════════ */
function PublicPanel({ hayvanlar, talepler, onTalep, onAdmin }) {
  const [detay,      setDetay]      = useState(null);
  const [talepModal, setTalepModal] = useState(null);
  const [form,       setForm]       = useState({ ad:"", telefon:"" });
  const [mesaj,      setMesaj]      = useState(null);
  const [filtre,     setFiltre]     = useState("hepsi");

  const aktif = hayvanlar
    .filter(h => h.durum==="aktif" && getBos(h)>0 && (filtre==="hepsi" || h.tip===filtre))
    .sort((a,b) => a.kesimSirasi - b.kesimSirasi);

  const toast = (tip, metin) => { setMesaj({tip,metin}); setTimeout(()=>setMesaj(null), 5000); };

  const gonder = () => {
    if (!form.ad.trim() || !form.telefon.trim()) { toast("hata","Ad ve telefon zorunludur."); return; }
    const h = hayvanlar.find(x=>x.id===talepModal.id);
    const tutar = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
    if (onTalep({hayvanId:h.id, ad:form.ad, telefon:form.telefon, tutar})) {
      toast("ok",`Talebiniz alındı! Tutar: ${formatTL(tutar)}. Yönetici onayı bekleniyor.`);
      setForm({ad:"",telefon:""}); setTalepModal(null); setDetay(null);
    } else {
      toast("hata","Yer kalmadı veya talep gönderilemedi.");
    }
  };

  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(180deg,rgba(100,20,20,.97),rgba(55,8,8,.99))", borderBottom:"3px solid #d4a017", position:"relative", padding:"24px 16px 20px", textAlign:"center" }}>
        <div style={{ position:"absolute", top:10, left:14, fontSize:20, color:"rgba(212,160,23,.35)" }}>☽</div>
        <div style={{ position:"absolute", top:10, right:56, fontSize:20, color:"rgba(212,160,23,.35)" }}>☽</div>
        <div style={{ fontSize:38, marginBottom:2, filter:"drop-shadow(0 2px 8px rgba(212,160,23,.4))" }}>🕌</div>
        <h1 style={{ margin:"0 0 3px", fontSize:"clamp(18px,5vw,28px)", fontWeight:700, color:"#f5e6c0", letterSpacing:2, textShadow:"0 2px 10px rgba(0,0,0,.7)", fontFamily:FONT }}>KURBAN ORGANİZASYONU</h1>
        <div style={{ fontSize:"clamp(10px,3vw,13px)", color:"#d4a017", letterSpacing:3, marginBottom:5 }}>MURAT YALVAÇ ÖĞRENCİ YURDU • 2026</div>
        <div style={{ fontSize:"clamp(14px,4vw,18px)", color:"rgba(212,160,23,.6)", fontFamily:"'Scheherazade New',serif" }}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
        <button className="admin-btn" onClick={onAdmin} style={{ ...S.btn(), fontSize:12, padding:"6px 12px" }}>⚙ Yönetici</button>
      </div>

      {/* KAYAN YAZI */}
      <KayanBant />

      <div style={{ maxWidth:900, margin:"0 auto", padding:"18px 12px" }}>

        {/* İSTATİSTİK */}
        <div className="stat-grid">
          {[
            { lbl:"Toplam Hayvan", val:hayvanlar.filter(h=>h.durum==="aktif").length, ic:"🐄" },
            { lbl:"Dolu Hisse",    val:totalDolu(hayvanlar), ic:"✅" },
            { lbl:"Boş Hisse",     val:hayvanlar.reduce((a,h)=>a+(h.durum==="aktif"?getBos(h):0),0), ic:"🔓" },
          ].map(s => (
            <div key={s.lbl} style={{ ...S.card, padding:"12px 6px", textAlign:"center" }}>
              <div style={{ fontSize:20 }}>{s.ic}</div>
              <div style={{ fontSize:"clamp(20px,5vw,26px)", fontWeight:700, color:"#d4a017" }}>{s.val}</div>
              <div style={{ fontSize:"clamp(9px,2.5vw,11px)", color:"#a08060", marginTop:2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* FİLTRE */}
        <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
          {[["hepsi","Tümü"],["buyukbas","🐄 Büyükbaş"],["kucukbas","🐑 Küçükbaş"]].map(([k,l]) => (
            <button key={k} onClick={()=>setFiltre(k)} style={{ padding:"7px 16px", borderRadius:20, border:filtre===k?"2px solid #d4a017":"1px solid rgba(212,160,23,.3)", background:filtre===k?"rgba(212,160,23,.15)":"transparent", color:filtre===k?"#d4a017":"#a08060", cursor:"pointer", fontSize:13, fontFamily:FONT, touchAction:"manipulation" }}>{l}</button>
          ))}
        </div>

        {/* KARTLAR */}
        {aktif.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"#604030" }}>
            <div style={{ fontSize:48 }}>🕌</div>
            <p style={{ fontSize:16, color:"#806040", margin:"12px 0 6px" }}>Henüz hayvan eklenmemiş.</p>
            <p style={{ fontSize:13 }}>Yönetici hayvanları girdikten sonra burada görünecek.</p>
          </div>
        ) : (
          <div className="hayvan-grid">
            {aktif.map(h => {
              const bos  = getBos(h);
              const dolu = h.maxHisse - bos;
              const bek  = talepler.filter(t=>t.hayvanId===h.id&&t.durum==="bekliyor").length;
              const hT   = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
              return (
                <div key={h.id} className="hayvan-kart" onClick={()=>setDetay(h)}
                  style={{ ...S.card, cursor:"pointer", overflow:"hidden", transition:"transform .15s,box-shadow .15s", WebkitTapHighlightColor:"transparent" }}>
                  {h.foto
                    ? <div style={{ height:160, overflow:"hidden", background:"#0a0602" }}><img src={h.foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/></div>
                    : <div style={{ height:90, background:"rgba(255,255,255,.025)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>{h.tip==="buyukbas"?"🐄":h.kategori==="koyun"?"🐑":"🐐"}</div>
                  }
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ display:"inline-block", background:h.tip==="buyukbas"?"#8b1a1a":"#1a4a1a", padding:"2px 10px", borderRadius:20, fontSize:10, color:"#e8d5a3", marginBottom:7 }}>
                      {h.tip==="buyukbas"?"🐄 BÜYÜKBAŞ":`🐑 ${(h.kategori||"").toUpperCase()}`}
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:20, fontWeight:700, color:"#d4a017" }}>#{h.numara}</span>
                      <span style={{ fontSize:12, color:"#806040" }}>Kesim: {h.kesimSirasi}. sıra</span>
                    </div>
                    <div style={{ fontSize:19, fontWeight:700, color:"#f5e6c0" }}>{formatTL(hT)}<span style={{ fontSize:11, fontWeight:400, color:"#806040" }}> / hisse</span></div>
                    {h.tip==="buyukbas" && <div style={{ fontSize:11, color:"#604030" }}>Toplam: {formatTL(h.fiyat)}</div>}
                    <div style={{ marginTop:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#806040", marginBottom:3 }}>
                        <span>{dolu}/{h.maxHisse} dolu</span>
                        <span style={{ color:"#4ade80", fontWeight:600 }}>{bos} boş yer</span>
                      </div>
                      <div style={{ display:"flex", gap:3 }}>
                        {Array.from({length:h.maxHisse}).map((_,i) => (
                          <div key={i} style={{ flex:1, height:7, borderRadius:4, background:i<dolu?"#8b1a1a":i<dolu+bek?"#d4a017":"rgba(255,255,255,.1)" }}/>
                        ))}
                      </div>
                      {bek > 0 && <div style={{ fontSize:10, color:"#d4a017", marginTop:3 }}>⏳ {bek} bekleyen talep</div>}
                    </div>
                    <div style={{ marginTop:10, textAlign:"center", fontSize:12, color:"#806040" }}>👆 Detay için tıklayın</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ALT AYET */}
        <div style={{ textAlign:"center", margin:"36px 0 8px", padding:"18px 12px", borderTop:"1px solid rgba(212,160,23,.12)" }}>
          <div style={{ fontSize:"clamp(15px,4vw,21px)", color:"rgba(212,160,23,.5)", fontFamily:"'Scheherazade New',serif", marginBottom:7, lineHeight:1.8 }}>
            لَن يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِن يَنَالُهُ التَّقْوَىٰ مِنكُمْ
          </div>
          <div style={{ fontSize:"clamp(10px,2.8vw,12px)", color:"#604030", fontStyle:"italic" }}>
            "Allah'a ne etleri ulaşır ne de kanları; fakat O'na sizden takva ulaşır." — Hac Suresi, 37
          </div>
        </div>
      </div>

      {/* TOAST */}
      {mesaj && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:mesaj.tip==="ok"?"#14532d":"#7f1d1d", border:`1px solid ${mesaj.tip==="ok"?"#4ade80":"#f87171"}`, color:"#fff", padding:"12px 20px", borderRadius:10, maxWidth:"90vw", textAlign:"center", zIndex:300, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,.6)" }}>
          {mesaj.tip==="ok"?"✅ ":"❌ "}{mesaj.metin}
        </div>
      )}

      {/* DETAY MODAL */}
      {detay && (() => {
        const h   = hayvanlar.find(x=>x.id===detay.id) || detay;
        const bos = getBos(h);
        const dolu = h.maxHisse - bos;
        const bek  = talepler.filter(t=>t.hayvanId===h.id&&t.durum==="bekliyor").length;
        const hT   = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
        const efBos = bos - bek;
        return (
          <div onClick={()=>setDetay(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:12 }}>
            <div className="modal-icerik" onClick={e=>e.stopPropagation()}>
              {h.foto
                ? <div style={{ height:200, overflow:"hidden", borderRadius:"20px 20px 0 0" }}><img src={h.foto} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/></div>
                : <div style={{ height:90, background:"rgba(255,255,255,.025)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, borderRadius:"20px 20px 0 0" }}>{h.tip==="buyukbas"?"🐄":h.kategori==="koyun"?"🐑":"🐐"}</div>
              }
              <div style={{ padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ display:"inline-block", background:h.tip==="buyukbas"?"#8b1a1a":"#1a4a1a", padding:"2px 10px", borderRadius:20, fontSize:10, color:"#e8d5a3", marginBottom:6 }}>
                      {h.tip==="buyukbas"?"🐄 BÜYÜKBAŞ":`🐑 ${(h.kategori||"").toUpperCase()}`}
                    </div>
                    <h2 style={{ margin:"0 0 2px", color:"#d4a017", fontSize:22, fontFamily:FONT }}>#{h.numara} Nolu Hayvan</h2>
                    <p style={{ margin:0, color:"#806040", fontSize:13 }}>Kesim Sırası: {h.kesimSirasi}. hayvan</p>
                  </div>
                  <button onClick={()=>setDetay(null)} style={{ background:"none", border:"none", color:"#806040", fontSize:22, cursor:"pointer", padding:"4px 8px" }}>✕</button>
                </div>
                <div className="detay-grid">
                  {[
                    { lbl:"HİSSE BEDELİ", val:formatTL(hT),             renk:"#d4a017", bg:"rgba(212,160,23,.1)",       br:"rgba(212,160,23,.3)" },
                    { lbl:"BOŞ YER",       val:efBos>0?efBos:"DOLU",     renk:efBos>0?"#4ade80":"#f87171", bg:efBos>0?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)", br:efBos>0?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)" },
                    { lbl:"KESİM SIRASI",  val:`${h.kesimSirasi}.`,      renk:"#e8d5a3", bg:"rgba(255,255,255,.04)",      br:"rgba(255,255,255,.08)" },
                    { lbl:"TOPLAM HİSSE",  val:`${dolu}/${h.maxHisse}`,  renk:"#e8d5a3", bg:"rgba(255,255,255,.04)",      br:"rgba(255,255,255,.08)" },
                  ].map(x => (
                    <div key={x.lbl} style={{ background:x.bg, border:`1px solid ${x.br}`, borderRadius:10, padding:"11px", textAlign:"center" }}>
                      <div style={{ fontSize:9, color:"#806040", marginBottom:4, letterSpacing:1 }}>{x.lbl}</div>
                      <div style={{ fontSize:17, fontWeight:700, color:x.renk }}>{x.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#806040", marginBottom:3 }}>
                    <span>Doluluk</span>
                    {bek>0 && <span style={{ color:"#d4a017" }}>⏳ {bek} bekleyen</span>}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {Array.from({length:h.maxHisse}).map((_,i) => (
                      <div key={i} style={{ flex:1, height:10, borderRadius:5, background:i<dolu?"#8b1a1a":i<dolu+bek?"#d4a017":"rgba(255,255,255,.1)" }}/>
                    ))}
                  </div>
                </div>
                {h.aciklama && (
                  <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(212,160,23,.15)", borderRadius:8, padding:"10px 13px", marginBottom:14 }}>
                    <div style={{ fontSize:9, color:"#806040", marginBottom:4, letterSpacing:1 }}>📝 AÇIKLAMA</div>
                    <p style={{ margin:0, fontSize:13, color:"#c8b88a", lineHeight:1.7 }}>{h.aciklama}</p>
                  </div>
                )}
                {efBos > 0
                  ? <button onClick={()=>setTalepModal(h)} style={{ width:"100%", padding:"14px", background:"linear-gradient(90deg,#8b1a1a,#c0392b)", border:"none", borderRadius:10, color:"#f5e6c0", cursor:"pointer", fontFamily:FONT, fontWeight:700, fontSize:15, touchAction:"manipulation" }}>
                      🐄 Hisse Talep Et — {formatTL(hT)}
                    </button>
                  : <div style={{ textAlign:"center", padding:"12px", background:"rgba(255,255,255,.03)", borderRadius:10, color:"#604030", fontSize:14 }}>Bu hayvan için yer kalmadı</div>
                }
              </div>
            </div>
          </div>
        );
      })()}

      {/* TALEP MODAL */}
      {talepModal && (
        <div onClick={()=>setTalepModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:150, padding:12 }}>
          <div className="talep-modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 4px", color:"#d4a017", fontFamily:FONT }}>Hisse Talebi</h3>
            <p style={{ margin:"0 0 16px", color:"#806040", fontSize:13 }}>
              #{talepModal.numara} nolu hayvan • {formatTL(talepModal.tip==="buyukbas"?Math.round(talepModal.fiyat/talepModal.maxHisse):talepModal.fiyat)}
            </p>
            {[["ad","Ad Soyad *","Ahmet Yılmaz"],["telefon","Telefon *","0555 123 45 67"]].map(([f,l,p]) => (
              <div key={f} style={{ marginBottom:12 }}>
                <label style={S.lbl}>{l}</label>
                <input value={form[f]} onChange={e=>setForm(v=>({...v,[f]:e.target.value}))} placeholder={p} style={S.inp} inputMode={f==="telefon"?"tel":"text"}/>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>setTalepModal(null)} style={{ flex:1, ...S.btn("#604030"), color:"#a08060" }}>İptal</button>
              <button onClick={gonder} style={{ flex:2, ...S.solid() }}>Talep Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
function LoginPanel({ sifre, setSifre, err, onGiris, onGeri }) {
  return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:16 }}>
      <div style={{ background:"linear-gradient(160deg,#150a02,#0e0601)", border:"1px solid #d4a017", borderRadius:18, padding:"36px 28px", width:"100%", maxWidth:340, textAlign:"center", boxShadow:"0 0 50px rgba(212,160,23,.1)" }}>
        <div style={{ fontSize:38, marginBottom:10 }}>🔐</div>
        <h2 style={{ color:"#d4a017", margin:"0 0 5px", fontFamily:FONT }}>Yönetici Girişi</h2>
        <p style={{ color:"#806040", fontSize:13, margin:"0 0 20px" }}>Şifreyi girerek devam edin</p>
        <input type="password" value={sifre} onChange={e=>setSifre(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onGiris()} placeholder="Şifre"
          style={{ ...S.inp, textAlign:"center", border:`1px solid ${err?"#f87171":"rgba(212,160,23,.3)"}` }}/>
        {err && <p style={{ color:"#f87171", fontSize:12, margin:"7px 0 0" }}>❌ Hatalı şifre</p>}
        <button onClick={onGiris} style={{ marginTop:14, width:"100%", ...S.solid(), padding:13, fontSize:15 }}>Giriş Yap</button>
        <button onClick={onGeri} style={{ marginTop:8, width:"100%", background:"transparent", border:"none", color:"#806040", cursor:"pointer", fontFamily:FONT, fontSize:13, padding:"8px" }}>← Geri Dön</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ADMİN PANELİ
════════════════════════════════════════════ */
function AdminPanel({ hayvanlar, talepler, onOnayla, onReddet, onEkleH, onGuncH, onSilHisse, onDurum, onHisseDirekt, onCikis, sbHata }) {
  const [sekme,    setSekme]    = useState("talepler");
  const [yeniH,    setYeniH]    = useState({ tip:"buyukbas", kategori:"koyun", numara:"", kesimSirasi:"", fiyat:"", maxHisse:"7", foto:"", aciklama:"" });
  const [acik,     setAcik]     = useState(null);
  const [fotoEdit, setFotoEdit] = useState({});
  const [hForm,    setHForm]    = useState({});

  const bekleyen = talepler.filter(t => t.durum === "bekliyor");

  const numSet = (key, val) => setYeniH(p => ({...p, [key]: val.replace(/\D/g,"")}));

  const ekleHayvan = () => {
    if (!yeniH.numara || !yeniH.kesimSirasi || !yeniH.fiyat) { alert("Hayvan No, Kesim Sırası ve Fiyat zorunludur!"); return; }
    onEkleH({ ...yeniH, numara:+yeniH.numara, kesimSirasi:+yeniH.kesimSirasi, fiyat:+yeniH.fiyat, maxHisse:yeniH.tip==="kucukbas"?1:+yeniH.maxHisse });
    setYeniH({ tip:"buyukbas", kategori:"koyun", numara:"", kesimSirasi:"", fiyat:"", maxHisse:"7", foto:"", aciklama:"" });
    alert("✅ Hayvan eklendi!");
  };

  const hisseDirekt = (hid) => {
    const f = hForm[hid] || {};
    if (!f.ad?.trim() || !f.telefon?.trim()) { alert("Ad ve telefon zorunludur!"); return; }
    if (onHisseDirekt(hid, f.ad.trim(), f.telefon.trim())) {
      setHForm(p => ({...p, [hid]:{ad:"",telefon:""}}));
      alert("✅ Hissedar eklendi!");
    }
  };

  // ── EXCEL / CSV İNDİR ──
  const excelIndir = (tur) => {
    const satirlar = [];

    if (tur === "hisseler") {
      // Tüm onaylı hisseler
      satirlar.push(["Kesim Sırası","Hayvan No","Tür","Hissedar Adı","Telefon","Hisse Tutarı","Tarih"]);
      [...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).forEach(h => {
        h.hisseler.filter(x=>x.durum==="onaylı").forEach(hisse => {
          satirlar.push([
            h.kesimSirasi,
            `#${h.numara}`,
            h.tip==="buyukbas"?"Büyükbaş":`Küçükbaş (${h.kategori})`,
            hisse.ad,
            hisse.telefon,
            hisse.tutar,
            hisse.tarih,
          ]);
        });
      });
    } else if (tur === "hayvanlar") {
      // Hayvan özet listesi
      satirlar.push(["Kesim Sırası","Hayvan No","Tür","Toplam Fiyat","Hisse Bedeli","Max Hisse","Dolu","Boş","Durum"]);
      [...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).forEach(h => {
        const dolu = h.hisseler.filter(x=>x.durum==="onaylı").length;
        const bos  = h.maxHisse - dolu;
        const hT   = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
        satirlar.push([
          h.kesimSirasi, `#${h.numara}`,
          h.tip==="buyukbas"?"Büyükbaş":`Küçükbaş (${h.kategori})`,
          h.fiyat, hT, h.maxHisse, dolu, bos, h.durum
        ]);
      });
    } else if (tur === "talepler") {
      // Tüm talepler
      satirlar.push(["Hayvan No","Ad","Telefon","Tutar","Durum","Tarih"]);
      talepler.forEach(t => {
        const h = hayvanlar.find(x=>x.id===t.hayvanId);
        satirlar.push([`#${h?.numara||"?"}`, t.ad, t.telefon, t.tutar, t.durum, t.tarih]);
      });
    }

    // CSV oluştur (Excel'de açılır)
    const bom = "\uFEFF"; // Türkçe karakter için BOM
    const csv = bom + satirlar.map(r => r.map(h => `"${String(h).replace(/"/g,'""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `kurban_${tur}_${new Date().toLocaleDateString("tr-TR").replace(/\./g,"-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── VERİ YEDEĞİ ──
  const yedegiIndir = () => {
    const veri = { hayvanlar, talepler, tarih: new Date().toISOString(), surum:"1.0" };
    const blob  = new Blob([JSON.stringify(veri, null, 2)], { type:"application/json" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href = url;
    a.download = `kurban_yedek_${new Date().toLocaleDateString("tr-TR").replace(/\./g,"-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const yedegiYukle = (e) => {
    const dosya = e.target.files[0]; if (!dosya) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const veri = JSON.parse(ev.target.result);
        if (!veri.hayvanlar || !veri.talepler) { alert("Geçersiz yedek dosyası!"); return; }
        if (window.confirm(`Yedek yüklenecek. Mevcut ${veri.hayvanlar.length} hayvan ve ${veri.talepler.length} talep geri yüklenecek. Devam?`)) {
          localStorage.setItem("kurban_hayvanlar", JSON.stringify(veri.hayvanlar));
          localStorage.setItem("kurban_talepler",  JSON.stringify(veri.talepler));
          window.location.reload();
        }
      } catch { alert("Dosya okunamadı!"); }
    };
    reader.readAsText(dosya);
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ background:"linear-gradient(90deg,#0d0500,#1a0800,#0d0500)", borderBottom:"2px solid #d4a017", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, color:"#d4a017", fontFamily:FONT }}>⚙️ Yönetici Paneli</h1>
          <p style={{ margin:0, fontSize:11, color:"#806040" }}>Murat Yalvaç Öğrenci Yurdu • 2026</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {bekleyen.length > 0 && <span style={{ background:"#c0392b", color:"#fff", borderRadius:20, padding:"3px 10px", fontSize:12 }}>{bekleyen.length}</span>}
          <button onClick={onCikis} style={S.btn("#806040")}>Çıkış</button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="sekme-bar">
        {[["talepler","📋 Talepler"],["hayvanlar","🐄 Hayvanlar"],["ekle","➕ Ekle"],["rapor","📊 Rapor"]].map(([k,l]) => (
          <button key={k} className="sekme-btn" onClick={()=>setSekme(k)}
            style={{ borderBottomColor:sekme===k?"#d4a017":"transparent", color:sekme===k?"#d4a017":"#806040" }}>
            {l}{k==="talepler"&&bekleyen.length>0?` (${bekleyen.length})`:""}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"16px 12px" }}>

        {/* ── TALEPLER ── */}
        {sekme==="talepler" && (
          <div>
            <h3 style={{ color:"#d4a017", marginTop:0, fontFamily:FONT }}>Bekleyen Talepler</h3>
            {bekleyen.length === 0
              ? <p style={{ color:"#604030" }}>Bekleyen talep yok.</p>
              : bekleyen.map(t => {
                  const h = hayvanlar.find(x=>x.id===t.hayvanId);
                  return (
                    <div key={t.id} style={{ ...S.card, padding:14, marginBottom:10 }}>
                      <div style={{ marginBottom:10 }}>
                        <span style={{ color:"#d4a017", fontWeight:700 }}>#{h?.numara} nolu hayvan</span>
                        <span style={{ marginLeft:10, color:"#f5e6c0" }}>{t.ad}</span>
                        <span style={{ marginLeft:8, color:"#806040", fontSize:12 }}>{t.telefon}</span>
                        <div style={{ fontSize:12, color:"#604030", marginTop:2 }}>{t.tarih} • {formatTL(t.tutar)}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>onOnayla(t.id)} style={{ flex:1, padding:"9px", background:"#14532d", border:"1px solid #4ade80", borderRadius:8, color:"#4ade80", cursor:"pointer", fontFamily:FONT, fontSize:13, touchAction:"manipulation" }}>✓ Onayla</button>
                        <button onClick={()=>onReddet(t.id)} style={{ flex:1, padding:"9px", background:"#7f1d1d", border:"1px solid #f87171", borderRadius:8, color:"#f87171", cursor:"pointer", fontFamily:FONT, fontSize:13, touchAction:"manipulation" }}>✗ Reddet</button>
                      </div>
                    </div>
                  );
                })
            }
            <h3 style={{ color:"#806040", marginTop:20, fontFamily:FONT }}>Geçmiş Talepler</h3>
            {talepler.filter(t=>t.durum!=="bekliyor").length === 0
              ? <p style={{ color:"#604030", fontSize:13 }}>Geçmiş talep yok.</p>
              : talepler.filter(t=>t.durum!=="bekliyor").map(t => {
                  const h = hayvanlar.find(x=>x.id===t.hayvanId);
                  return (
                    <div key={t.id} style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:8, padding:"9px 12px", marginBottom:5, fontSize:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                        <span>#{h?.numara} • {t.ad} • {t.telefon}</span>
                        <span style={{ color:t.durum==="onaylı"?"#4ade80":"#f87171" }}>{t.durum==="onaylı"?"✓ Onaylı":"✗ Reddedildi"}</span>
                      </div>
                      <div style={{ color:"#604030", marginTop:2 }}>{formatTL(t.tutar)} • {t.tarih}</div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── HAYVANLAR ── */}
        {sekme==="hayvanlar" && (
          <div>
            <h3 style={{ color:"#d4a017", marginTop:0, fontFamily:FONT }}>Hayvan Listesi</h3>
            {[...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).map(h => {
              const bos  = getBos(h), dolu = h.maxHisse - bos;
              const hT   = h.tip==="buyukbas" ? Math.round(h.fiyat/h.maxHisse) : h.fiyat;
              const isAcik = acik === h.id;
              const hf = hForm[h.id] || { ad:"", telefon:"" };
              return (
                <div key={h.id} style={{ ...S.card, padding:14, marginBottom:12, border:`1px solid ${h.durum==="aktif"?"rgba(212,160,23,.25)":"rgba(255,0,0,.2)"}` }}>
                  {/* Özet */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0 }}>
                      {h.foto && <img src={h.foto} alt="" style={{ width:44, height:44, borderRadius:8, objectFit:"cover", flexShrink:0 }} onError={e=>e.target.style.display="none"}/>}
                      <div style={{ minWidth:0 }}>
                        <span style={{ fontSize:16, color:"#d4a017", fontWeight:700 }}>#{h.numara}</span>
                        <span style={{ marginLeft:8, fontSize:12, color:"#806040" }}>{h.tip==="buyukbas"?"🐄 Büyükbaş":`🐑 ${h.kategori}`} • {h.kesimSirasi}. sıra</span>
                        <div style={{ fontSize:12, color:"#a08060", marginTop:2 }}>
                          {formatTL(hT)}/hisse • <span style={{ color:"#4ade80" }}>{bos} boş</span> / {h.maxHisse}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={()=>setAcik(isAcik?null:h.id)} style={{ ...S.btn(), fontSize:12, padding:"6px 12px" }}>{isAcik?"▲":"▼"}</button>
                      <button onClick={()=>onDurum(h.id,h.durum==="aktif"?"pasif":"aktif")} style={{ ...S.btn(h.durum==="aktif"?"#f87171":"#4ade80"), fontSize:11, padding:"6px 10px" }}>{h.durum==="aktif"?"Pasif":"Aktif"}</button>
                    </div>
                  </div>

                  {isAcik && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(212,160,23,.15)" }}>

                      {/* HİSSEDAR EKLE */}
                      <div style={{ background:"rgba(212,160,23,.07)", border:"1px solid rgba(212,160,23,.22)", borderRadius:10, padding:"13px", marginBottom:14 }}>
                        <p style={{ margin:"0 0 10px", fontSize:13, color:"#d4a017", fontWeight:700 }}>
                          ➕ Hissedar Ekle <span style={{ fontSize:11, fontWeight:400, color:"#806040" }}>({bos} boş yer)</span>
                        </p>
                        <div className="hform-row">
                          <div>
                            <label style={S.lbl}>Ad Soyad</label>
                            <input value={hf.ad} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,ad:e.target.value}}))} placeholder="Ahmet Yılmaz" style={S.inp}/>
                          </div>
                          <div>
                            <label style={S.lbl}>Telefon</label>
                            <input value={hf.telefon} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,telefon:e.target.value}}))} placeholder="0555 000 00 00" inputMode="tel" style={S.inp}/>
                          </div>
                        </div>
                        <button onClick={()=>hisseDirekt(h.id)} style={{ marginTop:10, width:"100%", padding:"10px", background:"#1a4a1a", border:"1px solid #4ade80", borderRadius:8, color:"#4ade80", cursor:"pointer", fontFamily:FONT, fontWeight:600, fontSize:14, touchAction:"manipulation" }}>
                          ✓ Hissedar Kaydet — {formatTL(hT)}
                        </button>
                      </div>

                      {/* FOTOĞRAF */}
                      <div style={{ marginBottom:12 }}>
                        <label style={S.lbl}>📷 Fotoğraf URL (ImgBB Direct Link)</label>
                        <div style={{ display:"flex", gap:8 }}>
                          <input value={fotoEdit[h.id]??h.foto??""} onChange={e=>setFotoEdit(p=>({...p,[h.id]:e.target.value}))} placeholder="https://i.ibb.co/..." style={{ ...S.inp, flex:1 }}/>
                          <button onClick={()=>{onGuncH(h.id,{foto:fotoEdit[h.id]??h.foto??""});alert("Güncellendi!");}} style={{ ...S.solid("#1a4a1a","#4ade80"), whiteSpace:"nowrap", padding:"0 14px" }}>✓</button>
                        </div>
                        {(fotoEdit[h.id]||h.foto) && <img src={fotoEdit[h.id]??h.foto} alt="" style={{ marginTop:7, height:70, borderRadius:6, objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>}
                        <p style={{ margin:"4px 0 0", fontSize:11, color:"#604030" }}>⚠️ JPG/PNG — Direct Link: https://i.ibb.co/...</p>
                      </div>

                      {/* AÇIKLAMA */}
                      <div style={{ marginBottom:12 }}>
                        <label style={S.lbl}>📝 Açıklama</label>
                        <textarea value={h.aciklama||""} onChange={e=>onGuncH(h.id,{aciklama:e.target.value})} placeholder="Not..." rows={2} style={{ ...S.inp, resize:"vertical" }}/>
                      </div>

                      {/* HİSSE LİSTESİ */}
                      <p style={{ margin:"0 0 7px", fontSize:12, color:"#806040", fontWeight:700 }}>Onaylı Hisseler ({dolu}/{h.maxHisse}):</p>
                      {h.hisseler.filter(x=>x.durum==="onaylı").length === 0
                        ? <p style={{ color:"#604030", fontSize:12 }}>Henüz onaylı hisse yok.</p>
                        : h.hisseler.filter(x=>x.durum==="onaylı").map((hisse,i) => (
                            <div key={hisse.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", background:"rgba(255,255,255,.03)", borderRadius:6, marginBottom:4, fontSize:13 }}>
                              <span style={{ flex:1, minWidth:0, overflow:"hidden" }}>
                                <span style={{ color:"#d4a017", fontWeight:700 }}>{i+1}.</span> {hisse.ad} • {hisse.telefon} • <span style={{ color:"#d4a017" }}>{formatTL(hisse.tutar)}</span>
                              </span>
                              <button onClick={()=>onSilHisse(h.id,hisse.id)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:18, padding:"0 4px", flexShrink:0 }}>×</button>
                            </div>
                          ))
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HAYVAN EKLE ── */}
        {sekme==="ekle" && (
          <div style={{ maxWidth:440 }}>
            <h3 style={{ color:"#d4a017", marginTop:0, fontFamily:FONT }}>Yeni Hayvan Ekle</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={S.lbl}>Tür</label>
                <select value={yeniH.tip} onChange={e=>setYeniH(p=>({...p,tip:e.target.value,maxHisse:e.target.value==="kucukbas"?"1":"7"}))} style={S.sel}>
                  <option value="buyukbas">🐄 Büyükbaş</option>
                  <option value="kucukbas">🐑 Küçükbaş</option>
                </select>
              </div>
              {yeniH.tip==="kucukbas" && (
                <div>
                  <label style={S.lbl}>Kategori</label>
                  <select value={yeniH.kategori} onChange={e=>setYeniH(p=>({...p,kategori:e.target.value}))} style={S.sel}>
                    <option value="koyun">Koyun</option>
                    <option value="keci">Keçi</option>
                  </select>
                </div>
              )}
              <div>
                <label style={S.lbl}>Hayvan No</label>
                <input value={yeniH.numara} onChange={e=>numSet("numara",e.target.value)} placeholder="Örn: 7" inputMode="numeric" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>Kesim Sırası</label>
                <input value={yeniH.kesimSirasi} onChange={e=>numSet("kesimSirasi",e.target.value)} placeholder="Örn: 3" inputMode="numeric" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>Toplam Fiyat (TL)</label>
                <input value={yeniH.fiyat} onChange={e=>numSet("fiyat",e.target.value)} placeholder="350000" inputMode="numeric" style={S.inp}/>
                <p style={{ margin:"4px 0 0", fontSize:11, color:"#604030" }}>Nokta/virgül olmadan yazın: 350000</p>
              </div>
              {yeniH.tip==="buyukbas" && (
                <div>
                  <label style={S.lbl}>Maks Hisse (1–7)</label>
                  <input value={yeniH.maxHisse} onChange={e=>{const v=Math.min(7,Math.max(1,+e.target.value.replace(/\D/g,"")||1));setYeniH(p=>({...p,maxHisse:String(v)}));}} inputMode="numeric" style={S.inp}/>
                </div>
              )}
              <div>
                <label style={S.lbl}>📷 Fotoğraf URL (ImgBB Direct Link)</label>
                <input value={yeniH.foto} onChange={e=>setYeniH(p=>({...p,foto:e.target.value}))} placeholder="https://i.ibb.co/..." style={S.inp}/>
                <p style={{ margin:"4px 0 0", fontSize:11, color:"#604030" }}>imgbb.com → yükle → <strong style={{ color:"#d4a017" }}>Direct Link</strong> ⚠️ JPG/PNG</p>
                {yeniH.foto && <img src={yeniH.foto} alt="" style={{ marginTop:7, height:70, borderRadius:6, objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>}
              </div>
              <div>
                <label style={S.lbl}>📝 Açıklama (opsiyonel)</label>
                <textarea value={yeniH.aciklama} onChange={e=>setYeniH(p=>({...p,aciklama:e.target.value}))} placeholder="Örn: Sağlıklı, 3 yaşında..." rows={2} style={{ ...S.inp, resize:"vertical" }}/>
              </div>
              {yeniH.fiyat && +yeniH.maxHisse > 0 && (
                <div style={{ background:"rgba(212,160,23,.08)", border:"1px solid rgba(212,160,23,.25)", borderRadius:8, padding:"10px 14px", fontSize:14, color:"#d4a017" }}>
                  💡 Hisse bedeli: <strong>{formatTL(Math.round(+yeniH.fiyat / +yeniH.maxHisse))}</strong>
                </div>
              )}
              <button onClick={ekleHayvan} style={{ padding:"13px", background:"linear-gradient(90deg,#1a4a1a,#2d7a2d)", border:"1px solid #4ade80", borderRadius:8, color:"#4ade80", cursor:"pointer", fontFamily:FONT, fontWeight:600, fontSize:15, touchAction:"manipulation" }}>
                ➕ Hayvan Ekle
              </button>
            </div>
          </div>
        )}

        {/* ── RAPOR & YEDEK ── */}
        {sekme==="rapor" && (() => {
          const toplamHayvan = hayvanlar.length;
          const aktifHayvan  = hayvanlar.filter(h=>h.durum==="aktif").length;
          const toplamHisse  = hayvanlar.reduce((a,h)=>a+h.maxHisse,0);
          const doluHisse    = hayvanlar.reduce((a,h)=>a+h.hisseler.filter(x=>x.durum==="onaylı").length,0);
          const bosHisse     = toplamHisse - doluHisse;
          const toplamCiro   = hayvanlar.reduce((a,h)=>a+h.hisseler.filter(x=>x.durum==="onaylı").reduce((b,x)=>b+x.tutar,0),0);
          const dolulukOran  = toplamHisse > 0 ? Math.round(doluHisse/toplamHisse*100) : 0;
          return (
            <div>
              <h3 style={{ color:"#d4a017", marginTop:0, fontFamily:FONT }}>📊 Genel Rapor</h3>
              {/* Özet kartlar */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:22 }}>
                {[
                  { lbl:"Toplam Hayvan",   val:toplamHayvan,         renk:"#d4a017" },
                  { lbl:"Aktif Hayvan",    val:aktifHayvan,          renk:"#4ade80" },
                  { lbl:"Dolu Hisse",      val:doluHisse,            renk:"#4ade80" },
                  { lbl:"Boş Hisse",       val:bosHisse,             renk:"#f87171" },
                  { lbl:"Doluluk Oranı",   val:`%${dolulukOran}`,    renk:"#d4a017" },
                  { lbl:"Toplam Tahsilat", val:formatTL(toplamCiro), renk:"#ffe082" },
                ].map(x => (
                  <div key={x.lbl} style={{ ...S.card, padding:"12px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#806040", marginBottom:4 }}>{x.lbl}</div>
                    <div style={{ fontSize:17, fontWeight:700, color:x.renk, wordBreak:"break-word" }}>{x.val}</div>
                  </div>
                ))}
              </div>
              {/* Doluluk çubuğu */}
              <div style={{ ...S.card, padding:"14px 16px", marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#a08060", marginBottom:8 }}>
                  <span>Genel Doluluk</span>
                  <span style={{ color:"#d4a017", fontWeight:700 }}>%{dolulukOran} — {doluHisse}/{toplamHisse} hisse</span>
                </div>
                <div style={{ background:"rgba(255,255,255,.08)", borderRadius:8, height:14, overflow:"hidden" }}>
                  <div style={{ width:`${dolulukOran}%`, height:"100%", background:"linear-gradient(90deg,#8b1a1a,#d4a017)", borderRadius:8, transition:"width .5s" }}/>
                </div>
              </div>
              {/* Hayvan bazlı tablo */}
              <div style={{ ...S.card, padding:"14px 16px", marginBottom:20, overflowX:"auto" }}>
                <p style={{ margin:"0 0 10px", fontSize:13, color:"#d4a017", fontWeight:700 }}>Hayvan Bazlı Doluluk</p>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:320 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(212,160,23,.3)" }}>
                      {["Sıra","No","Tür","Hisse","Dolu","Boş","Tahsilat"].map(h=>(
                        <th key={h} style={{ padding:"6px 8px", color:"#a08060", textAlign:"left", fontWeight:600, whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).map(h=>{
                      const dolu = h.hisseler.filter(x=>x.durum==="onaylı").length;
                      const bos  = h.maxHisse - dolu;
                      const ciro = h.hisseler.filter(x=>x.durum==="onaylı").reduce((a,x)=>a+x.tutar,0);
                      return (
                        <tr key={h.id} style={{ borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                          <td style={{ padding:"7px 8px", color:"#806040" }}>{h.kesimSirasi}.</td>
                          <td style={{ padding:"7px 8px", color:"#d4a017", fontWeight:700 }}>#{h.numara}</td>
                          <td style={{ padding:"7px 8px", color:"#a08060" }}>{h.tip==="buyukbas"?"🐄":"🐑"}</td>
                          <td style={{ padding:"7px 8px", color:"#e8d5a3" }}>{h.maxHisse}</td>
                          <td style={{ padding:"7px 8px", color:"#4ade80", fontWeight:700 }}>{dolu}</td>
                          <td style={{ padding:"7px 8px", color:bos>0?"#f87171":"#604030", fontWeight:700 }}>{bos}</td>
                          <td style={{ padding:"7px 8px", color:"#d4a017", whiteSpace:"nowrap" }}>{formatTL(ciro)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Excel indirme */}
              <div style={{ ...S.card, padding:"16px", marginBottom:16 }}>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"#d4a017", fontWeight:700 }}>📥 Excel / CSV İndir</p>
                <p style={{ margin:"0 0 14px", fontSize:12, color:"#806040" }}>Excel veya Google Sheets'te açılır. Noktalı virgül (;) ile ayrılmış CSV formatı.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  <button onClick={()=>excelIndir("hisseler")} style={{ ...S.solid("#1a3a1a","#4ade80"), padding:"11px", textAlign:"left", fontSize:13 }}>📋 Hissedar Listesi (ad, telefon, tutar, hayvan)</button>
                  <button onClick={()=>excelIndir("hayvanlar")} style={{ ...S.solid("#1a2a4a","#60a5fa"), padding:"11px", textAlign:"left", fontSize:13 }}>🐄 Hayvan Özet Listesi (doluluk, fiyatlar)</button>
                  <button onClick={()=>excelIndir("talepler")}  style={{ ...S.solid("#3a1a00","#fb923c"), padding:"11px", textAlign:"left", fontSize:13 }}>📨 Tüm Talepler (onaylı + bekleyen + reddedilen)</button>
                </div>
              </div>
              {/* Yedek */}
              <div style={{ ...S.card, padding:"16px", border:"1px solid rgba(251,146,60,.3)" }}>
                <p style={{ margin:"0 0 6px", fontSize:13, color:"#fb923c", fontWeight:700 }}>🔐 Veri Yedeği</p>
                <p style={{ margin:"0 0 14px", fontSize:12, color:"#806040", lineHeight:1.7 }}>
                  {sbHata
                    ? <span style={{color:"#f87171"}}>⚠️ Supabase bağlantısı yok! Veriler şu an yalnızca bu cihazda saklanıyor. İnternet bağlantınızı kontrol edin.</span>
                    : <span style={{color:"#4ade80"}}>✅ Veriler Supabase'de güvenle saklanıyor — tüm cihazlardan erişilebilir.</span>
                  }<br/>
                  <strong style={{ color:"#d4a017" }}>Yine de düzenli yedek almanızı öneririz.</strong>
                </p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={yedegiIndir} style={{ ...S.solid("#3a1a00","#fb923c"), flex:1, minWidth:140, padding:"11px" }}>💾 Yedek İndir (.json)</button>
                  <label style={{ ...S.solid("#1a1a3a","#818cf8"), flex:1, minWidth:140, padding:"11px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    📂 Yedekten Geri Yükle
                    <input type="file" accept=".json" onChange={yedegiYukle} style={{ display:"none" }}/>
                  </label>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
