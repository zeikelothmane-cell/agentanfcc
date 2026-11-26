import { describe, expect, it } from 'vitest'
import { createInMemoryStore } from './store.js'

describe('in-memory ANCFCC store', () => {
  it('prevents duplicate active demands', () => {
    const store = createInMemoryStore()
    const created = store.createDemand({
      clientId: 'CL-1001',
      clientName: 'Amina El Mansouri',
      landTitle: 'TF-45821',
      ancfccFee: 250,
      serviceFee: 150
    })

    expect(store.findActiveDuplicate('CL-1001', 'TF-45821')).toBe(created)
  })

  it('requires SMS before payment confirmation', () => {
    const store = createInMemoryStore()
    const created = store.createDemand({
      clientId: 'CL-1001',
      clientName: 'Amina El Mansouri',
      landTitle: 'TF-NEW',
      ancfccFee: 250,
      serviceFee: 150
    })

    expect(store.confirmPayment(created.id)).toBeUndefined()
    store.advanceDemand(created.id)
    store.validateSms(created.id)
    expect(created.status).toBe('confirmation_paiement')

    const completed = store.confirmPayment(created.id)
    expect(completed?.status).toBe('terminee')
    expect(completed?.paymentConfirmed).toBe(true)
  })

  it('does not complete an unknown demand', () => {
    const store = createInMemoryStore()
    expect(store.confirmPayment('REQ-UNKNOWN')).toBeUndefined()
  })
})
