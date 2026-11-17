import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://mirytmehqvibgbfczmzc.supabase.co'
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_-7XTSiI8p2Z0kLtbB0RAmg_Q7WQR0Kd'

export const supabase = createClient(supabaseUrl, supabaseKey)
