import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { createInMemoryStore } from './store.js'
import { createAutomationAdapter } from './automation.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const store = createInMemoryStore()
const automation = createAutomationAdapter(process.env.ANCFCC_AUTOMATION_MODE || 'simulation')

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: automation.mode })
})

app.get('/api/clients', (_req, res) => {
  res.json({ clients: store.listClients() })
})

const clientSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  cin: z.string().trim().max(30).default(''),
  phone: z.string().trim().max(30).default(''),
  landTitle: z.string().trim().max(100).default('')
})

app.post('/api/clients', (req, res) => {
  const parsed = clientSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Données invalides' })
    return
  }
  const client = store.createClient(parsed.data)
  res.status(201).json({ client })
})

app.get('/api/demands', (_req, res) => {
  res.json({ demands: store.listDemands() })
})

const demandSchema = z.object({
  clientId: z.string().min(1),
  landTitle: z.string().trim().min(1).max(100),
  ancfccFee: z.number().nonnegative(),
  serviceFee: z.number().nonnegative()
})

app.post('/api/demands', (req, res) => {
  const parsed = demandSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Données invalides' })
    return
  }
  const existing = store.findActiveDuplicate(parsed.data.clientId, parsed.data.landTitle)
  if (existing) {
    res.status(409).json({ error: 'Une demande active existe déjà pour ce client et ce titre foncier.', demand: existing })
    return
  }
  const client = store.findClient(parsed.data.clientId)
  if (!client) {
    res.status(404).json({ error: 'Client introuvable' })
    return
  }
  const demand = store.createDemand({ ...parsed.data, clientName: `${client.firstName} ${client.lastName}` })
  res.status(201).json({ demand })
  void automation.start(demand.id).then(() => {
    store.advanceDemand(demand.id)
  })
})

app.post('/api/demands/:id/sms', (req, res) => {
  const smsSchema = z.object({
    code: z.string().regex(/^\d{4,8}$/)
  })
  const parsed = smsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Code SMS invalide' })
    return
  }
  const demand = store.validateSms(req.params.id)
  if (!demand) {
    res.status(409).json({ error: 'La demande n’attend pas de validation SMS' })
    return
  }
  void automation.resume(req.params.id, 'sms')
  res.json({ demand })
})

app.post('/api/demands/:id/payment', (req, res) => {
  const demand = store.confirmPayment(req.params.id)
  if (!demand) {
    res.status(409).json({ error: 'La validation SMS doit précéder la confirmation de paiement' })
    return
  }
  void automation.resume(req.params.id, 'payment')
  res.json({ demand })
})

if (process.env.NODE_ENV === 'production') {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(dirname, '../dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(port, '0.0.0.0', () => {
  console.log(`ANCFCC Agent Pro API on http://0.0.0.0:${port} (${automation.mode})`)
})
