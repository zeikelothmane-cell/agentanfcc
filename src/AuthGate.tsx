import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from './session'
import type { Session } from '@supabase/supabase-js'
export default function AuthGate({children}:{children:ReactNode}) {
 const [session,setSession]=useState<Session|null>(null)
 const [ready,setReady]=useState(false)
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{
  if(!supabase){setReady(true);return}
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{setSession(s);setReady(true)})
  return ()=>subscription.unsubscribe()
 },[])
 if(!ready)return <p>Chargement…</p>
 if(!supabase)return <p>Configuration Supabase requise.</p>
 if(session)return <><div className="flex justify-end p-2"><button onClick={()=>void supabase?.auth.signOut()}>Déconnexion</button></div>{children}</>
 return <form className="mx-auto mt-20 max-w-sm space-y-4 p-6" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const {error}=await supabase!.auth.signInWithPassword({email,password});if(error)setError('Connexion refusée')}catch{setError('Connexion indisponible')}finally{setBusy(false)}}}>
 <h1 className="text-xl font-bold">ANCFCC Agent Pro — Connexion</h1>
 <label>Email<input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Mot de passe<input className="input" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
 {error&&<p role="alert">{error}</p>}<button disabled={busy} className="rounded bg-forest p-3 text-white">Se connecter</button></form>
}
