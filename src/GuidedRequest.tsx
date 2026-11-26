import IdentityEntry, { emptyIdentity, arabicValues, type Identity } from './IdentityEntry'
import { useState, useEffect } from 'react'
import { supabase } from './session'
import type { Client } from './types'

import PortalLaunch from './PortalLaunch'
type Title = { office: string; number: string; index: string; special: string }
type Saved = {last_fr:string|null;first_fr:string|null;identity_number:string|null;id:string;client_id:string;last_ar:string;first_ar:string;address:string;email:string;titles:Title[];step:number;cpp:string;updated_at:string}
const emptyTitle = (): Title => ({office:'',number:'',index:'',special:''})
const steps = ['Préparer le formulaire','Vérifier les titres sur le portail','Valider le téléphone sur le portail','Payer sur la page bancaire','Conserver le reçu et le CPP','Attendre le SMS de disponibilité','Suivre et télécharger le certificat']
export default function GuidedRequest({clients}:{clients:Client[]}) {
 const [clientId,setClientId]=useState('')
 const [identity,setIdentity]=useState<Identity>(emptyIdentity)
 const [entryKey,setEntryKey]=useState(0)
 const {lastAr,firstAr}=arabicValues(identity)
 const address=identity.address
 const [email,setEmail]=useState('')
 const [titles,setTitles]=useState<Title[]>([emptyTitle()])
 const [step,setStep]=useState(0)
 const [cpp,setCpp]=useState('')
 const [saved,setSaved]=useState<Saved[]>([])
 const [id,setId]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [scanBusy,setScanBusy]=useState(false)
 async function load() {
  if(!supabase)return
  const {data,error}=await supabase.from('guided_cases').select('*').order('updated_at',{ascending:false})
  if(error){setMessage('Lecture impossible');return}
  setSaved((data||[]) as Saved[])
 }
 useEffect(()=>{void load()},[])
 function openCase(d:Saved){fillIdentity(d.client_id,d);setId(d.id);setClientId(d.client_id);setEmail(d.email);setTitles(d.titles.length?d.titles:[emptyTitle()]);setStep(d.step);setCpp(d.cpp);setMessage('Dossier chargé')}
 function reset(){fillIdentity('');setId('');setClientId('');setEmail('');setTitles([emptyTitle()]);setStep(0);setCpp('');setMessage('Nouveau dossier')}
 async function save(){
  if(!supabase||!clientId||busy)return
  setBusy(true);setMessage('')
  try{
   const payload={client_id:clientId,last_fr:identity.last,first_fr:identity.first,identity_number:identity.cin,last_ar:lastAr,first_ar:firstAr,address,email,titles,step,cpp,updated_at:new Date().toISOString()}
   const result=id?await supabase.from('guided_cases').update(payload).eq('id',id).select().single():await supabase.from('guided_cases').insert(payload).select().single()
   if(result.error)throw result.error
   setId(result.data.id);await load();setMessage('Dossier enregistré')
  }catch{setMessage('Échec de la sauvegarde. Réessayez.')}finally{setBusy(false)}
 }
 function fillIdentity(value:string,snapshot?:Saved){
  const c=clients.find(c=>c.id===value)
  setEntryKey(old=>old+1)
  setIdentity({last:snapshot?.last_fr??c?.lastName??'',first:snapshot?.first_fr??c?.firstName??'',cin:snapshot?.identity_number??c?.cin??'',
    lastAr:(snapshot?snapshot.last_ar:c?.lastAr)||null,firstAr:(snapshot?snapshot.first_ar:c?.firstAr)||null,address:(snapshot?snapshot.address:c?.address)||''})

 }
 const change=(i:number,key:keyof Title,value:string)=>setTitles(old=>old.map((t,j)=>i===j?{...t,[key]:value}:t))
 return <section className="space-y-5">
 <h1 className="text-2xl font-bold text-forest">Assistant ANCFCC — parcours guidé</h1>
 <p className="rounded-xl bg-amber-50 p-4 text-sm">Saisissez les noms en français ou scannez la CIN, puis vérifiez les champs et renseignez les titres. Le favori remplit le formulaire dans votre navigateur. Vous pouvez aussi choisir un client pour enregistrer son dossier.</p>
 <div className="space-y-3 rounded-2xl bg-white p-5">
 <button disabled={busy||scanBusy} onClick={reset} className="rounded-lg border p-2">Nouveau dossier</button>
 <label>Dossiers enregistrés<select disabled={busy||scanBusy} className="input" value={id} onChange={e=>{const d=saved.find(x=>x.id===e.target.value);if(d)openCase(d);else reset()}}><option value="">Nouveau dossier</option>{saved.map(d=><option key={d.id} value={d.id}>{clients.find(c=>c.id===d.client_id)?.lastName||'Client'} · {d.titles.map(t=>t.number+'/'+t.index).join(', ')} · {new Date(d.updated_at).toLocaleDateString()}</option>)}</select></label>
 <label>Client<select className="input" value={clientId} disabled={scanBusy||busy} onChange={e=>{setId('');setClientId(e.target.value);fillIdentity(e.target.value);setEmail('');setTitles([emptyTitle()]);setCpp('');setStep(0)}}><option value="">Choisir un client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></label>
 <IdentityEntry key={entryKey} value={identity} update={setIdentity} busy={busy||scanBusy} onScan={setScanBusy}/>
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
 <PortalLaunch draft={{fields:{TextBoxNom:identity.last,TextBoxPrenom:identity.first,TextBoxIdentifiant:identity.cin,TextBoxNomAr:lastAr,TextBoxPrenomAr:firstAr,TextBoxAdresse:address,TextBoxEmail:email},titles}}/>
 <a href="https://www.ancfcc.gov.ma/certificatspage/" target="_blank" rel="noopener noreferrer" className="underline">Ouvrir le portail en saisie manuelle</a>
 </div>
 <div className="space-y-3 rounded-2xl bg-white p-5"><h2 className="font-bold">Checklist manuelle (non vérifiée par ANCFCC)</h2>
 {steps.map((s,i)=><label key={s} className="flex items-center gap-3"><input type="checkbox" checked={i<step} disabled={i>step} onChange={()=>setStep(i<step?i:i+1)}/>{s}</label>)}
 <label>Code de suivi CPP<input className="input" value={cpp} onChange={e=>setCpp(e.target.value)} autoComplete="off"/></label>
 <a href="https://www.ancfcc.gov.ma/" target="_blank" rel="noopener noreferrer" className="block text-forest underline">Portail officiel — rubrique Suivre</a>
 <button disabled={busy||scanBusy||!clientId} onClick={save} className="w-full rounded-xl bg-forest p-3 text-white disabled:opacity-50">{busy?'Enregistrement…':'Enregistrer le dossier'}</button>
 <p role="status">{message}</p>
 </div></section>
}
