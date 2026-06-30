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

export async function query(sql, params = []) {
  const { data, error } = await getClient().rpc('exec_sql', {
    sql,
    params: JSON.stringify(params),
  })
  if (error) throw error
  return { rows: data || [] }
}

export default getClient
