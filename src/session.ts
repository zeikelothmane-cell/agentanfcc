import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL || 'https://xcpawmvtftwybbeufkmk.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PN9fc0aJxZuFZ8fGE34Y5Q_Pe9zaCRD'
export const supabase = url && key ? createClient(url,key) : null
