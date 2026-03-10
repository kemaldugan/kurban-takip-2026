import React, {useState,useEffect} from "react";

/* CONFIG */

const ADMIN_PASSWORD="kurban2026"

const SB_URL="https://pbevwbsvhivrfdgvqexc.supabase.co"
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const HEADERS={
apikey:SB_KEY,
Authorization:`Bearer ${SB_KEY}`,
"Content-Type":"application/json"
}

/* HELPERS */

const uid=()=>Math.random().toString(36).slice(2,9)

const formatTL=n=>
new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(n)

const bosHisse=h=>
h.maxHisse-(h.hisseler?.length||0)

/* SUPABASE */

async function oku(key){

const r=await fetch(
`${SB_URL}/rest/v1/kurban_data?key=eq.${key}&select=value`,
{headers:HEADERS}
)

const d=await r.json()

if(!d.length)return[]

return JSON.parse(d[0].value)

}

async function yaz(key,value){

await fetch(`${SB_URL}/rest/v1/kurban_data`,{

method:"POST",

headers:{
...HEADERS,
Prefer:"resolution=merge-duplicates"
},

body:JSON.stringify({
key,
value:JSON.stringify(value)
})

})

}

/* APP */

export default function App(){

const[view,setView]=useState("public")

const[hayvanlar,setHayvanlar]=useState([])
const[talepler,setTalepler]=useState([])

const[loading,setLoading]=useState(true)

useEffect(()=>{

async function load(){

const h=await oku("hayvanlar")
const t=await oku("talepler")

setHayvanlar(h)
setTalepler(t)

setLoading(false)

}

load()

},[])

useEffect(()=>{

if(!loading) yaz("hayvanlar",hayvanlar)

},[hayvanlar])

useEffect(()=>{

if(!loading) yaz("talepler",talepler)

},[talepler])

if(loading)
return <div style={{padding:40,textAlign:"center"}}>Yükleniyor...</div>

if(view==="admin")
return(

<AdminPanel

hayvanlar={hayvanlar}
talepler={talepler}

onAdd={h=>setHayvanlar([...hayvanlar,h])}

onApprove={id=>{

const t=talepler.find(x=>x.id===id)

setHayvanlar(hayvanlar.map(h=>{

if(h.id!==t.hayvanId)return h

return{
...h,
hisseler:[...(h.hisseler||[]),t]
}

}))

setTalepler(talepler.filter(x=>x.id!==id))

}}

onBack={()=>setView("public")}

/>

)

return(

<PublicPanel

hayvanlar={hayvanlar}

onTalep={t=>setTalepler([...talepler,t])}

onAdmin={()=>setView("login")}

/>

)

}

/* PUBLIC */

function PublicPanel({hayvanlar,onTalep,onAdmin}){

const[secili,setSecili]=useState(null)

const[ad,setAd]=useState("")
const[tel,setTel]=useState("")

return(

<div style={{padding:20}}>

<h1 style={{textAlign:"center"}}>KURBAN 2026</h1>

<button
onClick={onAdmin}
style={{marginBottom:20}}
>

Admin

</button>

<div
style={{
display:"grid",
gap:16,
gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))"
}}

>

{hayvanlar.map(h=>{

const bos=bosHisse(h)

return(

<div
key={h.id}
style={{
border:"1px solid #ddd",
padding:20,
borderRadius:12
}}

>

<h3>Hayvan #{h.numara}</h3>

<div>{formatTL(h.fiyat/h.maxHisse)}</div>

<div>

{bos>0
?`${bos} hisse boş`
:"Doldu"}

</div>

{bos>0&&(

<button
onClick={()=>setSecili(h)}
>

Hisse Talep

</button>

)}

</div>

)

})}

</div>

{secili&&(

<div
style={{
position:"fixed",
inset:0,
background:"#000a",
display:"flex",
alignItems:"center",
justifyContent:"center"
}}

>

<div
style={{
background:"#fff",
padding:30,
borderRadius:10
}}

>

<h3>Hisse Talebi</h3>

<input
placeholder="Ad Soyad"
onChange={e=>setAd(e.target.value)}
/>

<input
placeholder="Telefon"
onChange={e=>setTel(e.target.value)}
/>

<button

onClick={()=>{

onTalep({

id:uid(),
ad,
telefon:tel,
hayvanId:secili.id

})

alert("Talep gönderildi")

setSecili(null)

}}

>

Gönder

</button>

</div>

</div>

)}

</div>

)

}

/* ADMIN */

function AdminPanel({hayvanlar,talepler,onAdd,onApprove,onBack}){

const[numara,setNumara]=useState("")
const[fiyat,setFiyat]=useState("")

return(

<div style={{padding:20}}>

<h2>Admin Panel</h2>

<button onClick={onBack}>Ana Sayfa</button>

<h3>Yeni Hayvan</h3>

<input
placeholder="Numara"
onChange={e=>setNumara(e.target.value)}
/>

<input
placeholder="Fiyat"
onChange={e=>setFiyat(e.target.value)}
/>

<button

onClick={()=>{

onAdd({

id:uid(),
numara,
fiyat:Number(fiyat),
maxHisse:7,
hisseler:[]

})

}}

>

Ekle

</button>

<h3>Talepler</h3>

{talepler.map(t=>(

<div key={t.id}>

{t.ad}

<button
onClick={()=>onApprove(t.id)}
>

Onayla

</button>

</div>

))}

</div>

)

}
