import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createWorker } from 'tesseract.js'
import { readIdentity } from './identity'
import { suggestArabic } from './arabicName'

export type Identity = {last:string; first:string; lastAr:string|null; firstAr:string|null; cin:string; address:string}
export const emptyIdentity: Identity = { last:'',first:'',lastAr:null,firstAr:null,cin:'',address:'' }
export function arabicValues(value:Identity) {
  return { lastAr:value.lastAr ?? suggestArabic(value.last), firstAr:value.firstAr ?? suggestArabic(value.first) }
}
type Props = {value:Identity; update:Dispatch<SetStateAction<Identity>>; busy:boolean; onScan:(active:boolean)=>void}
export default function IdentityEntry({value,update,busy,onScan}:Props){
  const [mode,setMode]=useState<'keyboard'|'scan'>('keyboard')
  const [notice,setNotice]=useState('')
  const [raw,setRaw]=useState('')
  const scanning=useRef(false)
  const arabic=arabicValues(value)
  const edit=(key:keyof Identity,text:string)=>update(old=>({...old,[key]:text}))
  async function scan(file:File){
    if(scanning.current)return
    scanning.current=true
    onScan(true)
    setNotice('Lecture de la CIN en français et en arabe…')
    try {
      const worker=await createWorker(['fra','ara'],1,{ workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',workerBlobURL:false })
      const result=await worker.recognize(file).finally(()=>worker.terminate())
      setRaw(old=>[old,result.data.text].filter(Boolean).join('\n'))
      const fields=readIdentity(result.data.text)
      update(old=>({
        last:old.last||fields.last, first:old.first||fields.first,
        lastAr:old.lastAr??(fields.lastAr||null),firstAr:old.firstAr??(fields.firstAr||null),
        cin:old.cin||fields.cin,address:old.address||fields.address
      }))
      setNotice(Object.values(fields).some(Boolean)?'Photo lue. Vérifiez les champs et complétez ceux qui manquent.':'Aucun champ reconnu. Vous pouvez tout saisir au clavier.')
    } catch {setNotice('Lecture impossible. Vous pouvez saisir les champs au clavier ou choisir une autre photo.')}
    finally {scanning.current=false;onScan(false)}
  }
  return <fieldset disabled={busy} className="space-y-3"><legend className="font-semibold">Identité du client</legend>
    <div className="flex flex-wrap gap-2">{(['keyboard','scan'] as const).map(m=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>setMode(m)} className={'rounded-lg border px-4 py-2 '+(mode===m?'bg-forest text-white':'bg-white')}>{m==='keyboard'?'Saisir au clavier':'Scanner la CIN'}</button>)}</div>
    {mode==='scan'&&<label className="block">Photo de la CIN (recto, puis verso)<input className="input" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void scan(file)}}/></label>}
    <p role="status" className="text-sm">{notice}</p>
    {raw&&<details><summary>Texte lu sur la CIN</summary><pre dir="auto" className="whitespace-pre-wrap">{raw}</pre></details>}
    <div className="grid gap-3 sm:grid-cols-2">
      {(['last','first'] as const).map(key=>{
        const ar=key==='last'?'lastAr':'firstAr'
        const label=key==='last'?'Nom':'Prénom'
        return <div key={key} className="space-y-2"><label className="block">{label} en français<input className="input" value={value[key]} onChange={e=>edit(key,e.target.value)}/></label>
          <label className="block">{label} en arabe<input dir="rtl" lang="ar" className="input" value={arabic[ar]} onChange={e=>edit(ar,e.target.value)}/></label>
          {value[ar]===null && arabic[ar]&&<small>Suggestion à vérifier sur la CIN</small>}
          {value[ar]!==null && value[key]&&<button className="block text-xs underline" type="button" onClick={()=>update(old=>({...old,[ar]:null}))}>Reproposer en arabe</button>}
        </div>
      })}
      <label>Numéro de CIN<input className="input" value={value.cin} onChange={e=>edit('cin',e.target.value)}/></label>
      <label>Adresse<input className="input" dir="auto" value={value.address} onChange={e=>edit('address',e.target.value)}/></label>
    </div>
  </fieldset>
}
