#!/usr/bin/env node
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const key = serviceKey || anonKey

if (!url || !key) {
  console.error('Missing envs. Need NEXT_PUBLIC_SUPABASE_URL and ANON or SERVICE key.')
  process.exit(1)
}

const supabase = createClient(url, key)

async function listSchemasRPC() {
  const { data, error } = await supabase.rpc('list_schemas')
  if (error) {
    console.error('\nRPC list_schemas error:', error.message)
    console.error('\nTo enable schema listing without direct Postgres access, run this SQL in Supabase SQL editor:')
    console.error(`\n--- SQL ---\nCREATE OR REPLACE FUNCTION public.list_schemas()\nRETURNS TABLE(schema_name text)\nLANGUAGE sql\nSECURITY DEFINER\nSET search_path = public\nAS $$\n  SELECT nspname::text AS schema_name\n  FROM pg_namespace\n  WHERE nspname NOT LIKE 'pg_%'\n    AND nspname <> 'information_schema'\n  ORDER BY nspname;\n$$;\n\nGRANT EXECUTE ON FUNCTION public.list_schemas() TO anon, authenticated;\n---\n`)
    process.exit(1)
  }
  return data
}

async function main() {
  const rows = await listSchemasRPC()
  console.log('Schemas:')
  for (const r of rows) console.log(`- ${r.schema_name}`)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
