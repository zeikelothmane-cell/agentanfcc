export type RequestStatus =
  | 'brouillon'
  | 'en_cours'
  | 'code_sms'
  | 'confirmation_paiement'
  | 'terminee'
  | 'erreur'

export interface Client {
  id: string
  firstName: string
  lastName: string
  cin: string
  phone: string
  landTitle: string
  createdAt: string
  cinFrontUrl?: string
  cinBackUrl?: string
  requests: number
}

export interface Demand {
  id: string
  clientId: string
  clientName: string
  landTitle: string
  status: RequestStatus
  ancfccFee: number
  serviceFee: number
  createdAt: string
  updatedAt: string
  history: Array<{ at: string; label: string }>
  paymentConfirmed: boolean
  certificateUrl?: string
}
