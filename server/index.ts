import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { authenticate } from './security.js'
import { createAutomationAdapter } from './automation.js'

const app = express()
const port = Number(process.env.PORT || 3001)

const automation = createAutomationAdapter('simulation')

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({origin:false}))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: automation.mode })
})

app.use('/api', authenticate, (_req,res,next)=>{res.set('Cache-Control','no-store');next()})
const clientSchema = z.object({firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100),cin:z.string().trim().max(30).default(''),phone:z.string().trim().max(30).default(''),landTitle:z.string().trim().max(100).default('')})
const demandSchema=z.object({clientId:z.string().uuid(),landTitle:z.string().trim().min(1).max(100),ancfccFee:z.number().nonnegative().max(100000),serviceFee:z.number().nonnegative().max(100000)})
const clientView=(c:any)=>({id:c.id,firstName:c.first_name,lastName:c.last_name,cin:c.cin||'',phone:c.phone||'',landTitle:c.land_title||'',createdAt:c.created_at,requests:0})
const demandView=(d:any)=>({id:d.id,clientId:d.client_id,clientName:[d.clients?.first_name,d.clients?.last_name].filter(Boolean).join(' '),landTitle:d.land_title,status:({draft:'brouillon',in_progress:'en_cours',sms_required:'code_sms',payment_confirmation:'confirmation_paiement',completed:'terminee',error:'erreur'} as Record<string,string>)[d.status],ancfccFee:Number(d.ancfcc_fee),serviceFee:Number(d.service_fee),createdAt:d.created_at,updatedAt:d.updated_at,history:[],paymentConfirmed:false})
app.get('/api/clients',async(_req,res)=>{try{const {data,error}=await res.locals.db.from('clients').select('*').order('created_at',{ascending:false});if(error)throw error;res.json({clients:data.map(clientView)})}catch{res.status(500).json({error:'Lecture impossible'})}})
app.post('/api/clients',async(req,res)=>{const p=clientSchema.safeParse(req.body);if(!p.success){res.status(400).json({error:'Données invalides'});return}try{const c=p.data;const {data,error}=await res.locals.db.from('clients').insert({owner_id:res.locals.owner,first_name:c.firstName,last_name:c.lastName,cin:c.cin,phone:c.phone,land_title:c.landTitle}).select().single();if(error)throw error;res.status(201).json({client:clientView(data)})}catch{res.status(500).json({error:'Création impossible'})}})
app.get('/api/demands',async(_req,res)=>{try{const {data,error}=await res.locals.db.from('demands').select('*,clients!demands_client_owner_fk(first_name,last_name)').order('created_at',{ascending:false});if(error)throw error;res.json({demands:data.map(demandView)})}catch{res.status(500).json({error:'Lecture impossible'})}})
app.post('/api/demands',async(req,res)=>{const p=demandSchema.safeParse(req.body);if(!p.success){res.status(400).json({error:'Données invalides'});return}try{const d=p.data;const {data,error}=await res.locals.db.from('demands').insert({id:randomUUID(),owner_id:res.locals.owner,client_id:d.clientId,land_title:d.landTitle,status:'sms_required',ancfcc_fee:d.ancfccFee,service_fee:d.serviceFee}).select('*,clients!demands_client_owner_fk(first_name,last_name)').single();if(error){res.status(error.code==='23505'?409:400).json({error:'Demande refusée'});return}res.status(201).json({demand:demandView(data)})}catch{res.status(500).json({error:'Création impossible'})}})
app.post('/api/demands/:id/sms',(_req,res)=>{res.status(409).json({error:'Validation désactivée pendant la sécurisation V2. Ne saisissez aucun code réel.'})})
app.post('/api/demands/:id/payment',(_req,res)=>{res.status(409).json({error:'Paiement désactivé pendant la sécurisation V2.'})})

if (process.env.NODE_ENV === 'production') {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(dirname, '../dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(port, '0.0.0.0', () => {
  console.log(`ANCFCC Agent Pro API on http://0.0.0.0:${port} (${automation.mode})`)
})
