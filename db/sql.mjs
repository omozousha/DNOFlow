import dotenv from 'dotenv'
import postgres from 'postgres'

// Load environment variables from .env.local first (if present), then fallback to .env
// This makes the script compatible with Next.js-style local env files.
dotenv.config({ path: '.env.local' })
dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('Missing DATABASE_URL. Set it in your environment or .env.local')
}

// Supabase Postgres requires SSL. For convenience in Node, disable cert validation.
// If your connection string includes ?sslmode=require, this is redundant but safe.
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 5,
  connect_timeout: 10,
})

export default sql
