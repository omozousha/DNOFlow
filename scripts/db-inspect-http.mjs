#!/usr/bin/env node
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !(anonKey || serviceKey)) {
  console.error('Missing Supabase envs. Need NEXT_PUBLIC_SUPABASE_URL and ANON or SERVICE key.')
  process.exit(1)
}

const key = serviceKey || anonKey
const supabase = createClient(url, key)

function parseArgs() {
  const [, , ...rest] = process.argv
  return { table: rest[0] || 'profiles', limit: Number(rest[1] || 10) }
}

async function showRows(table, limit) {
  const { data, error } = await supabase.from(table).select('*').limit(limit)
  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }
  console.log(`First ${data?.length || 0} rows from ${table}:`)
  console.table(data)
}

async function main() {
  const { table, limit } = parseArgs()
  await showRows(table, limit)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
