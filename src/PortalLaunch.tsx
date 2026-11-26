import { useEffect, useRef, useState } from 'react'
import assistant from './portal-assistant.js?raw'

const portal = 'https://www.ancfcc.gov.ma'
const favourite = 'javascript:' + encodeURIComponent('void ' + assistant.slice(assistant.indexOf('(async')))
type Title = { office: string; number: string; index: string; special: string }
type Draft = { fields: Record<string,string>; titles: Title[] }

export default function PortalLaunch({ draft }: { draft: Draft }) {
  const pending = useRef<{tab: Window; draft: Draft; expires: number} | null>(null)
  const [notice, setNotice] = useState('')
  const [showCode, setShowCode] = useState(false)
  useEffect(() => {
    pending.current = null
    const receive = (event: MessageEvent) => {
      const current = pending.current
      if (!current || event.origin !== portal || event.source !== current.tab ||
          event.data !== 'ancfcc:request-draft' || !event.ports[0] || Date.now() >= current.expires) return
      event.ports[0].postMessage(current.draft)
      event.ports[0].close()
      pending.current = null
      setNotice('Dossier transmis à l’onglet officiel.')
    }
    window.addEventListener('message', receive)
    return () => { pending.current = null; window.removeEventListener('message', receive) }
  }, [JSON.stringify(draft)])
  function start() {
    if (Object.entries(draft.fields).some(([key,value]) => key !== 'TextBoxEmail' && !value.trim()) ||
        !draft.titles.length || draft.titles.some(t => !t.office.trim() || !t.number || !t.index.trim())) {
      setNotice('Complétez les noms français et arabes, la CIN, l’adresse, la conservation, le numéro et l’indice de chaque titre.')
      return
    }
    const tab = window.open(portal + '/certificatspage/', '_blank')
    if (!tab) { setNotice('Autorisez l’ouverture du formulaire dans un nouvel onglet.'); return }
    pending.current = { tab, draft, expires: Date.now() + 600000 }
    setNotice('Dans le nouvel onglet, touchez le favori « Remplir ANCFCC ».')
  }
  return <div className="space-y-3">
    <details><summary>Installer le favori « Remplir ANCFCC » dans Safari</summary>
      <p>Une seule fois, ajoutez cette page aux favoris. Modifiez ce favori, nommez-le « Remplir ANCFCC » et remplacez son adresse par le code copié ci-dessous.</p>
      <button type="button" className="rounded-lg border p-2" onClick={async () => {
        try { await navigator.clipboard.writeText(favourite); setNotice('Adresse du favori copiée.') }
        catch { setShowCode(true) }
      }}>Copier l’adresse du favori</button>
      {showCode && <textarea aria-label="Adresse à copier" readOnly value={favourite} onFocus={e=>e.target.select()} />}
    </details>
    <button type="button" className="w-full rounded-xl bg-forest p-3 text-white" onClick={start}>Ouvrir et préremplir le formulaire officiel</button>
    <p className="text-sm">Dans le nouvel onglet, activez le favori. Saisissez le CAPTCHA puis acceptez les mentions légales pour continuer sur le portail.</p>
    <p role="status">{notice}</p>
  </div>
}
