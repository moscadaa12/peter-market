import { createClient } from '@supabase/supabase-js'

let _supabase

function getClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    )
  }
  return _supabase
}

export default getClient
