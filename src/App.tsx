import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Bell, ChevronRight, Download, FileText, FolderOpen, LayoutDashboard,
  Menu, Plus, Printer, Search, Settings, Share2, ShieldCheck, Smartphone, Upload,
  Users, WalletCards, X, Camera, CheckCircle2, Clock3, AlertCircle
} from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { api } from './api'
import GuidedRequest from './GuidedRequest'
import type { Client, Demand, RequestStatus } from './types'

type Section = 'dashboard' | 'clients' | 'demands' | 'documents' | 'finance' | 'guided'

const statusLabels: Record<RequestStatus, string> = {
  brouillon: 'Brouillon',
  en_cours: 'En cours',
  code_sms: 'Code SMS requis',
  confirmation_paiement: 'Confirmer paiement',
  terminee: 'Terminée',
  erreur: 'Erreur'
}

const statusColors: Record<RequestStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-600',
  en_cours: 'bg-blue-50 text-blue-700',
  code_sms: 'bg-amber-50 text-amber-700',
  confirmation_paiement: 'bg-orange-50 text-orange-700',
  terminee: 'bg-emerald-50 text-emerald-700',
  erreur: 'bg-red-50 text-red-700'
}

function App() {
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [demandModal, setDemandModal] = useState(false)
  const [smsModal, setSmsModal] = useState<Demand | null>(null)
  const [paymentModal, setPaymentModal] = useState<Demand | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [demands, setDemands] = useState<Demand[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const [nextClients, nextDemands] = await Promise.all([api.clients.list(), api.demands.list()])
      setClients(nextClients)
      setDemands(nextDemands)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion API indisponible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const filteredDemands = useMemo(() => {
    const term = search.toLowerCase()
    return demands.filter((d) =>
      d.clientName.toLowerCase().includes(term) ||
      d.landTitle.toLowerCase().includes(term) ||
      d.id.toLowerCase().includes(term)
    )
  }, [demands, search])

  async function validateSms(code: string) {
    if (!smsModal) return
    if (!/^\d{4,8}$/.test(code)) throw new Error('Code SMS invalide')
    await api.demands.validateSms(smsModal.id, code)
    setSmsModal(null)
    await refresh()
  }

  async function confirmPayment(demand: Demand) {
    await api.demands.confirmPayment(demand.id)
    setPaymentModal(null)
    await refresh()
  }

  const navItems = [
    { id: 'dashboard' as const, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'clients' as const, label: 'Clients', icon: Users },
    { id: 'demands' as const, label: 'Demandes', icon: FileText },
    { id: 'guided' as const, label: 'Assistant ANCFCC', icon: ShieldCheck },
    { id: 'documents' as const, label: 'Documents', icon: FolderOpen },
    { id: 'finance' as const, label: 'Finances', icon: WalletCards }
  ]

  return (
    <div className="min-h-screen bg-cream">
      {sidebarOpen && <button aria-label="Fermer" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-forest text-white transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-lg font-bold text-gold">A</div>
          <div><p className="font-semibold leading-tight">ANCFCC</p><p className="text-xs text-white/60">Agent Pro</p></div>
          <button className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${section === item.id ? 'bg-white text-forest shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={19} /><span>{item.label}</span>
              {item.id === 'demands' && demands.some((d) => d.status === 'code_sms') && <span className="ml-auto h-2 w-2 rounded-full bg-gold" />}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={15} /> Session sécurisée</div>
            <p className="mt-2 text-sm font-medium">Administrateur</p>
            <button className="mt-3 flex items-center gap-2 text-xs text-white/60"><Settings size={14} /> Paramètres</button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="mr-3 rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client, CIN ou titre foncier..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/10" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600" aria-label="Notifications"><Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" /></button>
            <div className="ml-2 hidden h-10 w-10 place-items-center rounded-full bg-forest text-sm font-semibold text-white sm:grid">AO</div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {error && <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={18} /> {error}</div>}
          {section === 'dashboard' && <Dashboard demands={demands} clients={clients} loading={loading} onNewClient={() => setClientModal(true)} onNewDemand={() => setDemandModal(true)} onDemand={(d) => d.status === 'code_sms' ? setSmsModal(d) : d.status === 'confirmation_paiement' ? setPaymentModal(d) : undefined} />}
          {section === 'clients' && <ClientsSection clients={clients} search={search} onNew={() => setClientModal(true)} />}
          {section === 'demands' && <DemandsSection demands={filteredDemands} loading={loading} onNew={() => setDemandModal(true)} onSms={setSmsModal} onPayment={setPaymentModal} />}
          {section === 'documents' && <DocumentsSection demands={demands} search={search} />}
          {section === 'finance' && <FinanceSection demands={demands} />}
          {section === 'guided' && <GuidedRequest clients={clients} />}
        </div>
      </main>

      {clientModal && <ClientModal onClose={() => setClientModal(false)} onCreated={async () => { setClientModal(false); await refresh() }} />}
      {demandModal && <DemandModal clients={clients} onClose={() => setDemandModal(false)} onCreated={async (demand) => {
        setDemandModal(false)
        await refresh()
        if (demand.status === 'code_sms') setSmsModal(demand)
      }} />}
      {smsModal && <SmsModal demand={smsModal} onClose={() => setSmsModal(null)} onValidate={validateSms} />}
      {paymentModal && <PaymentModal demand={paymentModal} onClose={() => setPaymentModal(null)} onConfirm={() => confirmPayment(paymentModal)} />}
    </div>
  )
}

function Dashboard({ demands, clients, loading, onNewClient, onNewDemand, onDemand }: {
  demands: Demand[]; clients: Client[]; loading: boolean; onNewClient: () => void; onNewDemand: () => void; onDemand: (d: Demand) => void
}) {
  const stats = [
    { label: 'Demandes actives', value: demands.filter((d) => d.status !== 'terminee').length, icon: FileText, color: 'text-blue-700 bg-blue-50' },
    { label: 'Clients', value: clients.length, icon: Users, color: 'text-violet-700 bg-violet-50' },
    { label: 'Terminées', value: demands.filter((d) => d.status === 'terminee').length, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Bénéfice mensuel', value: `${demands.reduce((n, d) => n + d.serviceFee, 0).toLocaleString('fr-MA')} MAD`, icon: BarChart3, color: 'text-amber-700 bg-amber-50' }
  ]
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-slate-500">Bienvenue</p><h1 className="mt-1 text-2xl font-bold text-forest">Tableau de bord</h1></div>
        <div className="flex gap-2">
          <button onClick={onNewClient} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-forest"><Plus size={18} /> Nouveau client</button>
          <button onClick={onNewDemand} className="flex h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white shadow-lg shadow-forest/15"><Plus size={18} /> Nouvelle demande</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between"><div className={`grid h-11 w-11 place-items-center rounded-xl ${stat.color}`}><stat.icon size={21} /></div></div>
          <p className="mt-5 text-2xl font-bold text-slate-800">{loading ? '—' : stat.value}</p><p className="mt-1 text-sm text-slate-500">{stat.label}</p>
        </div>)}
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-800">Demandes récentes</h2><button className="text-sm font-medium text-forest">Voir tout</button></div>
        <div className="divide-y divide-slate-100">
          {demands.slice(0, 6).map((d) => <button key={d.id} onClick={() => onDemand(d)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest/8 text-forest"><FileText size={18} /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{d.clientName}</p><p className="mt-0.5 text-xs text-slate-500">{d.id} · Titre {d.landTitle}</p></div>
            <span className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline ${statusColors[d.status]}`}>{statusLabels[d.status]}</span>
            <ChevronRight size={18} className="text-slate-300" />
          </button>)}
          {!demands.length && <div className="py-12 text-center text-sm text-slate-400">Aucune demande pour le moment</div>}
        </div>
      </section>
    </div>
  )
}

function ClientsSection({ clients, search, onNew }: { clients: Client[]; search: string; onNew: () => void }) {
  const filtered = clients.filter((c) =>
    `${c.firstName} ${c.lastName} ${c.cin} ${c.landTitle}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div>
      <PageHeader title="Gestion des clients" subtitle={`${clients.length} dossiers clients`} action="Nouveau client" onAction={onNew} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => (
          <div key={client.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-forest text-sm font-bold text-white">{client.firstName[0]}{client.lastName[0]}</div>
              <div className="min-w-0"><h3 className="truncate font-semibold text-slate-800">{client.firstName} {client.lastName}</h3><p className="text-xs text-slate-500">CIN {client.cin || '—'}</p></div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div><p className="text-xs text-slate-400">Téléphone</p><p className="mt-1 text-slate-700">{client.phone || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Titre foncier</p><p className="mt-1 text-slate-700">{client.landTitle || '—'}</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400"><span>{client.requests} demande(s)</span><button className="font-semibold text-forest">Voir le dossier</button></div>
          </div>
        ))}
      </div>
      {!filtered.length && <EmptyState icon={Users} title="Aucun client trouvé" text="Créez un dossier ou modifiez votre recherche." />}
    </div>
  )
}

function DemandsSection({ demands, loading, onNew, onSms, onPayment }: {
  demands: Demand[]; loading: boolean; onNew: () => void; onSms: (d: Demand) => void; onPayment: (d: Demand) => void
}) {
  return (
    <div>
      <PageHeader title="File des demandes" subtitle="Suivi en temps réel" action="Nouvelle demande" onAction={onNew} />
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_.8fr_44px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-medium text-slate-400 md:grid">
          <span>Demande / Client</span><span>Titre foncier</span><span>Montant</span><span>Statut</span><span />
        </div>
        {demands.map((d) => (
          <div key={d.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_.8fr_44px] md:items-center">
            <div><p className="text-sm font-semibold text-slate-800">{d.clientName}</p><p className="mt-1 text-xs text-slate-400">{d.id}</p></div>
            <p className="text-sm text-slate-600">{d.landTitle}</p>
            <p className="text-sm font-medium text-slate-700">{(d.ancfccFee + d.serviceFee).toLocaleString('fr-MA')} MAD</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusColors[d.status]}`}>{statusLabels[d.status]}</span>
            {(d.status === 'code_sms' || d.status === 'confirmation_paiement') &&
              <button onClick={() => d.status === 'code_sms' ? onSms(d) : onPayment(d)} className="grid h-9 w-9 place-items-center rounded-lg bg-forest text-white"><ChevronRight size={17} /></button>}
          </div>
        ))}
        {!loading && !demands.length && <EmptyState icon={FileText} title="Aucune demande" text="Ajoutez une demande à la file d’attente." />}
      </div>
    </div>
  )
}

function DocumentsSection({ demands, search }: { demands: Demand[]; search: string }) {
  const documents = demands.filter((d) => d.status === 'terminee' && `${d.clientName} ${d.landTitle} ${d.id}`.toLowerCase().includes(search.toLowerCase()))
  function exportCertificate(d: Demand) {
    window.print()
  }
  return (
    <div>
      <PageHeader title="Gestion documentaire" subtitle={`${documents.length} certificats disponibles`} />
      {documents.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((d) => <div key={d.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FileText size={23} /></div>
          <h3 className="mt-4 font-semibold text-slate-800">{d.clientName}</h3>
          <p className="mt-1 text-sm text-slate-500">Titre foncier {d.landTitle}</p>
          <div className="mt-5 flex gap-2 no-print">
            <button onClick={() => exportCertificate(d)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Download size={15} /> PDF</button>
            <button onClick={() => window.print()} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600" aria-label="Imprimer"><Printer size={15} /></button>
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Certificat ANCFCC - ${d.clientName} - ${d.id}`)}`)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600" aria-label="Partager"><Share2 size={15} /></button>
          </div>
        </div>)}
      </div> : <EmptyState icon={FolderOpen} title="Aucun document" text="Les certificats terminés apparaîtront ici." />}
    </div>
  )
}

function FinanceSection({ demands }: { demands: Demand[] }) {
  const totalAncfcc = demands.reduce((n, d) => n + d.ancfccFee, 0)
  const totalService = demands.reduce((n, d) => n + d.serviceFee, 0)
  const paid = demands.filter((d) => d.paymentConfirmed).reduce((n, d) => n + d.ancfccFee + d.serviceFee, 0)
  function exportExcel() {
    const safe = (v: string | number) => {
      const s = String(v)
      return '"' + (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'
    }
    const rows = [['Demande','Client','Titre foncier','Frais ANCFCC','Frais de service','Montant payé','Statut'], ...demands.map(d => [d.id,d.clientName,d.landTitle,d.ancfccFee,d.serviceFee,d.paymentConfirmed ? d.ancfccFee+d.serviceFee : 0,statusLabels[d.status]])]
    const blob = new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download='ancfcc-finances.csv'; a.click()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return (
    <div>
      <PageHeader title="Gestion financière" subtitle="Synthèse des opérations" action="Exporter Excel" onAction={exportExcel} />
      <div className="grid gap-4 sm:grid-cols-3">
        <FinanceCard label="Frais ANCFCC" value={totalAncfcc} />
        <FinanceCard label="Frais de service" value={totalService} accent />
        <FinanceCard label="Montant encaissé" value={paid} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Historique financier</h2></div>
        {demands.map((d) => <div key={d.id} className="flex items-center border-b border-slate-100 px-5 py-4 last:border-0">
          <div className="flex-1"><p className="text-sm font-semibold">{d.clientName}</p><p className="text-xs text-slate-400">{d.id}</p></div>
          <p className="text-sm font-semibold text-forest">{(d.ancfccFee + d.serviceFee).toLocaleString('fr-MA')} MAD</p>
        </div>)}
      </div>
    </div>
  )
}

function FinanceCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-2xl p-6 ${accent ? 'bg-gold text-forest' : 'bg-white text-slate-800 shadow-card'}`}>
    <p className="text-sm opacity-70">{label}</p><p className="mt-3 text-2xl font-bold">{value.toLocaleString('fr-MA')} MAD</p>
  </div>
}

function PageHeader({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-forest">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
    {action && onAction && <button onClick={onAction} className="flex h-11 items-center gap-2 rounded-xl bg-forest px-4 text-sm font-semibold text-white"><Plus size={18} /> {action}</button>}
  </div>
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center"><Icon size={28} className="mx-auto text-slate-300" /><h3 className="mt-3 font-semibold text-slate-700">{title}</h3><p className="mt-1 text-sm text-slate-400">{text}</p></div>
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <h2 className="text-lg font-bold text-forest">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cin, setCin] = useState('')
  const [phone, setPhone] = useState('')
  const [landTitle, setLandTitle] = useState('')
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function scanDocument(file: File, side: 'front' | 'back') {
    if (side === 'front') setFront(file); else setBack(file)
    setOcrLoading(true)
    setError('')
    try {
      const worker = await createWorker(['fra', 'ara'])
      const result = await worker.recognize(file)
      await worker.terminate()
      setOcrText((text) => `${text}${text ? '\n' : ''}${result.data.text}`)
    } catch (err) {
      setError('OCR indisponible. Vous pouvez saisir les informations manuellement.')
    } finally {
      setOcrLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nom et prénom sont requis')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.clients.create({ firstName: firstName.trim(), lastName: lastName.trim(), cin: cin.trim(), phone: phone.trim(), landTitle: landTitle.trim() })
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Créer une fiche client" onClose={onClose} wide>
      <form onSubmit={submit} className="p-6">
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" /></Field>
              <Field label="Nom"><input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" /></Field>
            </div>
            <Field label="Numéro CIN"><input value={cin} onChange={(e) => setCin(e.target.value)} className="input" /></Field>
            <Field label="Téléphone"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+212 ..." /></Field>
            <Field label="Titre foncier"><input value={landTitle} onChange={(e) => setLandTitle(e.target.value)} className="input" /></Field>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Scan de la CIN</h3>
            <div className="grid grid-cols-2 gap-3">
              <ScanBox label="Recto" file={front} onFile={(file) => scanDocument(file, 'front')} />
              <ScanBox label="Verso" file={back} onFile={(file) => scanDocument(file, 'back')} />
            </div>
            {ocrLoading && <p className="flex items-center gap-2 text-sm text-slate-500"><Clock3 size={16} className="animate-spin" /> Extraction OCR en cours...</p>}
            <Field label="Texte OCR — vérification manuelle">
              <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} rows={5} dir="auto" className="input resize-none" placeholder="Les informations détectées apparaîtront ici..." />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Annuler</button>
          <button type="submit" disabled={saving} className="h-11 rounded-xl bg-forest px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Création...' : 'Créer le client'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ScanBox({ label, file, onFile }: { label: string; file: File | null; onFile: (file: File) => void }) {
  return (
    <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-gold">
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {file ? <div><CheckCircle2 className="mx-auto text-emerald-600" size={24} /><p className="mt-2 text-xs font-medium text-slate-600">{label} capturé</p></div> : <div><Camera className="mx-auto text-slate-400" size={24} /><p className="mt-2 text-xs font-medium text-slate-600">Scanner {label}</p></div>}
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-slate-500">{label}</span>{children}</label>
}

function DemandModal({ clients, onClose, onCreated }: {
  clients: Client[]; onClose: () => void; onCreated: (demand: Demand) => Promise<void>
}) {
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [landTitle, setLandTitle] = useState(clients[0]?.landTitle || '')
  const [ancfccFee, setAncfccFee] = useState(250)
  const [serviceFee, setServiceFee] = useState(150)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) { setError('Sélectionnez un client'); return }
    setSaving(true)
    setError('')
    try {
      const demand = await api.demands.create({ clientId, landTitle, ancfccFee, serviceFee })
      await onCreated(demand)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer la demande')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Nouvelle demande" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-6">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Field label="Client"><select value={clientId} onChange={(e) => {
          const client = clients.find((c) => c.id === e.target.value)
          setClientId(e.target.value)
          setLandTitle(client?.landTitle || '')
        }} className="input"><option value="">Sélectionner...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.cin}</option>)}</select></Field>
        <Field label="Titre foncier"><input value={landTitle} onChange={(e) => setLandTitle(e.target.value)} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frais ANCFCC (MAD)"><input type="number" min="0" value={ancfccFee} onChange={(e) => setAncfccFee(Number(e.target.value))} className="input" /></Field>
          <Field label="Frais de service (MAD)"><input type="number" min="0" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} className="input" /></Field>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Mode simulation.</strong> Aucun paiement réel ni navigateur externe ne sera lancé.
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Annuler</button>
          <button type="submit" disabled={saving || !clients.length} className="h-11 rounded-xl bg-forest px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Création...' : 'Créer la demande'}</button>
        </div>
      </form>
    </Modal>
  )
}

function SmsModal({ demand, onClose, onValidate }: { demand: Demand; onClose: () => void; onValidate: (code: string) => Promise<void> }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try { await onValidate(code); setCode('') } catch (err) { setError(err instanceof Error ? err.message : 'Code invalide') } finally { setLoading(false) }
  }
  return (
    <Modal title="Validation par code SMS" onClose={onClose}>
      <form onSubmit={submit} className="p-6">
        <div className="rounded-2xl bg-forest/5 p-4 text-sm text-slate-600"><Smartphone className="mb-2 text-forest" size={22} /><p>Une validation humaine est requise pour <strong>{demand.clientName}</strong>.</p></div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5">
          <Field label="Code reçu sur le téléphone">
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="input text-center text-xl tracking-[0.5em]" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-400">Le code n’est jamais enregistré ni conservé côté serveur.</p>
        <button type="submit" disabled={loading || code.length < 4} className="mt-6 h-11 w-full rounded-xl bg-forest text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Validation...' : 'Valider et reprendre'}</button>
      </form>
    </Modal>
  )
}

function PaymentModal({ demand, onClose, onConfirm }: { demand: Demand; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  async function confirm() {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }
  return (
    <Modal title="Confirmation de paiement" onClose={onClose}>
      <div className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Montant à préparer</p>
          <p className="mt-2 text-3xl font-bold text-forest">{(demand.ancfccFee + demand.serviceFee).toLocaleString('fr-MA')} MAD</p>
          <div className="mt-4 flex justify-between text-sm"><span className="text-slate-500">Frais ANCFCC</span><strong>{demand.ancfccFee} MAD</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Frais de service</span><strong>{demand.serviceFee} MAD</strong></div>
        </div>
        <p className="mt-4 text-sm text-slate-500">Aucun paiement n’est déclenché automatiquement. Confirmez uniquement après validation explicite de l’opérateur.</p>
        <button onClick={confirm} disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-forest text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Confirmation...' : 'Confirmer le paiement simulé'}</button>
      </div>
    </Modal>
  )
}

export default App
