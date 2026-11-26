import { useState } from 'react'
import type { Client } from './types'

const portal = 'https://www.ancfcc.gov.ma/certificatspage/'
type Title = { office: string; number: string; index: string; special: string }
const emptyTitle = (): Title => ({office:'FES ZOUAGHA',number:'',index:'69',special:''})
const steps = ['Préparer le formulaire','Vérifier les titres sur le portail','Valider le téléphone sur le portail','Payer sur la page bancaire','Conserver le reçu et le CPP','Attendre le SMS de disponibilité','Suivre et télécharger le certificat']
export default function GuidedRequest({clients}:{clients:Client[]}) {
 const [clientId,setClientId]=useState('')
 const [lastAr,setLastAr]=useState('')
 const [firstAr,setFirstAr]=useState('')
 const [address,setAddress]=useState('')
 const [email,setEmail]=useState('')
 const [titles,setTitles]=useState<Title[]>([emptyTitle()])
 const [step,setStep]=useState(0)
 const [cpp,setCpp]=useState('')
 const client=clients.find(c=>c.id===clientId)
 const change=(i:number,key:keyof Title,value:string)=>setTitles(old=>old.map((t,j)=>i===j?{...t,[key]:value}:t))
 return <section className="space-y-5">
 <h1 className="text-2xl font-bold text-forest">Assistant ANCFCC — parcours guidé</h1>
 <p className="rounded-xl bg-amber-50 p-4 text-sm">Mode manuel assisté. Aucun envoi automatique, aucun paiement ni code SMS collecté. Les données complémentaires de cet écran ne sont pas enregistrées : elles disparaissent à la fermeture.</p>
 <div className="space-y-3 rounded-2xl bg-white p-5">
 <label>Client<select className="input" value={clientId} onChange={e=>{setClientId(e.target.value);setLastAr('');setFirstAr('');setAddress('');setEmail('');setTitles([emptyTitle()]);setCpp('');setStep(0)}}><option value="">Choisir un client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></label>
 {client&&<p>Nom : {client.lastName} · Prénom : {client.firstName} · CIN : {client.cin}</p>}
 <label>Nom en arabe<input className="input" dir="rtl" value={lastAr} onChange={e=>setLastAr(e.target.value)}/></label>
 <label>Prénom en arabe<input className="input" dir="rtl" value={firstAr} onChange={e=>setFirstAr(e.target.value)}/></label>
 <label>Adresse<input className="input" value={address} onChange={e=>setAddress(e.target.value)}/></label>
 <label>Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 </div>
 <div className="space-y-4 rounded-2xl bg-white p-5"><h2 className="font-bold">Titres fonciers</h2>
 {titles.map((t,i)=><div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
 <label>Conservation<input className="input" value={t.office} onChange={e=>{change(i,'office',e.target.value);change(i,'index','')}}/></label>
 <label>Numéro<input className="input" inputMode="numeric" value={t.number} onChange={e=>change(i,'number',e.target.value.replace(/[^0-9]/g,''))}/></label>
 <label>Indice{t.office==='FES ZOUAGHA'?<select className="input" value={t.index} onChange={e=>change(i,'index',e.target.value)}>{['','07','69','F','K','KF'].map(v=><option key={v}>{v}</option>)}</select>:<input className="input" value={t.index} onChange={e=>change(i,'index',e.target.value)}/>}</label>
 <label>Indice spécial<select className="input" value={t.special} onChange={e=>change(i,'special',e.target.value)}><option value="">Aucun</option><option>BIS</option><option>TER</option></select></label>
 {titles.length>1&&<button type="button" onClick={()=>setTitles(old=>old.filter((_,j)=>j!==i))}>Retirer ce titre</button>}
 </div>)}
 <button className="rounded-lg border p-3" onClick={()=>setTitles(old=>[...old,emptyTitle()])}>+ Ajouter un titre</button>
 <p className="text-xs text-slate-500">Indices FES ZOUAGHA relevés sur le portail. Pour les autres conservations, vérifier les valeurs officielles.</p>
 <a className="block rounded-xl bg-forest p-3 text-center text-white" href={portal} target="_blank" rel="noopener noreferrer">Ouvrir le formulaire officiel</a>
 </div>
 <div className="space-y-3 rounded-2xl bg-white p-5"><h2 className="font-bold">Checklist manuelle (non vérifiée par ANCFCC)</h2>
 {steps.map((s,i)=><label key={s} className="flex items-center gap-3"><input type="checkbox" checked={i<step} disabled={i>step} onChange={()=>setStep(i<step?i:i+1)}/>{s}</label>)}
 <label>Code de suivi CPP (temporaire)<input className="input" value={cpp} onChange={e=>setCpp(e.target.value)} autoComplete="off"/></label>
 <a href="https://www.ancfcc.gov.ma/" target="_blank" rel="noopener noreferrer" className="block text-forest underline">Portail officiel — rubrique Suivre</a>
 </div></section>
}
