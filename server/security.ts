import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Supabase server configuration required')
export const database = (token: string) => createClient(url, key, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } })
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) { res.status(401).json({error:'Connexion requise'}); return }
  try {
    const db = database(token)
    const {data,error} = await db.auth.getUser(token)
    if (error || !data.user) { res.status(401).json({error:'Session invalide'}); return }
    res.locals.db = db
    res.locals.owner = data.user.id
    next()
  } catch { res.status(503).json({error:'Authentification indisponible'}) }
}
