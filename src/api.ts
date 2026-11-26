import { supabase } from './session'
import type { Client, Demand } from './types'

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const session = await supabase?.auth.getSession()
  const token = session?.data.session?.access_token
  if (!token) throw new Error('Connexion requise')
  const headers = new Headers(init?.headers)
  headers.set('Authorization', 'Bearer ' + token)
  const response = await fetch(url, { ...init, headers, cache: 'no-store' })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Une erreur est survenue')
  }
  return response.json() as Promise<T>
}

export const api = {
  clients: {
    list: () => fetchJson<{ clients: Client[] }>('/api/clients').then((r) => r.clients),
    create: (client: Omit<Client, 'id' | 'createdAt' | 'requests'>) =>
      fetchJson<{ client: Client }>('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      }).then((r) => r.client)
  },
  demands: {
    list: () => fetchJson<{ demands: Demand[] }>('/api/demands').then((r) => r.demands),
    create: (data: { clientId: string; landTitle: string; ancfccFee: number; serviceFee: number }) =>
      fetchJson<{ demand: Demand }>('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then((r) => r.demand),
    validateSms: (id: string, code = '') =>
      fetchJson<{ demand: Demand }>(`/api/demands/${id}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      }).then((r) => r.demand),
    confirmPayment: (id: string) =>
      fetchJson<{ demand: Demand }>(`/api/demands/${id}/payment`, { method: 'POST' }).then((r) => r.demand)
  }
}
