import React, { useState, useEffect, useRef, useCallback } from "react";

/* = SABITLER = */
const ADMIN_PASSWORD = "kurban2026";
const SB_URL = "https://pbevwbsvhivrfdgvqexc.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZXZ3YnN2aGl2cmZkZ3ZxZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU0NDgsImV4cCI6MjA4ODczMTQ0OH0.Yudg5A8hSHWT8b-TF2Ezsnc_QMGPU2ljKQ0JaacT7o8";
const SB_HDR = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` };

const formatTL  = (n) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n);
const formatSayi = (n) => new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(n||0);
/* Fiyat input: kullanıcı yazar "350000" → göster "350.000" → kaydet raw number */
function FiyatInput({value, onChange, placeholder, style}) {
  const [odak, setOdak] = React.useState(false);
  const [ham,  setHam]  = React.useState(value ? String(value) : "");
  React.useEffect(()=>{ if(!odak) setHam(value ? String(value) : ""); },[value,odak]);
  const goster = odak ? ham : (value ? formatSayi(value) : "");
  return (
    <input
      type="text" inputMode="numeric"
      value={goster}
      placeholder={placeholder||"Örn: 350.000"}
      onChange={e=>{ const v=e.target.value.replace(/[^\d]/g,""); setHam(v); onChange(+v||0); }}
      onFocus={()=>{ setOdak(true); setHam(value ? String(value) : ""); }}
      onBlur={()=>setOdak(false)}
      style={style}
    />
  );
}
const uid   = () => Math.random().toString(36).substr(2,9);
/* Kesim saati hesapla: sabah 08:00 başlangıç, saatte 4 hayvan */
const kesimSaati = (sira) => {
  if(!sira || sira <= 0) return null;
  const dakika = Math.round((sira - 1) * 15); // 60dk / 4 hayvan = 15dk/hayvan
  const saat = 8 + Math.floor(dakika / 60);
  const dk = dakika % 60;
  const suffix = saat < 12 ? "sabah" : saat < 17 ? "öğleden sonra" : "akşam";
  return { saat, dk, metin: `${String(saat).padStart(2,"0")}:${String(dk).padStart(2,"0")}`, suffix };
};
const zaman = () => new Date().toLocaleString("tr-TR");
const getBos = (h) => h.maxHisse - h.hisseler.filter(x=>x.durum==="onaylı").length;

const WA_YONETICI = "905321234567"; // ← kendi numaranızla değiştirin
const waGonder = (tel, mesaj) => {
  const temizTel = String(tel).replace(/\D/g,"").replace(/^0/,"90");
  window.open(`https://wa.me/${temizTel}?text=${encodeURIComponent(mesaj)}`,"_blank");
};

/* = SUPABASE = */
async function sbOku(key) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/kurban_data?key=eq.${key}&select=value`,{headers:SB_HDR});
    const d = await r.json();
    if (!Array.isArray(d) || d.length===0) return null;
    return JSON.parse(d[0].value);
  } catch { return null; }
}
async function sbYaz(key, value) {
  const strVal = JSON.stringify(value);
  // Önce PATCH dene (kayıt varsa güncelle)
  const patch = await fetch(`${SB_URL}/rest/v1/kurban_data?key=eq.${key}`, {
    method:"PATCH",
    headers:{...SB_HDR,"Prefer":"return=representation"},
    body:JSON.stringify({value:strVal})
  });
  const patched = await patch.json();
  // PATCH sıfır kayıt döndürdüyse yeni kayıt ekle
  if(!Array.isArray(patched)||patched.length===0){
    await fetch(`${SB_URL}/rest/v1/kurban_data`,{
      method:"POST",
      headers:{...SB_HDR,"Prefer":"return=minimal"},
      body:JSON.stringify({key,value:strVal})
    });
  }
}

/* = FONTS = */
const _fl = document.createElement("link");
_fl.rel="stylesheet";
_fl.href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(_fl);

const FONT = "'Inter','Amiri',sans-serif";



/* = GLOBAL CSS = */
const CSS = `
  *,*::before,*::after{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{margin:0;background:#f5efe6;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
  input,select,textarea,button{font-family:${FONT};}
  h1,h2,h3,h4{margin:0;font-family:${FONT};}

  /* Kart hover — sadece fare olan cihazlarda */
  @media(hover:hover){.hkart:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(139,26,26,.14);}}
  .hkart{transition:transform .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent;cursor:pointer;}

  /* Hayvan kartı grid */
  .hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
  @media(max-width:540px){.hgrid{grid-template-columns:1fr;gap:10px;}}

  /* Sekme bar */
  .sbar{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;
        border-bottom:2px solid rgba(122,20,20,.15);scrollbar-width:none;background:#f5efe6;}
  .sbar::-webkit-scrollbar{display:none;}
  .sbtn{flex-shrink:0;padding:12px 16px;background:none;border:none;border-bottom:3px solid transparent;
        cursor:pointer;font-family:${FONT};font-size:13px;font-weight:500;white-space:nowrap;
        touch-action:manipulation;color:#6b4423;margin-bottom:-2px;}

  /* Modallar */
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;
            justify-content:center;z-index:300;padding:0;}
  @media(min-width:600px){.modal-bg{align-items:center;padding:16px;}}
  .modal-kart{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;
              max-height:92vh;overflow-y:auto;padding:0;}
  @media(min-width:600px){.modal-kart{border-radius:18px;max-height:88vh;}}
  /* Talep formu - mobilde tam ekran */
  .talep-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;align-items:flex-end;justify-content:center;}
  @media(min-width:600px){.talep-bg{align-items:center;}}
  .talep-kart{background:#fdf8f0;width:100%;max-width:480px;
              height:100%;max-height:100%;overflow-y:auto;padding:0;display:flex;flex-direction:column;}
  @media(min-width:600px){.talep-kart{height:auto;max-height:90vh;border-radius:16px;}}

  /* Genel form satırı */
  .frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  @media(max-width:400px){.frow{grid-template-columns:1fr;}}

  /* Admin buton grubu */
  .abtn-grp{display:flex;gap:5px;flex-wrap:wrap;flex-shrink:0;}
  @media(max-width:400px){.abtn-grp button{padding:5px 7px !important;font-size:11px !important;}}

  /* Detay grid 2x2 */
  .dgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;}

  /* Güncelleme formu */
  .gform{display:flex;flex-direction:column;gap:10px;padding:14px;
         background:#fafaf8;border-radius:10px;margin-top:10px;
         border:1px solid rgba(200,134,26,.2);}

  /* Talep onay buton satırı */
  .onay-row{display:flex;gap:8px;margin-top:4px;}
  .onay-row button{flex:1;min-width:0;}

  /* İstatistik bar sayıları */
  .stat-bar{display:flex;justify-content:space-around;gap:4px;}

  /* Genel içerik sarıcı */
  .icerik{max-width:860px;margin:0 auto;padding:14px 12px 40px;}
  @media(max-width:480px){.icerik{padding:10px 10px 32px;}}
`;


/* = STİLLER = */
const S = {
  page: {minHeight:"100vh",background:"#f5efe6",fontFamily:FONT,color:"#2d1a08"},
  card: {background:"#ffffff",border:"1px solid rgba(200,134,26,.25)",borderRadius:14,boxShadow:"0 2px 8px rgba(122,62,16,.08)"},
  btn:  (c="#8b4a10")=>({padding:"8px 14px",border:`1px solid ${c}`,borderRadius:8,background:"transparent",color:c,cursor:"pointer",fontFamily:FONT,fontSize:13,touchAction:"manipulation",whiteSpace:"nowrap"}),
  solid:(bg="#8b1a1a",c="#fff8f0")=>({padding:"11px 18px",border:"none",borderRadius:8,background:bg,color:c,cursor:"pointer",fontFamily:FONT,fontWeight:600,fontSize:14,touchAction:"manipulation"}),
  lbl:  {fontSize:12,color:"#8a5c30",display:"block",marginBottom:4},
  inp:  {width:"100%",padding:"11px 12px",background:"#fff",border:"1px solid rgba(200,134,26,.4)",borderRadius:8,color:"#2d1a08",fontFamily:FONT,fontSize:16,boxSizing:"border-box"},
  sel:  {width:"100%",padding:"11px 12px",background:"#fff",border:"1px solid rgba(200,134,26,.4)",borderRadius:8,color:"#2d1a08",fontFamily:FONT,fontSize:16},
};

/* = ODEME INPUT BiLESENi = */
function OdemeInput({tutar, odenen, onChange}) {
  const [deger, setDeger] = React.useState(odenen ? Number(odenen).toLocaleString("tr-TR") : "");
  const [odak, setOdak] = React.useState(false);
  React.useEffect(() => {
    if (!odak) setDeger(odenen ? Number(odenen).toLocaleString("tr-TR") : "");
  }, [odenen, odak]);
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
      <input type="text" inputMode="numeric" placeholder="0" value={deger}
        onChange={e => setDeger(e.target.value)}
        onFocus={() => { setOdak(true); setDeger(odenen ? String(Math.round(odenen)) : ""); }}
        onBlur={() => {
          setOdak(false);
          const ham = deger.replace(/\./g,"").replace(/,/g,"").replace(/[^0-9]/g,"");
          const sayi = ham ? Math.min(+ham, tutar) : 0;
          setDeger(sayi ? Number(sayi).toLocaleString("tr-TR") : "");
          onChange(sayi);
        }}
        style={{flex:1,minWidth:120,padding:"8px 11px",background:"#fff",border:"1px solid rgba(200,134,26,.4)",borderRadius:8,color:"#2d1a08",fontFamily:"inherit",fontSize:15,fontWeight:600}}
      />
      <span style={{fontSize:10,color:"#6b4423",whiteSpace:"nowrap"}}>TL gir, odagi kaldir</span>
    </div>
  );
}


/* = FOTO YUKLEME = */
async function imgbbYukle(dosya) {
  const fd = new FormData();
  fd.append("image", dosya);
  const r = await fetch("https://api.imgbb.com/1/upload?key=764ae37046cfd464d0ef1d746d933a22", {method:"POST",body:fd});
  const d = await r.json();
  if(!d.success) throw new Error("imgbb hata");
  return d.data.url;
}

/* Çoklu fotoğraf galerisi — maks 5 fotoğraf */
function FotoGaleri({fotolar, onChange}) {
  const liste = Array.isArray(fotolar) ? fotolar : (fotolar ? [fotolar] : []);
  const [yuklenen, setYuklenen] = React.useState({});   // {idx: true/false}
  const [buyuk,    setBuyuk]    = React.useState(null);  // büyük görüntüleme idx

  const yukle = async (e, idx) => {
    const dosya = e.target.files[0];
    if(!dosya) return;
    setYuklenen(p=>({...p,[idx]:"yukleniyor"}));
    try {
      const url = await imgbbYukle(dosya);
      const yeni = [...liste];
      if(idx < yeni.length) yeni[idx] = url;
      else yeni.push(url);
      onChange(yeni);
      setYuklenen(p=>({...p,[idx]:"tamam"}));
      setTimeout(()=>setYuklenen(p=>({...p,[idx]:null})), 2000);
    } catch {
      setYuklenen(p=>({...p,[idx]:"hata"}));
    }
  };

  const kaldir = (idx) => {
    const yeni = liste.filter((_,i)=>i!==idx);
    onChange(yeni);
  };

  const slotlar = [...liste];
  while(slotlar.length < 5) slotlar.push(null);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <label style={{fontSize:12,color:"#8a5c30",fontWeight:600}}>Fotoğraflar ({liste.length}/5)</label>
        <span style={{fontSize:10,color:"#6b4423"}}>Farklı açılardan çekin</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {slotlar.map((url, idx) => {
          const durum = yuklenen[idx];
          return (
            <div key={idx} style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",
              border:url?"2px solid #c8861a":"2px dashed rgba(200,134,26,.35)",
              background:url?"#f0e6d3":"rgba(200,134,26,.04)",cursor:"pointer"}}>
              {url ? (
                <>
                  <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                    onClick={()=>setBuyuk(idx)} onError={e=>e.target.style.opacity=0}/>
                  <button onClick={()=>kaldir(idx)}
                    style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,.6)",border:"none",
                      borderRadius:"50%",color:"#fff",fontSize:11,width:18,height:18,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>
                    ×
                  </button>
                </>
              ) : durum==="yukleniyor" ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%"}}>
                  <div style={{fontSize:16}}>⌛</div>
                </div>
              ) : (
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  height:"100%",cursor:"pointer",gap:2}}>
                  <input type="file" accept="image/*" capture="environment" onChange={e=>yukle(e,idx)}
                    style={{position:"absolute",opacity:0,inset:0,cursor:"pointer"}}/>
                  <span style={{fontSize:idx===0?20:16}}>📷</span>
                  <span style={{fontSize:8,color:"#8a5c30",textAlign:"center",lineHeight:1.2}}>
                    {idx===0?"Ana foto":`Açı ${idx+1}`}
                  </span>
                </label>
              )}
              {durum==="tamam"&&<div style={{position:"absolute",inset:0,background:"rgba(21,128,61,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✓</div>}
            </div>
          );
        })}
      </div>
      {/* Büyük görüntüleme overlay */}
      {buyuk!==null&&liste[buyuk]&&(
        <div onClick={()=>setBuyuk(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
          <img src={liste[buyuk]} alt="" style={{maxWidth:"100%",maxHeight:"90vh",objectFit:"contain",borderRadius:8}}/>
          <div style={{position:"absolute",top:12,right:12,display:"flex",gap:8}}>
            {liste.map((_,i)=>(
              <button key={i} onClick={e=>{e.stopPropagation();setBuyuk(i);}}
                style={{width:8,height:8,borderRadius:"50%",border:"none",padding:0,cursor:"pointer",
                  background:i===buyuk?"#c8861a":"rgba(255,255,255,.4)"}}/>
            ))}
          </div>
          <button onClick={()=>setBuyuk(null)} style={{position:"absolute",top:12,left:12,
            background:"rgba(255,255,255,.15)",border:"none",borderRadius:20,color:"#fff",
            fontSize:20,width:36,height:36,cursor:"pointer",padding:0}}>×</button>
        </div>
      )}
    </div>
  );
}

/* Tek fotoğraf — eski uyumluluk için */
function FotoYukle({mevcut, onChange}) {
  return <FotoGaleri fotolar={mevcut?[mevcut]:[]} onChange={liste=>onChange(liste[0]||"")}/>;
}

/* Detay modalında fotoğraf slider (proper bileşen — hook kuralları OK) */
function FotoSlider({fotograflar, tip, kategori}) {
  const [aktif, setAktif] = React.useState(0);
  const liste = fotograflar || [];
  if(liste.length===0) return (
    <div style={{height:100,background:"#f5efe6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>
      {tip==="buyukbas"?"🐂":kategori==="koyun"?"🐑":"🐐"}
    </div>
  );
  return (
    <div style={{position:"relative",background:"#1a0a00"}}>
      <div style={{height:"clamp(180px,45vw,250px)",overflow:"hidden"}}>
        <img src={liste[aktif]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
          onError={e=>e.target.style.opacity=0}/>
      </div>
      {liste.length>1&&(
        <>
          <button onClick={()=>setAktif(p=>(p-1+liste.length)%liste.length)}
            style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",color:"#fff",width:30,height:30,cursor:"pointer",fontSize:18,padding:0,display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation"}}>‹</button>
          <button onClick={()=>setAktif(p=>(p+1)%liste.length)}
            style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",border:"none",borderRadius:"50%",color:"#fff",width:30,height:30,cursor:"pointer",fontSize:18,padding:0,display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation"}}>›</button>
          <div style={{position:"absolute",bottom:6,left:0,right:0,display:"flex",justifyContent:"center",gap:5}}>
            {liste.map((_,i)=>(
              <button key={i} onClick={()=>setAktif(i)}
                style={{width:i===aktif?18:7,height:7,borderRadius:4,border:"none",background:i===aktif?"#c8861a":"rgba(255,255,255,.5)",cursor:"pointer",padding:0,transition:"width .2s,background .2s"}}/>
            ))}
          </div>
          <div style={{position:"absolute",top:6,right:8,background:"rgba(0,0,0,.5)",borderRadius:10,padding:"2px 7px",fontSize:10,color:"#fff"}}>{aktif+1}/{liste.length}</div>
        </>
      )}
      {liste.length>1&&(
        <div style={{display:"flex",gap:4,padding:"6px 8px",background:"rgba(0,0,0,.15)",overflowX:"auto"}}>
          {liste.map((url,i)=>(
            <img key={i} src={url} alt="" onClick={()=>setAktif(i)}
              style={{width:46,height:46,objectFit:"cover",borderRadius:5,cursor:"pointer",border:i===aktif?"2px solid #c8861a":"2px solid transparent",flexShrink:0,opacity:i===aktif?1:.7,transition:"opacity .15s"}}
              onError={e=>e.target.style.display="none"}/>
          ))}
        </div>
      )}
    </div>
  );
}



/* =
   ANA UYGULAMA
= */
export default function App() {
  const [hayvanlar,  setHayvanlar]  = useState([]);
  const [talepler,   setTalepler]   = useState([]);
  const [view,       setView]       = useState("public");
  const [admin,      setAdmin]      = useState(false);
  const [sifre,      setSifre]      = useState("");
  const [sifreErr,   setSifreErr]   = useState(false);
  const [yuklendi,   setYuklendi]   = useState(false);
  const [sbHata,     setSbHata]     = useState(false);
  const debTimer = useRef({});

  const hRef = useRef(hayvanlar);
  const tRef = useRef(talepler);
  useEffect(()=>{hRef.current=hayvanlar;},[hayvanlar]);
  useEffect(()=>{tRef.current=talepler;},[talepler]);

  /* İlk yükleme */
  useEffect(()=>{
    (async()=>{
      const [h,t] = await Promise.all([sbOku("hayvanlar"),sbOku("talepler")]);
      if (h && h.length>0) setHayvanlar(h);
      if (t && t.length>0) setTalepler(t);
      setSbHata(!h && !t);
      setYuklendi(true);
    })();
  },[]);

  /* Supabase'e anlık kaydet - debounce 600ms */
  const sbKaydet = useCallback((key,val)=>{
    clearTimeout(debTimer.current[key]);
    debTimer.current[key] = setTimeout(()=>{ sbYaz(key,val).catch(()=>setSbHata(true)); },600);
  },[]);

  useEffect(()=>{ if(yuklendi) sbKaydet("hayvanlar",hayvanlar); },[hayvanlar,yuklendi]);
  useEffect(()=>{ if(yuklendi) sbKaydet("talepler",talepler);   },[talepler,yuklendi]);

  const yenile = useCallback(async()=>{
    const [h,t] = await Promise.all([sbOku("hayvanlar"),sbOku("talepler")]);
    if(h) setHayvanlar(h);
    if(t) setTalepler(t);
  },[]);

  /* Auth */
  const giris = ()=>{
    if(sifre===ADMIN_PASSWORD){
      setAdmin(true);setView("admin");setSifreErr(false);setSifre("");
      // Admin girişinde taze veri çek
      (async()=>{
        const [h,t] = await Promise.all([sbOku("hayvanlar"),sbOku("talepler")]);
        if(h) setHayvanlar(h);
        if(t) setTalepler(t);
      })();
    } else setSifreErr(true);
  };

  // Admin paneldeyken 20 saniyede bir taze veri çek
  useEffect(()=>{
    if(!admin) return;
    const id = setInterval(async()=>{
      const [h,t] = await Promise.all([sbOku("hayvanlar"),sbOku("talepler")]);
      if(h) setHayvanlar(h);
      if(t) setTalepler(t);
    }, 20000);
    return ()=>clearInterval(id);
  },[admin]);

  /* Veri işlemleri */
  const onayla = (tid, ekBilgi={})=>{
    const t=tRef.current.find(x=>x.id===tid); if(!t) return;
    const h=hRef.current.find(x=>x.id===t.hayvanId);
    const bos=h?h.maxHisse-h.hisseler.filter(x=>x.durum==="onaylı").length:0;
    if(!h||bos<=0){alert("Boş yer kalmadı!");return;}
    const yh={id:uid(),hayvanId:t.hayvanId,ad:t.ad,telefon:t.telefon,tutar:t.tutar,
      odenen:0,vekalet:ekBilgi.vekalet||false,teslimat:ekBilgi.teslimat||"belirtilmedi",
      acilIrtibat:ekBilgi.acilIrtibat||"",acilTelefon:ekBilgi.acilTelefon||"",not:ekBilgi.not||"",
      durum:"onaylı",tarih:zaman()};
    setHayvanlar(p=>p.map(x=>x.id===t.hayvanId?{...x,hisseler:[...x.hisseler,yh]}:x));
    setTalepler(p=>p.map(x=>x.id===tid?{...x,durum:"onaylı"}:x));
    const teslimTxt={ev:"Eve teslim",arac:"Aracla teslim",ciftlik:"Ciftlikte teslim",diger:"Belirtilen adrese",belirtilmedi:"Detay icin iletisime geciniz"};
    const onayMesaj = `HISSE ONAYI\n\nSayin ${t.ad},\nKurban hisseniz onaylanmistir.\n\nHayvan: #${h.numara||""}\nHisse bedeli: ${new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(t.tutar)}\nVekalet: ${ekBilgi.vekalet?"Alindi":"Alinmadi - lutfen iletisime gecin"}\nTeslimat: ${teslimTxt[ekBilgi.teslimat]||"Belirtilmedi"}${ekBilgi.not?"\nNot: "+ekBilgi.not:""}\n\nHayirli kurbanlar olsun\nMurat Yalvac Ogrenci Yurdu`;
    setTimeout(()=>waGonder(t.telefon, onayMesaj), 400);
  };
  const reddet    = (tid)     => setTalepler(p=>p.map(x=>x.id===tid?{...x,durum:"reddedildi"}:x));
  const ekleH     = (h)       => setHayvanlar(p=>[...p,{...h,id:uid(),hisseler:[],durum:"aktif"}]);
  const guncH     = (id,d)    => setHayvanlar(p=>p.map(x=>x.id===id?{...x,...d}:x));
  const silH      = (id)      => { if(window.confirm("Bu hayvanı silmek istiyor musunuz?")) setHayvanlar(p=>p.filter(x=>x.id!==id)); };
  const silHisse  = (hid,xid) => setHayvanlar(p=>p.map(h=>h.id===hid?{...h,hisseler:h.hisseler.filter(x=>x.id!==xid)}:h));
  const talepTemizle = () => setTalepler(p=>p.filter(x=>x.durum==="bekliyor"));
  const durumH    = (id,d)    => setHayvanlar(p=>p.map(x=>x.id===id?{...x,durum:d}:x));

  const hisseDirekt = (hayvanId, bilgi)=>{
    const h=hRef.current.find(x=>x.id===hayvanId);
    if(!h) return false;
    const bos=h.maxHisse-h.hisseler.filter(x=>x.durum==="onaylı").length;
    if(bos<=0){alert("Bu hayvanda boş yer kalmadı!");return false;}
    const tutar=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
    const yeniHisse={id:uid(),hayvanId,ad:bilgi.ad,telefon:bilgi.telefon,tutar,odenen:0,
      vekalet:bilgi.vekalet||false,teslimat:bilgi.teslimat||"belirtilmedi",
      acilIrtibat:bilgi.acilIrtibat||"",acilTelefon:bilgi.acilTelefon||"",not:bilgi.not||"",
      durum:"onaylı",tarih:zaman()};
    setHayvanlar(p=>p.map(x=>x.id===hayvanId?{...x,hisseler:[...x.hisseler,yeniHisse]}:x));
    return true;
  };
  const odemeGuncelle = (hayvanId, hisseId, odenen) => {
    setHayvanlar(p=>p.map(h=>h.id===hayvanId
      ? {...h,hisseler:h.hisseler.map(x=>x.id===hisseId?{...x,odenen:+odenen}:x)}
      : h));
  };

  /* Talep gönder - Supabase'e ANINDA yaz */
  const talepGonder = async (t)=>{
    const h=hRef.current.find(x=>x.id===t.hayvanId);
    const bek=tRef.current.filter(x=>x.hayvanId===t.hayvanId&&x.durum==="bekliyor").length;
    if(!h) return false;
    const bos=h.maxHisse-h.hisseler.filter(x=>x.durum==="onaylı").length;
    if(bos<=0||bos-bek<=0) return false;
    const yeniTalep={...t,id:uid(),tarih:zaman(),durum:"bekliyor"};
    const yeniListe=[...tRef.current,yeniTalep];
    setTalepler(yeniListe);
    /* Anlık Supabase yazma - debounce'suz */
    try { await sbYaz("talepler",yeniListe); } catch{}
    /* Yoneticiye WA bildirimi */
    const hBilgi = hRef.current.find(x=>x.id===t.hayvanId);
    const waMesaj = `YENI HISSE TALEBi\n\nAd: ${t.ad}\nTel: ${t.telefon}\nHayvan: #${hBilgi?.numara||""}\nTutar: ${new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(t.tutar)}\n${new Date().toLocaleString("tr-TR")}\n\nOnaylamak icin yonetici paneline giris yapin.`;
    setTimeout(()=>waGonder(WA_YONETICI, waMesaj), 400);
    return true;
  };

  if(!yuklendi) return (
    <div style={{minHeight:"100vh",background:"#f5efe6",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
      <div style={{fontSize:48,marginBottom:14}}></div>
      <div style={{fontSize:15,color:"#92400e",marginBottom:6}}>Veriler yükleniyor...</div>
      <div style={{fontSize:11,color:"#6b4423"}}>Supabase bağlantısı kuruluyor</div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {sbHata&&<div style={{background:"#7f1d1d",color:"#fca5a5",fontSize:11,textAlign:"center",padding:"5px",fontFamily:FONT}}> Bağlantı sorunu - veriler geçici olarak çevrimdışı saklanıyor</div>}
      {view==="login" && <LoginPanel sifre={sifre} setSifre={setSifre} err={sifreErr} onGiris={giris} onGeri={()=>setView("public")}/>}
      {view==="admin" && admin && <AdminPanel hayvanlar={hayvanlar} talepler={talepler} onOnayla={onayla} onReddet={reddet} onEkleH={ekleH} onGuncH={guncH} onSilH={silH} onSilHisse={silHisse} onDurum={durumH} onHisseDirekt={hisseDirekt} onOdeme={odemeGuncelle} onCikis={()=>{setAdmin(false);setView("public");}} onYenile={yenile} onTalepTemizle={talepTemizle} sbHata={sbHata}/>}
      {(view==="public"||(view==="admin"&&!admin)) && <PublicPanel hayvanlar={hayvanlar} talepler={talepler} onTalep={talepGonder} onAdmin={()=>setView("login")}/>}
    </>
  );
}

/* =
   PUBLIC PANEL
= */
function PublicPanel({hayvanlar,talepler,onTalep,onAdmin}) {
  const [detay,      setDetay]      = useState(null);
  const [talepModal, setTalepModal] = useState(null);
  const [form,       setForm]       = useState({ad:"",telefon:""});
  const [mesaj,      setMesaj]      = useState(null);
  const [filtre,     setFiltre]     = useState("hepsi");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [sekme,      setSekme]      = useState("hayvanlar");

  const aktif = hayvanlar
    .filter(h=>{
      if(h.durum!=="aktif") return false;
      if(!h.bagisCurban && getBos(h)<=0) return false;
      if(filtre==="hepsi") return true;
      if(filtre==="bagis") return h.bagisCurban;
      if(filtre==="buyukbas") return h.tip==="buyukbas"&&!h.bagisCurban;
      if(filtre==="kucukbas") return h.tip==="kucukbas"&&!h.bagisCurban;
      return true;
    })
    .sort((a,b)=>a.kesimSirasi-b.kesimSirasi);

  const toast = (tip,metin)=>{ setMesaj({tip,metin}); setTimeout(()=>setMesaj(null),5000); };

  const gonder = async ()=>{
    if(!form.ad.trim()||!form.telefon.trim()){toast("hata","Ad ve telefon zorunludur.");return;}
    setGonderiyor(true);
    try {
      const h=hayvanlar.find(x=>x.id===talepModal.id);
      const tutar=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
      const ok=await onTalep({hayvanId:h.id,ad:form.ad.trim(),telefon:form.telefon.trim(),tutar});
      if(ok){
        toast("ok",` Talebiniz alındı! ${formatTL(tutar)} - Yönetici onayı bekleniyor.`);
        setForm({ad:"",telefon:""});setTalepModal(null);setDetay(null);
      } else {
        toast("hata","Yer kalmadı veya talep gönderilemedi.");
      }
    } finally { setGonderiyor(false); }
  };

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(180deg,#6b1010,#8b1a1a)",borderBottom:"3px solid #c8861a",position:"relative",padding:"18px 16px 14px",textAlign:"center"}}>
        <button onClick={onAdmin} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.25)",borderRadius:8,color:"#fff8f0",fontSize:11,fontWeight:600,padding:"6px 12px",cursor:"pointer",fontFamily:FONT,touchAction:"manipulation",whiteSpace:"nowrap"}}>⚙ Yönetici</button>
        <div style={{fontSize:"clamp(28px,7vw,40px)",lineHeight:1,marginBottom:6}}>🐂</div>
        <h1 style={{margin:"0 0 2px",fontSize:"clamp(15px,4vw,22px)",fontWeight:700,color:"#fff8f0",letterSpacing:1,fontFamily:FONT}}>MURAT YALVAÇ ÖĞRENCİ YURDU</h1>
        <div style={{fontSize:"clamp(10px,2.5vw,13px)",color:"rgba(255,220,180,.8)",letterSpacing:2,marginBottom:12}}>KURBAN ORGANİZASYONU 2026</div>
        <div style={{display:"flex",justifyContent:"center",gap:"clamp(16px,6vw,48px)"}}>
          {[
            {lbl:"Hayvan",val:hayvanlar.filter(h=>h.durum==="aktif").length},
            {lbl:"Dolu Hisse",val:hayvanlar.reduce((a,h)=>a+h.hisseler.filter(x=>x.durum==="onaylı").length,0)},
            {lbl:"Boş Hisse",val:hayvanlar.reduce((a,h)=>a+(h.durum==="aktif"?getBos(h):0),0)},
          ].map(s=>(
            <div key={s.lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:"clamp(20px,5.5vw,30px)",fontWeight:700,color:"#fff",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:"clamp(9px,2.2vw,11px)",color:"rgba(255,220,180,.75)",marginTop:3,letterSpacing:.5}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>


      <div className="icerik">
        {/* SEKME NAVİGASYONU */}
        <div className="sbar" style={{marginBottom:14,borderRadius:10,overflow:"hidden"}}>
          {[["hayvanlar","🐂 Hayvanlar"],["kesimhane","🔪 Kesimhane"],["bilgi","📖 Bilgi & İbadet"],["bagis","🤲 Bağış Kurbanı"]].map(([k,l])=>(
            <button key={k} className="sbtn" onClick={()=>setSekme(k)}
              style={{borderBottomColor:sekme===k?"#8b1a1a":"transparent",color:sekme===k?"#8b1a1a":"#4a2810",fontWeight:sekme===k?700:400}}>
              {l}
            </button>
          ))}
        </div>

        {/* HAYVANLAR SEKMESİ */}
        {sekme==="hayvanlar"&&<>
        {/* FİLTRE */}
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[["hepsi","Tümü"],["buyukbas","Büyükbaş"],["kucukbas","Küçükbaş"],["bagis","🤲 Bağış"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFiltre(k)} style={{padding:"6px 14px",borderRadius:20,border:filtre===k?"2px solid #8b1a1a":"1px solid rgba(139,26,26,.25)",background:filtre===k?"rgba(139,26,26,.1)":"transparent",color:filtre===k?"#8b1a1a":"#4a2810",cursor:"pointer",fontSize:"clamp(11px,3vw,13px)",fontFamily:FONT,touchAction:"manipulation"}}>{l}</button>
          ))}
        </div>

        {/* KARTLAR */}
        {aktif.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px",color:"#6b4423"}}>
            <div style={{fontSize:44}}></div>
            <p style={{fontSize:15,color:"#4a2810",margin:"10px 0 4px"}}>Henüz hayvan eklenmemiş.</p>
            <p style={{fontSize:12}}>Yönetici onaylı hayvanlar burada görünecek.</p>
          </div>
        ):(
          <div className="hgrid">
            {aktif.map(h=>{
              const bos=getBos(h),dolu=h.maxHisse-bos;
              const bek=talepler.filter(t=>t.hayvanId===h.id&&t.durum==="bekliyor").length;
              const hT=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
              return (
                <div key={h.id} className="hkart" onClick={()=>setDetay(h)} style={{...S.card,overflow:"hidden"}}>
                  {(()=>{const fotoList=h.fotolar&&h.fotolar.length>0?h.fotolar:(h.foto?[h.foto]:[]);const anaFoto=fotoList[0];return anaFoto
                    ?<div style={{height:"clamp(130px,35vw,170px)",overflow:"hidden",background:"#f0e6d3",position:"relative"}}><img src={anaFoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>{fotoList.length>1&&<div style={{position:"absolute",bottom:5,right:7,background:"rgba(0,0,0,.55)",borderRadius:10,padding:"2px 7px",fontSize:9,color:"#fff"}}>📷 {fotoList.length}</div>}</div>
                    :<div style={{height:80,background:"rgba(200,134,26,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38}}>{h.tip==="buyukbas"?"🐂":h.kategori==="koyun"?"🐑":"🐐"}</div>;})()}
                  <div style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
                      <div style={{display:"inline-block",background:h.tip==="buyukbas"?"#8b1a1a":"#14532d",padding:"1px 9px",borderRadius:20,fontSize:9,color:"#fff8f0"}}>
                        {h.tip==="buyukbas"?" BÜYÜKBAŞ":` ${(h.kategori||"").toUpperCase()}`}
                      </div>
                      {h.bagisCurban&&<div style={{display:"inline-block",background:"#92400e",padding:"1px 9px",borderRadius:20,fontSize:9,color:"#fff8f0"}}>🤲 BAĞIŞ</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:7,marginBottom:2}}>
                      <span style={{fontSize:"clamp(17px,4.5vw,22px)",fontWeight:700,color:"#8b1a1a"}}>#{h.numara}</span>
                      <span style={{fontSize:"clamp(10px,2.5vw,12px)",color:"#4a2810"}}>Kesim: {h.kesimSirasi}. sıra</span>
                    </div>
                    <div style={{fontSize:"clamp(15px,4vw,19px)",fontWeight:700,color:"#8b1a1a"}}>{formatTL(hT)}<span style={{fontSize:10,fontWeight:400,color:"#4a2810"}}>/hisse</span></div>
                    {h.tip==="buyukbas"&&<div style={{fontSize:10,color:"#6b4423"}}>Toplam: {formatTL(h.fiyat)}</div>}
                    {!h.bagisCurban&&<div style={{marginTop:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4a2810",marginBottom:2}}>
                        <span>{dolu}/{h.maxHisse} dolu</span>
                        <span style={{color:"#15803d",fontWeight:700}}>{bos} boş</span>
                      </div>
                      <div style={{display:"flex",gap:3}}>
                        {Array.from({length:h.maxHisse}).map((_,i)=>(
                          <div key={i} style={{flex:1,height:6,borderRadius:3,background:i<dolu?"#8b1a1a":i<dolu+bek?"#d4a017":"rgba(200,134,26,.15)"}}/>
                        ))}
                      </div>
                      {bek>0&&<div style={{fontSize:9,color:"#92400e",marginTop:2}}>{bek} bekleyen talep</div>}
                    </div>}
                    {h.bagisCurban&&<div style={{marginTop:8,fontSize:11,color:"#92400e",fontWeight:600}}>🤲 Bağış Kurbanı</div>}
                    <div style={{marginTop:6,textAlign:"center",fontSize:11,color:"#8a5c30"}}>Detay için tıkla →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </>}

        {/* KESİMHANE SEKMESİ */}
        {sekme==="kesimhane"&&(
          <div>
            <h2 style={{color:"#8b1a1a",fontFamily:FONT,fontSize:"clamp(16px,4vw,20px)",margin:"0 0 4px"}}>Kesim Tesisimiz</h2>
            <p style={{color:"#6b4423",fontSize:13,margin:"0 0 16px"}}>Modern hijyen standartlarında, veteriner denetiminde kesim hizmeti</p>
            {/* Görsel alanı */}
            <div style={{borderRadius:14,overflow:"hidden",background:"#1a0a00",marginBottom:14,border:"2px solid #c8861a",minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src="https://i.ibb.co/placeholder" alt="Kesimhane" style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}}
                onError={e=>{e.target.parentNode.innerHTML='<div style="padding:40px;text-align:center;color:#c8861a"><div style="font-size:48px;margin-bottom:12px">🔪</div><div style="font-size:14px;font-weight:600">Kesimhane görseli yakında eklenecek</div><div style="font-size:11px;margin-top:6px;color:rgba(200,134,26,.6)">Yönetici panelinden güncelleyebilirsiniz</div></div>';}}/>
            </div>
            {/* Özellikler */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:16}}>
              {[
                {ikon:"🏥",baslik:"Veteriner Denetimi",acik:"Her hayvan kesim öncesi veteriner kontrolünden geçer"},
                {ikon:"🧼",baslik:"Hijyen Standartları",acik:"Uluslararası gıda güvenliği standartlarına uygun tesis"},
                {ikon:"❄️",baslik:"Soğuk Zincir",acik:"Kesim sonrası et soğuk zincirde muhafaza edilir"},
                {ikon:"🩸",baslik:"Helal Kesim",acik:"Besmele ile usulüne uygun İslami kesim uygulanır"},
                {ikon:"📜",baslik:"Vekâlet Belgesi",acik:"İsteyen hissedarlara vekâlet belgesi düzenlenir"},
                {ikon:"🚗",baslik:"Eve Teslimat",acik:"Kıyma ve parça şeklinde ev adresinize teslim"},
              ].map(f=>(
                <div key={f.baslik} style={{background:"#fff",border:"1px solid rgba(200,134,26,.2)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{f.ikon}</div>
                  <div style={{fontWeight:700,fontSize:13,color:"#8b1a1a",marginBottom:3}}>{f.baslik}</div>
                  <div style={{fontSize:11,color:"#6b4423",lineHeight:1.5}}>{f.acik}</div>
                </div>
              ))}
            </div>
            {/* Konum */}
            <div style={{background:"#fff",border:"1px solid rgba(200,134,26,.2)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
              <div style={{background:"linear-gradient(90deg,#8b1a1a,#9b1c1c)",padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>📍</span>
                <span style={{color:"#fff8f0",fontWeight:700,fontSize:14}}>Kesim Yeri & Konum</span>
              </div>
              <div style={{padding:"14px"}}>
                <p style={{margin:"0 0 8px",color:"#2d1a08",fontWeight:600,fontSize:13}}>Murat Yalvaç Öğrenci Yurdu Kesim Tesisi</p>
                <p style={{margin:"0 0 10px",color:"#6b4423",fontSize:12,lineHeight:1.6}}>Aliağa, İzmir — Adres bilgisi için yönetici ile iletişime geçiniz.</p>
                <a href="https://maps.google.com/?q=Aliaga+Izmir" target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",background:"linear-gradient(90deg,#7a1a1a,#b91c1c)",border:"none",borderRadius:8,color:"#fff",textDecoration:"none",fontSize:12,fontWeight:600}}>
                  🗺 Google Maps'te Görüntüle
                </a>
              </div>
            </div>
          </div>
        )}

        {/* BİLGİ & İBADET SEKMESİ */}
        {sekme==="bilgi"&&(
          <div>
            <h2 style={{color:"#8b1a1a",fontFamily:FONT,fontSize:"clamp(16px,4vw,20px)",margin:"0 0 4px"}}>Kurban İbadeti</h2>
            <p style={{color:"#6b4423",fontSize:13,margin:"0 0 16px"}}>Kur'an-ı Kerim ve Sünnet'ten kurban ibadeti hakkında bilgiler</p>
            {/* Ayet-i Kerimeler */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:4,height:28,background:"#c8861a",borderRadius:2}}/>
                <h3 style={{margin:0,color:"#8b1a1a",fontSize:15,fontFamily:FONT}}>Ayet-i Kerimeler</h3>
              </div>
              {[
                {
                  arapca:"فَصَلِّ لِرَبِّكَ وَانْحَرْ",
                  meal:"Rabbin için namaz kıl ve kurban kes.",
                  kaynak:"Kevser Suresi, 2. Ayet"
                },
                {
                  arapca:"وَالْبُدْنَ جَعَلْنَاهَا لَكُم مِّن شَعَائِرِ اللَّهِ",
                  meal:"Kurbanlık büyükbaş hayvanları, sizin için Allah'ın dininin nişanelerinden kıldık.",
                  kaynak:"Hac Suresi, 36. Ayet"
                },
                {
                  arapca:"لَن يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِن يَنَالُهُ التَّقْوَىٰ مِنكُمْ",
                  meal:"Onların etleri ve kanları Allah'a ulaşmaz; fakat O'na sizin takvânız ulaşır.",
                  kaynak:"Hac Suresi, 37. Ayet"
                },
              ].map((a,i)=>(
                <div key={i} style={{background:"linear-gradient(135deg,#fdf9f0,#fdf3e3)",border:"1px solid rgba(200,134,26,.25)",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                  <p style={{margin:"0 0 8px",fontSize:"clamp(16px,4vw,20px)",color:"#8b1a1a",fontFamily:"'Amiri',serif",textAlign:"right",lineHeight:1.8,direction:"rtl"}}>{a.arapca}</p>
                  <p style={{margin:"0 0 6px",color:"#2d1a08",fontSize:13,lineHeight:1.6,fontStyle:"italic"}}>"{a.meal}"</p>
                  <span style={{fontSize:10,color:"#92400e",fontWeight:600,background:"rgba(139,26,26,.08)",padding:"2px 8px",borderRadius:20}}>{a.kaynak}</span>
                </div>
              ))}
            </div>
            {/* Hadis-i Şerifler */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:4,height:28,background:"#c8861a",borderRadius:2}}/>
                <h3 style={{margin:0,color:"#8b1a1a",fontSize:15,fontFamily:FONT}}>Hadis-i Şerifler</h3>
              </div>
              {[
                {
                  metin:"Kurban kesen kimse, kurbanının ilk kanı yere düştüğünde mağfirete kavuşur.",
                  kaynak:"Tirmizî, Edâhî, 1"
                },
                {
                  metin:"Kim imkânı olduğu halde kurban kesmezse, namazgahımıza yaklaşmasın!",
                  kaynak:"İbn Mâce, Edâhî, 2"
                },
                {
                  metin:"Ademoğlu kurban bayramı günü Allah'a kurban kesmekten daha sevimli bir amel işleyemez. Zira kurban, kıyamet gününde kendi boynuzları, kılları ve tırnakları ile gelecektir.",
                  kaynak:"Tirmizî, Edâhî, 1"
                },
              ].map((h,i)=>(
                <div key={i} style={{background:"#fff",border:"1px solid rgba(139,26,26,.12)",borderRadius:12,padding:"14px 16px",marginBottom:10,borderLeft:"3px solid #8b1a1a"}}>
                  <p style={{margin:"0 0 6px",color:"#2d1a08",fontSize:13,lineHeight:1.7,fontStyle:"italic"}}>"{h.metin}"</p>
                  <span style={{fontSize:10,color:"#92400e",fontWeight:600}}>📚 {h.kaynak}</span>
                </div>
              ))}
            </div>
            {/* Kurban Hakkında Bilgi */}
            <div style={{background:"linear-gradient(135deg,rgba(139,26,26,.05),rgba(200,134,26,.05))",border:"1px solid rgba(200,134,26,.2)",borderRadius:12,padding:"16px"}}>
              <h4 style={{margin:"0 0 10px",color:"#8b1a1a",fontSize:14,fontFamily:FONT}}>📋 Kurban İbadeti Hakkında</h4>
              {[
                ["Kurban kime vaciptir?","Akıl baliğ, mukim ve nisap miktarı mala sahip her Müslümana vaciptir."],
                ["Büyükbaş kaç kişilik?","Büyükbaş (sığır, deve) 7 kişiye kadar ortak kesilebilir. Küçükbaş (koyun, keçi) tek kişiliktir."],
                ["Kurban kesim günleri","Kurban Bayramının 1., 2. ve 3. günleri (10-12 Zilhicce) kurban kesilebilir."],
                ["Vekâlet nedir?","Kendiniz yerine başkasına kurban kestirmenize vekâlet denir. Bizden vekâlet hizmeti alabilirsiniz."],
              ].map(([s,c])=>(
                <div key={s} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid rgba(200,134,26,.1)"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#8b1a1a",marginBottom:2}}>• {s}</div>
                  <div style={{fontSize:12,color:"#4a2810",lineHeight:1.6}}>{c}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BAĞIŞ KURBANI SEKMESİ */}
        {sekme==="bagis"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#8b1a1a,#92400e)",borderRadius:14,padding:"clamp(16px,4vw,24px)",marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:"clamp(36px,10vw,52px)",marginBottom:8}}>🤲</div>
              <h2 style={{margin:"0 0 6px",color:"#fff8f0",fontFamily:FONT,fontSize:"clamp(17px,4.5vw,22px)"}}>Bağış Kurbanlarımız</h2>
              <p style={{margin:0,color:"rgba(255,220,180,.85)",fontSize:"clamp(12px,3vw,14px)",lineHeight:1.6}}>Muhtaç öğrencilerimiz için kesilen kurbanlar, bir yıl boyunca ihtiyaçları olan hayvansal protein ihtiyacını karşılar.</p>
            </div>
            <div style={{background:"#fff",border:"1px solid rgba(200,134,26,.2)",borderRadius:12,padding:"16px",marginBottom:12}}>
              <h3 style={{margin:"0 0 10px",color:"#8b1a1a",fontFamily:FONT,fontSize:15}}>Ne Yapıyoruz?</h3>
              {[
                {ikon:"🐂",baslik:"Hayır Sahibinden Kurban",acik:"Hayır sahipleri adına kurban alınır, kesimleri vekâleten gerçekleştirilir."},
                {ikon:"❄️",baslik:"Dondurularak Muhafaza",acik:"Kesilen et, soğuk zincirde hijyenik şekilde saklanır ve porsiyonlanır."},
                {ikon:"🎓",baslik:"Öğrencilere Ulaştırılır",acik:"Yurdumuzda kalan öğrencilere aylık düzenli et dağıtımı yapılır."},
                {ikon:"📅",baslik:"Yıl Boyunca Tüketim",acik:"Bir kurban, yaklaşık 12 öğrencinin aylık et ihtiyacını 1 ay karşılar."},
              ].map(f=>(
                <div key={f.baslik} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(200,134,26,.08)"}}>
                  <div style={{fontSize:28,flexShrink:0,lineHeight:1}}>{f.ikon}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"#8b1a1a",marginBottom:2}}>{f.baslik}</div>
                    <div style={{fontSize:12,color:"#4a2810",lineHeight:1.6}}>{f.acik}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"linear-gradient(135deg,#fdf9f0,#fdf3e3)",border:"1px solid rgba(200,134,26,.25)",borderRadius:12,padding:"16px",marginBottom:12}}>
              <h4 style={{margin:"0 0 8px",color:"#8b1a1a",fontSize:14,fontFamily:FONT}}>✨ Siz de Bağış Kurbanı Sahiplenin</h4>
              <p style={{margin:"0 0 10px",color:"#4a2810",fontSize:12,lineHeight:1.7}}>
                Bağış kurbanı sahiplenmek için yönetici ile iletişime geçiniz. Kurbanınız kesilir, 
                etiyle birlikte vekâlet belgesi düzenlenir ve etler yurt öğrencilerimize dağıtılır. 
                Allah sizin adınıza kabul etsin.
              </p>
              {[
                {say:"200+",lbl:"Öğrenci Yararlandı"},
                {say:"50+",lbl:"Hayır Sahibi"},
                {say:"%100",lbl:"Şeffaf Süreç"},
              ].map(s=>(
                <div key={s.lbl} style={{display:"inline-block",textAlign:"center",marginRight:16,marginTop:4}}>
                  <div style={{fontSize:20,fontWeight:800,color:"#8b1a1a"}}>{s.say}</div>
                  <div style={{fontSize:10,color:"#6b4423"}}>{s.lbl}</div>
                </div>
              ))}
            </div>
            {/* Bağış kurbanı olan hayvanlar */}
            {hayvanlar.filter(h=>h.durum==="aktif"&&h.bagisCurban).length>0&&(
              <div>
                <h4 style={{margin:"0 0 10px",color:"#8b1a1a",fontSize:14,fontFamily:FONT}}>🐂 Aktif Bağış Kurbanları</h4>
                {hayvanlar.filter(h=>h.durum==="aktif"&&h.bagisCurban).map(h=>(
                  <div key={h.id} style={{background:"#fff",border:"1px solid rgba(200,134,26,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>{h.tip==="buyukbas"?"🐂":h.kategori==="koyun"?"🐑":"🐐"}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#8b1a1a"}}>#{h.numara} Nolu Hayvan</div>
                      <div style={{fontSize:11,color:"#6b4423"}}>Kesim Sırası: {h.kesimSirasi}. hayvan — {formatTL(h.fiyat)}</div>
                    </div>
                    <div style={{marginLeft:"auto",background:"rgba(139,26,26,.1)",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#8b1a1a",fontWeight:600,whiteSpace:"nowrap"}}>🤲 BAĞIŞ</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:"center",margin:"32px 0 8px",padding:"16px 12px",borderTop:"1px solid rgba(200,134,26,.12)"}}>
          <div style={{fontSize:11,color:"#92400e"}}>Murat Yalvaç Öğrenci Yurdu — Kurban Organizasyonu 2026</div>
        </div>
      </div>

      {/* TOAST */}
      {mesaj&&(
        <div style={{position:"fixed",bottom:"max(16px,env(safe-area-inset-bottom))",left:"50%",transform:"translateX(-50%)",background:mesaj.tip==="ok"?"#14532d":"#991b1b",border:`1px solid ${mesaj.tip==="ok"?"#4ade80":"#f87171"}`,color:"#fff",padding:"11px 18px",borderRadius:10,maxWidth:"92vw",textAlign:"center",zIndex:400,fontSize:"clamp(11px,3vw,13px)",boxShadow:"0 4px 20px rgba(0,0,0,.6)",wordBreak:"break-word"}}>
          {mesaj.metin}
        </div>
      )}

      {/* DETAY MODAL */}
      {detay&&(()=>{
        const h=hayvanlar.find(x=>x.id===detay.id)||detay;
        const bos=getBos(h),dolu=h.maxHisse-bos;
        const bek=talepler.filter(t=>t.hayvanId===h.id&&t.durum==="bekliyor").length;
        const hT=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
        const efBos=bos-bek;
        return (
          <div className="modal-bg" onClick={()=>setDetay(null)}>
            <div className="modal-kart" onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(0,0,0,.12)"}}/></div>
              <FotoSlider fotograflar={h.fotolar&&h.fotolar.length>0?h.fotolar:(h.foto?[h.foto]:[])} tip={h.tip} kategori={h.kategori}/>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{display:"inline-block",background:h.tip==="buyukbas"?"#8b1a1a":"#14532d",padding:"1px 9px",borderRadius:20,fontSize:9,color:"#fff",marginBottom:5}}>
                      {h.tip==="buyukbas"?" BÜYÜKBAŞ":` ${(h.kategori||"").toUpperCase()}`}
                    </div>
                    <h2 style={{margin:"0 0 1px",color:"#92400e",fontSize:"clamp(17px,4.5vw,22px)",fontFamily:FONT}}>#{h.numara} Nolu Hayvan</h2>
                    <p style={{margin:0,color:"#4a2810",fontSize:"clamp(11px,3vw,13px)"}}>Kesim Sırası: {h.kesimSirasi}. hayvan{(()=>{const ks=kesimSaati(h.kesimSirasi);return ks?` — yaklaşık saat ${ks.metin}`:""})()}</p>
                    {h.kupeNo&&<p style={{margin:"2px 0 0",color:"#8b1a1a",fontSize:"clamp(10px,2.5vw,12px)",fontWeight:600}}>🏷 Küpe No: {h.kupeNo}</p>}
                  </div>
                  <button onClick={()=>setDetay(null)} style={{background:"none",border:"none",color:"#4a2810",fontSize:22,cursor:"pointer",padding:"2px 6px",touchAction:"manipulation"}}></button>
                </div>
                <div className="dgrid">
                  {[
                    {lbl:"HİSSE BEDELİ",val:formatTL(hT),renk:"#8b1a1a",bg:"rgba(139,26,26,.08)",br:"rgba(139,26,26,.25)"},
                    {lbl:"BOŞ YER",val:efBos>0?efBos:"DOLU",renk:efBos>0?"#15803d":"#dc2626",bg:efBos>0?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",br:efBos>0?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"},
                    {lbl:"KESİM SIRASI",val:`${h.kesimSirasi}.`,renk:"#2d1a08",bg:"rgba(122,46,14,.06)",br:"rgba(122,46,14,.15)"},
                    {lbl:"TOPLAM HİSSE",val:`${dolu}/${h.maxHisse}`,renk:"#2d1a08",bg:"rgba(122,46,14,.06)",br:"rgba(122,46,14,.15)"},
                  ].map(x=>(
                    <div key={x.lbl} style={{background:x.bg,border:`1px solid ${x.br}`,borderRadius:9,padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:8,color:"#4a2810",marginBottom:3,letterSpacing:1}}>{x.lbl}</div>
                      <div style={{fontSize:"clamp(14px,3.5vw,17px)",fontWeight:700,color:x.renk}}>{x.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4a2810",marginBottom:2}}>
                    <span>Doluluk</span>
                    {bek>0&&<span style={{color:"#92400e"}}> {bek} bekleyen</span>}
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {Array.from({length:h.maxHisse}).map((_,i)=>(
                      <div key={i} style={{flex:1,height:8,borderRadius:4,background:i<dolu?"#8b1a1a":i<dolu+bek?"#d4a017":"#e8d5b7"}}/>
                    ))}
                  </div>
                </div>
                {h.aciklama&&(
                  <div style={{background:"rgba(200,134,26,.07)",border:"1px solid rgba(212,160,23,.12)",borderRadius:8,padding:"9px 12px",marginBottom:12}}>
                    <div style={{fontSize:8,color:"#4a2810",marginBottom:3,letterSpacing:1}}> AÇIKLAMA</div>
                    <p style={{margin:0,fontSize:"clamp(11px,3vw,13px)",color:"#c8b88a",lineHeight:1.7}}>{h.aciklama}</p>
                  </div>
                )}
                {h.bagisCurban
                  ?<div style={{textAlign:"center",padding:"14px",background:"linear-gradient(135deg,rgba(146,64,14,.08),rgba(139,26,26,.06))",borderRadius:10,border:"1px solid rgba(146,64,14,.2)"}}>
                    <div style={{fontSize:20,marginBottom:6}}>🤲</div>
                    <div style={{fontWeight:700,color:"#92400e",fontSize:14,marginBottom:3}}>Bağış Kurbanı</div>
                    <div style={{fontSize:12,color:"#6b4423"}}>Bu kurban bağış olarak ayrılmıştır.<br/>Hisse alınamaz.</div>
                  </div>
                  :efBos>0
                    ?<button onClick={()=>{setDetay(null);setTalepModal(h);}} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#7a1a1a,#b91c1c)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontFamily:FONT,fontWeight:700,fontSize:"clamp(13px,3.5vw,15px)",touchAction:"manipulation"}}>
                       Hisse Talep Et — {formatTL(hT)}
                    </button>
                    :<div style={{textAlign:"center",padding:"11px",background:"#f9f3ea",borderRadius:10,color:"#6b4423",fontSize:13}}>Bu hayvan için yer kalmadı</div>
                }
              </div>
            </div>
          </div>
        );
      })()}

      {/* TALEP MODAL - TAM EKRAN */}
      {talepModal&&(
        <div className="talep-bg" onClick={()=>setTalepModal(null)}>
          <div className="talep-kart" onClick={e=>e.stopPropagation()}>
            {/* Sabit header */}
            <div style={{background:"linear-gradient(135deg,#7a1a1a,#9b1c1c)",padding:"16px 18px 14px",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{color:"rgba(255,255,255,.7)",fontSize:11}}>Hisse Talebi</span>
                <button onClick={()=>setTalepModal(null)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:20,color:"#fff",fontSize:18,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation",flexShrink:0,padding:0}}>×</button>
              </div>
              <div style={{color:"#fff",fontWeight:700,fontSize:"clamp(16px,4.5vw,20px)"}}>#{talepModal.numara} Nolu Hayvan</div>
              <div style={{color:"rgba(255,255,255,.85)",fontSize:"clamp(13px,3.5vw,16px)",marginTop:2,fontWeight:600}}>
                {formatTL(talepModal.tip==="buyukbas"?Math.round(talepModal.fiyat/talepModal.maxHisse):talepModal.fiyat)} / hisse
              </div>
            </div>
            {/* Kaydırılabilir form */}
            <div style={{flex:1,overflow:"auto",padding:"20px 18px",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{...S.lbl,fontSize:13,marginBottom:6}}>Ad Soyad *</label>
                <input value={form.ad} onChange={e=>setForm(v=>({...v,ad:e.target.value}))}
                  placeholder="Ahmet Yılmaz"
                  style={{...S.inp,fontSize:16,padding:"14px 14px",borderRadius:10}}
                  autoComplete="name"/>
              </div>
              <div>
                <label style={{...S.lbl,fontSize:13,marginBottom:6}}>Telefon *</label>
                <input value={form.telefon} onChange={e=>setForm(v=>({...v,telefon:e.target.value}))}
                  placeholder="0555 123 45 67" inputMode="tel"
                  style={{...S.inp,fontSize:16,padding:"14px 14px",borderRadius:10}}
                  autoComplete="tel"/>
              </div>
              <div style={{background:"#fdf0e0",border:"1px solid rgba(200,134,26,.25)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#92400e",lineHeight:1.5}}>
                Talebiniz yönetici onayına gönderilecek. Onay sonrası WhatsApp ile bildirim alacaksınız.
              </div>
            </div>
            {/* Sabit footer butonlar */}
            <div style={{padding:"14px 18px 28px",borderTop:"1px solid rgba(200,134,26,.15)",flexShrink:0,display:"flex",gap:10,background:"#fdf6ec"}}>
              <button onClick={()=>setTalepModal(null)}
                style={{flex:1,padding:"14px",background:"transparent",border:"1px solid rgba(200,134,26,.4)",borderRadius:10,color:"#8a5c30",cursor:"pointer",fontFamily:FONT,fontSize:14,fontWeight:500,touchAction:"manipulation"}}>
                İptal
              </button>
              <button onClick={gonder} disabled={gonderiyor}
                style={{flex:2,padding:"14px",background:gonderiyor?"#aaa":"linear-gradient(90deg,#7a1a1a,#b91c1c)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontFamily:FONT,fontWeight:700,fontSize:15,touchAction:"manipulation"}}>
                {gonderiyor?"Gönderiliyor...":"Talep Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =
   LOGIN
= */
function LoginPanel({sifre,setSifre,err,onGiris,onGeri}) {
  return (
    <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:16}}>
      <div style={{background:"linear-gradient(160deg,#6b1010,#8b1a1a)",border:"3px solid #c8861a",borderRadius:18,padding:"clamp(24px,6vw,36px) clamp(18px,5vw,28px)",width:"100%",maxWidth:330,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10}}>🐂</div>
        <h2 style={{color:"#fff8f0",margin:"0 0 4px",fontFamily:FONT}}>Yönetici Girişi</h2>
        <p style={{color:"rgba(255,220,180,.8)",fontSize:13,margin:"0 0 18px"}}>Şifreyi girerek devam edin</p>
        <input type="password" value={sifre} onChange={e=>setSifre(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onGiris()} placeholder="Şifre"
          style={{...S.inp,textAlign:"center",letterSpacing:3,border:`2px solid ${err?"#f87171":"rgba(255,200,100,.4)"}`,background:"rgba(255,255,255,.95)"}}/>
        {err&&<p style={{color:"#f87171",fontSize:12,margin:"6px 0 0"}}> Hatalı şifre</p>}
        <button onClick={onGiris} style={{marginTop:12,width:"100%",...S.solid(),padding:13,fontSize:15}}>Giriş Yap</button>
        <button onClick={onGeri} style={{marginTop:6,width:"100%",background:"transparent",border:"none",color:"#4a2810",cursor:"pointer",fontFamily:FONT,fontSize:13,padding:"8px",touchAction:"manipulation"}}>&larr; Geri Dön</button>
      </div>
    </div>
  );
}

/* =
   ADMİN PANELİ
= */
function AdminPanel({hayvanlar,talepler,onOnayla,onReddet,onEkleH,onGuncH,onSilH,onSilHisse,onDurum,onHisseDirekt,onOdeme,onCikis,onYenile,onTalepTemizle,sbHata}) {
  const [sekme,   setSekme]   = useState("talepler");
  const [yeniH,   setYeniH]   = useState({tip:"buyukbas",kategori:"koyun",numara:"",kesimSirasi:"",fiyat:0,maxHisse:"7",fotolar:[],aciklama:"",bagisCurban:false,kupeNo:""});
  const [acik,    setAcik]    = useState(null);
  const [duzEdit, setDuzEdit] = useState(null); // güncelleme formu açık hayvan id
  const [duzForm, setDuzForm] = useState({});   // güncelleme form değerleri
  const [fotoEdit,setFotoEdit]= useState({});
  const [hForm,   setHForm]   = useState({});
  const [onayForm, setOnayForm] = useState({});
  const BOS_HFORM = {ad:"",telefon:"",vekalet:false,teslimat:"belirtilmedi",acilIrtibat:"",acilTelefon:"",not:""};
  const BOS_ONAY  = {vekalet:false,teslimat:"belirtilmedi",acilIrtibat:"",acilTelefon:"",not:""};

  const bekleyen = talepler.filter(t=>t.durum==="bekliyor");
  const numSet = (key,val)=>setYeniH(p=>({...p,[key]:val.replace(/\D/g,"")}));

  const ekleHayvan = ()=>{
    if(!yeniH.numara||!yeniH.kesimSirasi||!yeniH.fiyat){alert("Hayvan No, Kesim Sırası ve Fiyat zorunludur!");return;}
    if(yeniH.fiyat<1000){alert("Fiyat çok düşük görünüyor. Lütfen tam tutarı girin (Örn: 350000)");return;}
    onEkleH({...yeniH,numara:+yeniH.numara,kesimSirasi:+yeniH.kesimSirasi,fiyat:yeniH.fiyat,maxHisse:yeniH.bagisCurban?1:(yeniH.tip==="kucukbas"?1:+yeniH.maxHisse),bagisCurban:yeniH.bagisCurban,foto:yeniH.fotolar[0]||"",fotolar:yeniH.fotolar,kupeNo:yeniH.kupeNo||""});
    setYeniH({tip:"buyukbas",kategori:"koyun",numara:"",kesimSirasi:"",fiyat:0,maxHisse:"7",fotolar:[],aciklama:"",bagisCurban:false,kupeNo:""});
    alert(" Hayvan eklendi!");
  };

  const hisseDirekt = (hid)=>{
    const f=hForm[hid]||{};
    if(!f.ad?.trim()||!f.telefon?.trim()){alert("Ad ve telefon zorunludur!");return;}
    if(onHisseDirekt(hid, {...f, ad:f.ad.trim(), telefon:f.telefon.trim()})){
      setHForm(p=>({...p,[hid]:{...BOS_HFORM}}));
      alert("Hissedar eklendi!");
    }
  };

  const duzGuncelle = (hid)=>{
    if(!duzForm.numara||!duzForm.kesimSirasi||!duzForm.fiyat){alert("Hayvan No, Kesim Sırası ve Fiyat zorunludur!");return;}
    onGuncH(hid,{
      numara:+duzForm.numara,
      kesimSirasi:+duzForm.kesimSirasi,
      fiyat:duzForm.fiyat||0,
      maxHisse:+duzForm.maxHisse||1,
      foto:(duzForm.fotolar||[])[0]||duzForm.foto||"",
      fotolar:duzForm.fotolar||[],
      aciklama:duzForm.aciklama||"",
      kupeNo:duzForm.kupeNo||"",
      bagisCurban:duzForm.bagisCurban||false,
    });
    setDuzEdit(null);
    alert(" Güncellendi!");
  };

  const excelIndir = (tur)=>{
    const satirlar=[];
    if(tur==="hisseler"){
      satirlar.push(["Kesim Sırası","Hayvan No","Tür","Hissedar Adı","Telefon","Hisse Tutarı","Tarih"]);
      [...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).forEach(h=>{
        h.hisseler.filter(x=>x.durum==="onaylı").forEach(hisse=>{
          satirlar.push([h.kesimSirasi,`#${h.numara}`,h.tip==="buyukbas"?"Büyükbaş":`Küçükbaş (${h.kategori})`,hisse.ad,hisse.telefon,hisse.tutar,hisse.tarih]);
        });
      });
    } else if(tur==="hayvanlar"){
      satirlar.push(["Kesim Sırası","Hayvan No","Küpe No","Tür","Toplam Fiyat","Hisse Bedeli","Max Hisse","Dolu","Boş","Durum"]);
      [...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).forEach(h=>{
        const dolu=h.hisseler.filter(x=>x.durum==="onaylı").length;
        const hT=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
        satirlar.push([h.kesimSirasi,`#${h.numara}`,h.kupeNo||"-",h.tip==="buyukbas"?"Büyükbaş":`Küçükbaş (${h.kategori})`,h.fiyat,hT,h.maxHisse,dolu,h.maxHisse-dolu,h.durum]);
      });
    } else {
      satirlar.push(["Hayvan No","Ad","Telefon","Tutar","Durum","Tarih"]);
      talepler.forEach(t=>{
        const h=hayvanlar.find(x=>x.id===t.hayvanId);
        satirlar.push([`#${h?.numara||"?"}`,t.ad,t.telefon,t.tutar,t.durum,t.tarih]);
      });
    }
    const bom = "\uFEFF";
    const csv = bom + satirlar.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    a.download=`kurban_${tur}_${new Date().toLocaleDateString("tr-TR").replace(/\./g,"-")}.csv`;
    a.click();
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{background:"linear-gradient(90deg,#6b1515,#8b1a1a,#6b1515)",borderBottom:"2px solid #c8861a",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <div style={{minWidth:0}}>
          <h1 style={{margin:0,fontSize:"clamp(13px,3.5vw,17px)",color:"#fff",fontFamily:FONT}}>Yönetici Paneli</h1>
          <p style={{margin:0,fontSize:10,color:"rgba(255,255,255,.7)"}}>Murat Yalvaç Öğrenci Yurdu</p>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {bekleyen.length>0&&<span style={{background:"#c0392b",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{bekleyen.length} bekliyor</span>}
          {sbHata&&<span style={{fontSize:10,color:"#f87171"}}>Çevrimdışı</span>}
          <button onClick={onYenile} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",borderRadius:7,color:"#fff",fontSize:12,padding:"6px 10px",cursor:"pointer",fontFamily:FONT,touchAction:"manipulation"}}>↻ Yenile</button>
          <button onClick={onCikis} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.2)",borderRadius:7,color:"rgba(255,255,255,.85)",fontSize:12,padding:"6px 10px",cursor:"pointer",fontFamily:FONT,touchAction:"manipulation"}}>Çıkış</button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="sbar">
        {[["talepler",` Talepler${bekleyen.length>0?` (${bekleyen.length})`:""}`,],["hayvanlar"," Hayvanlar"],["ekle"," Ekle"],["rapor"," Rapor"]].map(([k,l])=>(
          <button key={k} className="sbtn" onClick={()=>setSekme(k)} style={{borderBottomColor:sekme===k?"#7a2e0e":"transparent",color:sekme===k?"#7a2e0e":"#5c3d1e"}}>{l}</button>
        ))}
      </div>

      <div className="icerik">

        {/* = TALEPLER = */}
        {sekme==="talepler"&&(
          <div>
            <h3 style={{color:"#8b1a1a",marginTop:0,fontFamily:FONT,fontSize:16}}>Bekleyen Talepler</h3>
            {bekleyen.length===0
              ?<p style={{color:"#6b4423",fontSize:13}}>Bekleyen talep yok.</p>
              :bekleyen.map(t=>{
                const h=hayvanlar.find(x=>x.id===t.hayvanId);
                const of=onayForm[t.id]||BOS_ONAY;
                const setOf=(d)=>setOnayForm(p=>({...p,[t.id]:{...of,...d}}));
                return (
                  <div key={t.id} style={{...S.card,padding:"13px 14px",marginBottom:12}}>
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4,marginBottom:4}}>
                        <span style={{color:"#7a2e0e",fontWeight:700,fontSize:14}}>#{h?.numara} nolu hayvan</span>
                        <span style={{color:"#6b4423",fontSize:11}}>{t.tarih}</span>
                      </div>
                      <div style={{color:"#2d1a08",fontSize:15,fontWeight:600,marginBottom:2}}>{t.ad}</div>
                      <div style={{display:"flex",gap:12,fontSize:12,color:"#8a5c30",flexWrap:"wrap"}}>
                        <span>Tel: {t.telefon}</span>
                        <span style={{color:"#92400e"}}>Tutar: {formatTL(t.tutar)}</span>
                      </div>
                    </div>
                    <div style={{background:"rgba(200,134,26,.07)",border:"1px solid rgba(200,134,26,.2)",borderRadius:9,padding:"11px",marginBottom:10}}>
                      <p style={{margin:"0 0 9px",fontSize:11,color:"#7a2e0e",fontWeight:700}}>Onay Bilgileri</p>
                      <div className="frow" style={{marginBottom:8}}>
                        <div>
                          <label style={S.lbl}>Teslimat Yeri</label>
                          <select value={of.teslimat} onChange={e=>setOf({teslimat:e.target.value})} style={S.sel}>
                            <option value="belirtilmedi">Belirtilmedi</option>
                            <option value="ev">Eve Teslim</option>
                            <option value="arac">Aracla Teslim</option>
                            <option value="ciftlik">Ciftlikte Teslim</option>
                            <option value="diger">Diger</option>
                          </select>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                          <label style={S.lbl}>Vekalet</label>
                          <button onClick={()=>setOf({vekalet:!of.vekalet})}
                            style={{padding:"11px 12px",borderRadius:8,border:`1px solid ${of.vekalet?"#4ade80":"rgba(200,134,26,.3)"}`,background:of.vekalet?"rgba(74,222,128,.12)":"#fff",color:of.vekalet?"#15803d":"#6b4423",cursor:"pointer",fontFamily:FONT,fontSize:13,touchAction:"manipulation"}}>
                            {of.vekalet?"Alindi":"Alinmadi"}
                          </button>
                        </div>
                      </div>
                      <div className="frow" style={{marginBottom:8}}>
                        <div><label style={S.lbl}>Ilave Irtibat Adi</label>
                          <input value={of.acilIrtibat} onChange={e=>setOf({acilIrtibat:e.target.value})} placeholder="Es / kardes" style={S.inp}/>
                        </div>
                        <div><label style={S.lbl}>Ilave Irtibat Tel</label>
                          <input value={of.acilTelefon} onChange={e=>setOf({acilTelefon:e.target.value})} placeholder="0555 000 00 00" inputMode="tel" style={S.inp}/>
                        </div>
                      </div>
                      <div>
                        <label style={S.lbl}>Not</label>
                        <input value={of.not} onChange={e=>setOf({not:e.target.value})} placeholder="Ozel not..." style={S.inp}/>
                      </div>
                    </div>
                    <div className="onay-row">
                      <button onClick={()=>onReddet(t.id)} style={{flex:1,padding:"10px",background:"#7f1d1d",border:"1px solid #f87171",borderRadius:8,color:"#f87171",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,touchAction:"manipulation"}}>Reddet</button>
                      <button onClick={()=>onOnayla(t.id,of)} style={{flex:2,padding:"10px",background:"#14532d",border:"1px solid #4ade80",borderRadius:8,color:"#4ade80",cursor:"pointer",fontFamily:FONT,fontSize:13,fontWeight:600,touchAction:"manipulation"}}>Onayla ve Kaydet</button>
                    </div>
                  </div>
                );
              })
            }
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,marginBottom:8}}>
              <h3 style={{color:"#4a2810",margin:0,fontFamily:FONT,fontSize:14}}>Geçmiş Talepler ({talepler.filter(t=>t.durum!=="bekliyor").length})</h3>
              {talepler.filter(t=>t.durum!=="bekliyor").length>0&&(
                <button onClick={()=>{if(window.confirm("Tüm geçmiş talepler silinsin mi?")) onTalepTemizle();}}
                  style={{background:"rgba(127,29,29,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,color:"#b91c1c",fontSize:11,padding:"4px 10px",cursor:"pointer",fontFamily:FONT,touchAction:"manipulation"}}>
                  Temizle
                </button>
              )}
            </div>
            {talepler.filter(t=>t.durum!=="bekliyor").length===0
              ?<p style={{color:"#6b4423",fontSize:12}}>Geçmiş talep yok.</p>
              :talepler.filter(t=>t.durum!=="bekliyor").slice().reverse().map(t=>{
                const h=hayvanlar.find(x=>x.id===t.hayvanId);
                return (
                  <div key={t.id} style={{background:"#faf4eb",border:"1px solid rgba(200,134,26,.12)",borderRadius:8,padding:"8px 11px",marginBottom:5,fontSize:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                      <span style={{color:"#2d1a08"}}>#{h?.numara||"?"} - {t.ad} - {t.telefon}</span>
                      <span style={{color:t.durum==="onaylı"?"#15803d":"#dc2626",fontWeight:600}}>{t.durum==="onaylı"?"Onaylı":"Reddedildi"}</span>
                    </div>
                    <div style={{color:"#6b4423",marginTop:2}}>{formatTL(t.tutar)} - {t.tarih}</div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* = HAYVANLAR = */}
        {sekme==="hayvanlar"&&(
          <div>
            <h3 style={{color:"#8b1a1a",marginTop:0,fontFamily:FONT,fontSize:16}}>Hayvan Listesi ({hayvanlar.length})</h3>
            {[...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).map(h=>{
              const bos=getBos(h),dolu=h.maxHisse-bos;
              const hT=h.tip==="buyukbas"?Math.round(h.fiyat/h.maxHisse):h.fiyat;
              const isAcik=acik===h.id;
              const isDuz=duzEdit===h.id;
              const hf=hForm[h.id]||{ad:"",telefon:""};
              return (
                <div key={h.id} style={{...S.card,padding:"12px 13px",marginBottom:11,border:`1px solid ${h.durum==="aktif"?"rgba(212,160,23,.25)":"rgba(255,0,0,.2)"}`}}>
                  {/* Özet satır */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                    <div style={{display:"flex",gap:9,alignItems:"center",flex:1,minWidth:0}}>
                      {h.foto&&<img src={h.foto} alt="" style={{width:40,height:40,borderRadius:7,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:15,color:"#7a2e0e",fontWeight:700}}>#{h.numara}</span>
                          <span style={{fontSize:11,color:"#4a2810"}}>{h.tip==="buyukbas"?" Büyükbaş":` ${h.kategori}`} - {h.kesimSirasi}. sıra</span>
                        </div>
                        <div style={{fontSize:11,color:"#8a5c30",marginTop:1}}>
                          {formatTL(hT)}/hisse - <span style={{color:"#4ade80"}}>{bos} boş</span> / {h.maxHisse}
                          {h.durum==="pasif"&&<span style={{color:"#f87171",marginLeft:6}}>= PASİF</span>}
                        </div>
                      </div>
                    </div>
                    <div className="abtn-grp">
                      <button onClick={()=>{setAcik(isAcik?null:h.id);setDuzEdit(null);}}
                        style={{padding:"6px 10px",border:`1px solid ${isAcik?"#8b1a1a":"rgba(200,134,26,.4)"}`,borderRadius:7,background:isAcik?"#8b1a1a":"transparent",color:isAcik?"#fff":"#8b4a10",cursor:"pointer",fontFamily:FONT,fontSize:12,touchAction:"manipulation",whiteSpace:"nowrap"}}>
                        {isAcik?"Kapat":"Detay"}
                      </button>
                      <button onClick={()=>{
                        setDuzEdit(isDuz?null:h.id);
                        setDuzForm({numara:String(h.numara),kesimSirasi:String(h.kesimSirasi),fiyat:h.fiyat||0,maxHisse:String(h.maxHisse),fotolar:h.fotolar||(h.foto?[h.foto]:[]),aciklama:h.aciklama||"",bagisCurban:h.bagisCurban||false,kupeNo:h.kupeNo||""});
                        setAcik(h.id);
                      }} style={{padding:"6px 10px",border:"1px solid rgba(99,163,250,.5)",borderRadius:7,background:"rgba(99,163,250,.1)",color:"#1d4ed8",cursor:"pointer",fontFamily:FONT,fontSize:12,touchAction:"manipulation",whiteSpace:"nowrap"}}>
                        Düzenle
                      </button>
                      <button onClick={()=>onDurum(h.id,h.durum==="aktif"?"pasif":"aktif")}
                        style={{padding:"6px 10px",border:`1px solid ${h.durum==="aktif"?"rgba(248,113,113,.5)":"rgba(74,222,128,.5)"}`,borderRadius:7,background:h.durum==="aktif"?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)",color:h.durum==="aktif"?"#dc2626":"#15803d",cursor:"pointer",fontFamily:FONT,fontSize:12,touchAction:"manipulation",whiteSpace:"nowrap"}}>
                        {h.durum==="aktif"?"Pasif Yap":"Aktif Yap"}
                      </button>
                      <button onClick={()=>onSilH(h.id)}
                        style={{padding:"6px 10px",border:"1px solid rgba(248,113,113,.4)",borderRadius:7,background:"rgba(248,113,113,.1)",color:"#dc2626",cursor:"pointer",fontFamily:FONT,fontSize:12,touchAction:"manipulation",whiteSpace:"nowrap"}}>
                        Sil
                      </button>
                    </div>
                  </div>

                  {isAcik&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(212,160,23,.12)"}}>

                      {/* GÜNCELLEME FORMU */}
                      {isDuz&&(
                        <div className="gform">
                          <p style={{margin:"0 0 8px",fontSize:12,color:"#60a5fa",fontWeight:700}}> Hayvan Güncelle</p>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            <div><label style={S.lbl}>Hayvan No</label><input value={duzForm.numara} onChange={e=>setDuzForm(p=>({...p,numara:e.target.value.replace(/\D/g,"")}))} inputMode="numeric" style={S.inp}/></div>
                            <div><label style={S.lbl}>Kesim Sırası</label><input value={duzForm.kesimSirasi} onChange={e=>setDuzForm(p=>({...p,kesimSirasi:e.target.value.replace(/\D/g,"")}))} inputMode="numeric" style={S.inp}/></div>
                            <div><label style={S.lbl}>Fiyat (TL)</label><input value={duzForm.fiyat} onChange={e=>setDuzForm(p=>({...p,fiyat:e.target.value.replace(/\D/g,"")}))} inputMode="numeric" style={S.inp}/></div>
                            {h.tip==="buyukbas"&&<div><label style={S.lbl}>Max Hisse</label><input value={duzForm.maxHisse} onChange={e=>setDuzForm(p=>({...p,maxHisse:e.target.value.replace(/\D/g,"")}))} inputMode="numeric" style={S.inp}/></div>}
                          </div>
                          <FotoYukle mevcut={duzForm.foto} onChange={url=>setDuzForm(p=>({...p,foto:url}))}/>
                          <div><label style={S.lbl}> Açıklama</label><textarea value={duzForm.aciklama} onChange={e=>setDuzForm(p=>({...p,aciklama:e.target.value}))} rows={2} style={{...S.inp,resize:"vertical"}}/></div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>setDuzEdit(null)} style={{flex:1,...S.btn("#604030"),color:"#8a5c30"}}>İptal</button>
                            <button onClick={()=>duzGuncelle(h.id)} style={{flex:2,...S.solid("#1a3a6a","#60a5fa")}}> Güncelle</button>
                          </div>
                        </div>
                      )}

                      {/* HİSSEDAR EKLE */}
                      <div style={{background:"rgba(200,134,26,.07)",border:"1px solid rgba(200,134,26,.2)",borderRadius:9,padding:"12px",marginBottom:12,marginTop:isDuz?12:0}}>
                        <p style={{margin:"0 0 10px",fontSize:12,color:"#7a2e0e",fontWeight:700}}>Hissedar Ekle ({bos} bos yer)</p>
                        <div className="frow" style={{marginBottom:8}}>
                          <div><label style={S.lbl}>Ad Soyad *</label><input value={hf.ad||""} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,ad:e.target.value}}))} placeholder="Ahmet Yilmaz" style={S.inp}/></div>
                          <div><label style={S.lbl}>Telefon *</label><input value={hf.telefon||""} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,telefon:e.target.value}}))} placeholder="0555 000 00 00" inputMode="tel" style={S.inp}/></div>
                        </div>
                        <div className="frow" style={{marginBottom:8}}>
                          <div>
                            <label style={S.lbl}>Teslimat</label>
                            <select value={hf.teslimat||"belirtilmedi"} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,teslimat:e.target.value}}))} style={S.sel}>
                              <option value="belirtilmedi">Belirtilmedi</option>
                              <option value="ev">Eve Teslim</option>
                              <option value="arac">Aracla</option>
                              <option value="ciftlik">Ciftlikte</option>
                              <option value="diger">Diger</option>
                            </select>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                            <label style={S.lbl}>Vekalet</label>
                            <button onClick={()=>setHForm(p=>({...p,[h.id]:{...hf,vekalet:!hf.vekalet}}))}
                              style={{padding:"11px 10px",borderRadius:8,border:`1px solid ${hf.vekalet?"#16a34a":"rgba(200,134,26,.3)"}`,background:hf.vekalet?"rgba(74,222,128,.1)":"#fff",color:hf.vekalet?"#15803d":"#6b4423",cursor:"pointer",fontFamily:FONT,fontSize:13,touchAction:"manipulation"}}>
                              {hf.vekalet?"Alindi":"Alinmadi"}
                            </button>
                          </div>
                        </div>
                        <div className="frow" style={{marginBottom:8}}>
                          <div><label style={S.lbl}>Ilave Irtibat Adi</label><input value={hf.acilIrtibat||""} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,acilIrtibat:e.target.value}}))} placeholder="Es / kardes" style={S.inp}/></div>
                          <div><label style={S.lbl}>Ilave Irtibat Tel</label><input value={hf.acilTelefon||""} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,acilTelefon:e.target.value}}))} placeholder="0555 000 00 00" inputMode="tel" style={S.inp}/></div>
                        </div>
                        <div style={{marginBottom:10}}>
                          <label style={S.lbl}>Not</label>
                          <input value={hf.not||""} onChange={e=>setHForm(p=>({...p,[h.id]:{...hf,not:e.target.value}}))} placeholder="Ozel not..." style={S.inp}/>
                        </div>
                        <button onClick={()=>hisseDirekt(h.id)} style={{width:"100%",padding:"11px",background:"#1a4a1a",border:"1px solid #4ade80",borderRadius:8,color:"#4ade80",cursor:"pointer",fontFamily:FONT,fontWeight:600,fontSize:13,touchAction:"manipulation"}}>
                          Hissedar Kaydet - {formatTL(hT)}
                        </button>
                      </div>

                      {/* HİSSE LİSTESİ */}
                      <p style={{margin:"0 0 8px",fontSize:11,color:"#4a2810",fontWeight:700}}>Onaylı Hisseler ({dolu}/{h.maxHisse}):</p>
                      {h.hisseler.filter(x=>x.durum==="onaylı").length===0
                        ?<p style={{color:"#6b4423",fontSize:11}}>Henuz onaylı hisse yok.</p>
                        :h.hisseler.filter(x=>x.durum==="onaylı").map((hisse,i)=>{
                          const kalan=hisse.tutar-(hisse.odenen||0);
                          const teslimLabel={ev:"Eve",arac:"Aracla",ciftlik:"Ciftlikte",diger:"Diger",belirtilmedi:"Belirtilmedi"};
                          return (
                          <div key={hisse.id} style={{background:"#fdf8f2",border:"1px solid rgba(200,134,26,.15)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                              <div>
                                <span style={{color:"#8b1a1a",fontWeight:700,fontSize:13}}>{i+1}. {hisse.ad}</span>
                                <span style={{fontSize:11,color:"#8a5c30",marginLeft:8}}>Tel: {hisse.telefon}</span>
                              </div>
                              <button onClick={()=>onSilHisse(h.id,hisse.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:16,padding:"0 2px",touchAction:"manipulation",flexShrink:0}}>Sil</button>
                            </div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
                              {hisse.teslimat&&hisse.teslimat!=="belirtilmedi"&&(
                                <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",color:"#15803d"}}>{teslimLabel[hisse.teslimat]||hisse.teslimat}</span>
                              )}
                              <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:hisse.vekalet?"rgba(74,222,128,.1)":"rgba(248,113,113,.08)",border:`1px solid ${hisse.vekalet?"rgba(74,222,128,.3)":"rgba(248,113,113,.2)"}`,color:hisse.vekalet?"#15803d":"#dc2626"}}>
                                Vekalet: {hisse.vekalet?"Alindi":"Alinmadi"}
                              </span>
                            </div>
                            {hisse.acilIrtibat&&(
                              <div style={{fontSize:11,color:"#8b1a1a",marginBottom:6,background:"rgba(139,26,26,.06)",padding:"4px 8px",borderRadius:6}}>
                                Ilave: {hisse.acilIrtibat}{hisse.acilTelefon&&" - "+hisse.acilTelefon}
                              </div>
                            )}
                            {hisse.not&&<div style={{fontSize:11,color:"#8a5c30",marginBottom:8,fontStyle:"italic"}}>Not: {hisse.not}</div>}
                            <div style={{background:"rgba(200,134,26,.08)",borderRadius:8,padding:"8px 10px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6,flexWrap:"wrap",gap:4}}>
                                <span>Toplam: <strong style={{color:"#92400e"}}>{formatTL(hisse.tutar)}</strong></span>
                                <span style={{color:"#15803d"}}>Odenen: <strong>{formatTL(hisse.odenen||0)}</strong></span>
                                <span style={{color:kalan>0?"#b91c1c":"#15803d"}}>Kalan: <strong>{formatTL(kalan)}</strong></span>
                              </div>
                              <OdemeInput tutar={hisse.tutar} odenen={hisse.odenen||0} onChange={(v)=>onOdeme(h.id,hisse.id,v)}/>
                            </div>
                          </div>
                        );})
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* = HAYVAN EKLE = */}
        {sekme==="ekle"&&(
          <div style={{maxWidth:420}}>
            <h3 style={{color:"#8b1a1a",marginTop:0,fontFamily:FONT,fontSize:16}}>Yeni Hayvan Ekle</h3>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div><label style={S.lbl}>Tür</label>
                <select value={yeniH.tip} onChange={e=>setYeniH(p=>({...p,tip:e.target.value,maxHisse:e.target.value==="kucukbas"?"1":"7"}))} style={S.sel}>
                  <option value="buyukbas">🐂 Büyükbaş</option>
                  <option value="kucukbas">🐑 Küçükbaş</option>
                </select>
              </div>
              {yeniH.tip==="kucukbas"&&(
                <div><label style={S.lbl}>Kategori</label>
                  <select value={yeniH.kategori} onChange={e=>setYeniH(p=>({...p,kategori:e.target.value}))} style={S.sel}>
                    <option value="koyun">Koyun</option>
                    <option value="keci">Keçi</option>
                  </select>
                </div>
              )}
              <div className="frow">
                <div><label style={S.lbl}>Hayvan No</label><input value={yeniH.numara} onChange={e=>numSet("numara",e.target.value)} placeholder="Örn: 7" inputMode="numeric" style={S.inp}/></div>
                <div>
                  <label style={S.lbl}>Kesim Sırası</label>
                  <input value={yeniH.kesimSirasi} onChange={e=>numSet("kesimSirasi",e.target.value)} placeholder="Örn: 3" inputMode="numeric" style={S.inp}/>
                  {yeniH.kesimSirasi&&(()=>{const ks=kesimSaati(+yeniH.kesimSirasi);return ks?<span style={{fontSize:10,color:"#92400e",display:"block",marginTop:2}}>⏰ ~{ks.metin}</span>:null;})()}
                </div>
              </div>
              {yeniH.tip==="buyukbas"&&(
                <div><label style={S.lbl}>🏷 Küpe Numarası</label>
                  <input value={yeniH.kupeNo} onChange={e=>setYeniH(p=>({...p,kupeNo:e.target.value}))} placeholder="Örn: TR-2024-00123" style={S.inp}/>
                </div>
              )}
              <div>
                <label style={S.lbl}>Toplam Fiyat (TL)</label>
                <FiyatInput value={yeniH.fiyat} onChange={v=>setYeniH(p=>({...p,fiyat:v}))} style={S.inp}/>
              </div>
              {yeniH.tip==="buyukbas"&&(
                <div><label style={S.lbl}>Maks Hisse (1-7)</label>
                  <input value={yeniH.maxHisse} onChange={e=>{const v=Math.min(7,Math.max(1,+e.target.value.replace(/[^0-9]/g,"")||1));setYeniH(p=>({...p,maxHisse:String(v)}));}} inputMode="numeric" style={S.inp}/>
                </div>
              )}
              <FotoGaleri fotolar={yeniH.fotolar} onChange={liste=>setYeniH(p=>({...p,fotolar:liste}))}/>
              <div>
                <label style={S.lbl}> Açıklama (opsiyonel)</label>
                <textarea value={yeniH.aciklama} onChange={e=>setYeniH(p=>({...p,aciklama:e.target.value}))} placeholder="Örn: Sağlıklı, 3 yaşında..." rows={2} style={{...S.inp,resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(139,26,26,.05)",borderRadius:8,border:"1px solid rgba(139,26,26,.15)",cursor:"pointer"}} onClick={()=>setYeniH(p=>({...p,bagisCurban:!p.bagisCurban}))}>
                <div style={{width:36,height:20,borderRadius:10,background:yeniH.bagisCurban?"#8b1a1a":"rgba(200,134,26,.2)",transition:"background .2s",display:"flex",alignItems:"center",padding:"2px",flexShrink:0}}>
                  <div style={{width:16,height:16,borderRadius:8,background:"#fff",transform:yeniH.bagisCurban?"translateX(16px)":"translateX(0)",transition:"transform .2s"}}/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#8b1a1a"}}>Bağış Kurbanı</div>
                  <div style={{fontSize:10,color:"#92400e"}}>Hisse alınamaz — sadece bağış</div>
                </div>
              </div>
              {yeniH.fiyat&&+yeniH.maxHisse>0&&(
                <div style={{background:"rgba(212,160,23,.08)",border:"1px solid rgba(212,160,23,.25)",borderRadius:8,padding:"9px 13px",fontSize:13,color:"#92400e"}}>
                   Hisse bedeli: <strong>{formatTL(Math.round(yeniH.fiyat/(+yeniH.maxHisse||1)))}</strong>
                </div>
              )}
              <button onClick={ekleHayvan} style={{padding:"12px",background:"linear-gradient(90deg,#1a4a1a,#2d7a2d)",border:"1px solid #4ade80",borderRadius:8,color:"#4ade80",cursor:"pointer",fontFamily:FONT,fontWeight:600,fontSize:14,touchAction:"manipulation"}}>
                 Hayvan Ekle
              </button>
            </div>
          </div>
        )}

        {/* = RAPOR = */}
        {sekme==="rapor"&&(()=>{
          const th=hayvanlar.length;
          const ah=hayvanlar.filter(h=>h.durum==="aktif").length;
          const tm=hayvanlar.reduce((a,h)=>a+h.maxHisse,0);
          const dm=hayvanlar.reduce((a,h)=>a+h.hisseler.filter(x=>x.durum==="onaylı").length,0);
          const ciro=hayvanlar.reduce((a,h)=>a+h.hisseler.filter(x=>x.durum==="onaylı").reduce((b,x)=>b+x.tutar,0),0);
          const oran=tm>0?Math.round(dm/tm*100):0;
          return (
            <div>
              <h3 style={{color:"#8b1a1a",marginTop:0,fontFamily:FONT,fontSize:16}}> Rapor & İstatistik</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:9,marginBottom:18}}>
                {[
                  {lbl:"Toplam Hayvan",val:th,renk:"#d4a017"},
                  {lbl:"Aktif Hayvan",val:ah,renk:"#4ade80"},
                  {lbl:"Dolu Hisse",val:dm,renk:"#4ade80"},
                  {lbl:"Boş Hisse",val:tm-dm,renk:"#f87171"},
                  {lbl:"Doluluk",val:`%${oran}`,renk:"#d4a017"},
                  {lbl:"Tahsilat",val:formatTL(ciro),renk:"#ffe082"},
                ].map(x=>(
                  <div key={x.lbl} style={{...S.card,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#4a2810",marginBottom:3}}>{x.lbl}</div>
                    <div style={{fontSize:"clamp(14px,3.5vw,18px)",fontWeight:700,color:x.renk,wordBreak:"break-word"}}>{x.val}</div>
                  </div>
                ))}
              </div>
              <div style={{...S.card,padding:"13px 15px",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a5c30",marginBottom:6}}>
                  <span>Genel Doluluk</span>
                  <span style={{color:"#7a2e0e",fontWeight:700}}>%{oran} - {dm}/{tm}</span>
                </div>
                <div style={{background:"rgba(200,134,26,.12)",borderRadius:7,height:12,overflow:"hidden"}}>
                  <div style={{width:`${oran}%`,height:"100%",background:"linear-gradient(90deg,#8b1a1a,#d4a017)",borderRadius:7}}/>
                </div>
              </div>
              {/* Tablo */}
              <div style={{...S.card,padding:"13px 14px",marginBottom:16,overflowX:"auto"}}>
                <p style={{margin:"0 0 9px",fontSize:12,color:"#7a2e0e",fontWeight:700}}>Hayvan Bazlı Doluluk</p>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:300}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid rgba(212,160,23,.25)"}}>
                      {["Sıra","No","Tür","Max","Dolu","Boş","Tahsilat"].map(h=>(
                        <th key={h} style={{padding:"5px 7px",color:"#8a5c30",textAlign:"left",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...hayvanlar].sort((a,b)=>a.kesimSirasi-b.kesimSirasi).map(h=>{
                      const d=h.hisseler.filter(x=>x.durum==="onaylı").length;
                      const c=h.hisseler.filter(x=>x.durum==="onaylı").reduce((a,x)=>a+x.tutar,0);
                      return (
                        <tr key={h.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                          <td style={{padding:"6px 7px",color:"#4a2810"}}>{h.kesimSirasi}.</td>
                          <td style={{padding:"6px 7px",color:"#7a2e0e",fontWeight:700}}>#{h.numara}</td>
                          <td style={{padding:"6px 7px",color:"#8a5c30"}}>{h.tip==="buyukbas"?"🐂":""}</td>
                          <td style={{padding:"6px 7px",color:"#2d1a08"}}>{h.maxHisse}</td>
                          <td style={{padding:"6px 7px",color:"#4ade80",fontWeight:700}}>{d}</td>
                          <td style={{padding:"6px 7px",color:h.maxHisse-d>0?"#f87171":"#604030",fontWeight:700}}>{h.maxHisse-d}</td>
                          <td style={{padding:"6px 7px",color:"#92400e",whiteSpace:"nowrap"}}>{formatTL(c)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Excel */}
              <div style={{...S.card,padding:"14px",marginBottom:14}}>
                <p style={{margin:"0 0 5px",fontSize:12,color:"#7a2e0e",fontWeight:700}}> Excel / CSV İndir</p>
                <p style={{margin:"0 0 12px",fontSize:11,color:"#4a2810"}}>Excel veya Google Sheets'te açılır (noktalı virgül ayraçlı).</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <button onClick={()=>excelIndir("hisseler")} style={{...S.solid("#1a3a1a","#4ade80"),padding:"10px",textAlign:"left",fontSize:12}}> Hissedar Listesi</button>
                  <button onClick={()=>excelIndir("hayvanlar")} style={{...S.solid("#1a2a4a","#60a5fa"),padding:"10px",textAlign:"left",fontSize:12}}> Hayvan Özet Listesi</button>
                  <button onClick={()=>excelIndir("talepler")} style={{...S.solid("#3a1a00","#fb923c"),padding:"10px",textAlign:"left",fontSize:12}}> Tüm Talepler</button>
                </div>
              </div>
              {/* Durum */}
              <div style={{...S.card,padding:"12px 14px",border:`1px solid ${sbHata?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)"}`}}>
                <p style={{margin:"0 0 4px",fontSize:12,fontWeight:700,color:sbHata?"#f87171":"#4ade80"}}>
                  {sbHata?" Supabase bağlantısı yok":" Supabase bağlantısı aktif"}
                </p>
                <p style={{margin:0,fontSize:11,color:"#4a2810"}}>
                  {sbHata?"Veriler geçici olarak çevrimdışı saklanıyor. Bağlantı gelince otomatik senkronize olur.":"Tüm veriler bulutta güvenle saklanıyor - her cihazdan erişilebilir."}
                </p>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
