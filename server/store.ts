import type { Client, Demand, RequestStatus } from '../src/types.js'

interface CreateClientInput {
  firstName: string
  lastName: string
  cin: string
  phone: string
  landTitle: string
}

interface CreateDemandInput {
  clientId: string
  clientName: string
  landTitle: string
  ancfccFee: number
  serviceFee: number
}

const now = () => new Date().toISOString()

export function createInMemoryStore() {
  let clients: Client[] = [
    { id: 'CL-1001', firstName: 'Amina', lastName: 'El Mansouri', cin: 'BE123456', phone: '+212 600 00 00 01', landTitle: 'TF-45821', createdAt: now(), requests: 2 },
    { id: 'CL-1002', firstName: 'Youssef', lastName: 'Alaoui', cin: 'K123456', phone: '+212 600 00 00 02', landTitle: 'TF-17452', createdAt: now(), requests: 1 }
  ]
  let demands: Demand[] = [
    { id: 'REQ-2026-0001', clientId: 'CL-1001', clientName: 'Amina El Mansouri', landTitle: 'TF-45821', status: 'code_sms', ancfccFee: 250, serviceFee: 150, createdAt: now(), updatedAt: now(), history: [{ at: now(), label: 'Simulation démarrée' }, { at: now(), label: 'Code SMS demandé' }], paymentConfirmed: false }
  ]

  function touch(demand: Demand, status: RequestStatus, label: string) {
    demand.status = status
    demand.updatedAt = now()
    demand.history.push({ at: demand.updatedAt, label })
  }

  return {
    listClients: () => clients,
    findClient: (id: string) => clients.find((client) => client.id === id),
    createClient: (input: CreateClientInput) => {
      const client: Client = {
        id: `CL-${String(Date.now()).slice(-8)}`,
        ...input,
        createdAt: now(),
        requests: 0
      }
      clients = [client, ...clients]
      return client
    },
    listDemands: () => demands,
    findActiveDuplicate: (clientId: string, landTitle: string) =>
      demands.find((demand) => demand.clientId === clientId && demand.landTitle === landTitle && demand.status !== 'terminee' && demand.status !== 'erreur'),
    createDemand: (input: CreateDemandInput) => {
      const timestamp = now()
      const demand: Demand = {
        id: `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        ...input,
        status: 'en_cours',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: [{ at: timestamp, label: 'Demande créée' }],
        paymentConfirmed: false
      }
      demands = [demand, ...demands]
      const client = clients.find((item) => item.id === input.clientId)
      if (client) client.requests += 1
      return demand
    },
    advanceDemand: (id: string) => {
      const demand = demands.find((item) => item.id === id)
      if (demand) touch(demand, 'code_sms', 'Validation SMS requise')
    },
    validateSms: (id: string) => {
      const demand = demands.find((item) => item.id === id)
      if (!demand || demand.status !== 'code_sms') return undefined
      touch(demand, 'confirmation_paiement', 'Code SMS validé par l’opérateur')
      return demand
    },
    confirmPayment: (id: string) => {
      const demand = demands.find((item) => item.id === id)
      if (!demand || demand.status !== 'confirmation_paiement') return undefined
      demand.paymentConfirmed = true
      touch(demand, 'terminee', 'Paiement simulé confirmé — certificat disponible')
      demand.certificateUrl = `/api/certificates/${demand.id}.pdf`
      return demand
    }
  }
}
