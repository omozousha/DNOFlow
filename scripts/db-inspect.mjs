#!/usr/bin/env node
import sql from '../db/sql.mjs'

// Simple DB inspector:
// - No args: list schemas/tables in public
// - With arg: node scripts/db-inspect.mjs <table> → show first 10 rows

function parseArgs() {
  const [, , ...rest] = process.argv
  return { table: rest[0] }
}

async function listTables() {
  const rows = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public')
    order by table_schema, table_name
  `
  if (rows.length === 0) {
    console.log('No tables found in schema public.')
    return
  }
  console.log('Tables in schema public:')
  for (const r of rows) {
    console.log(`- ${r.table_schema}.${r.table_name}`)
  }
}

async function showRows(table) {
  try {
    const rows = await sql.unsafe(`select * from ${table} limit 10`)
    console.log(`\nFirst ${rows.length} rows from ${table}:`)
    console.table(rows)
  } catch (e) {
    console.error(`Failed to query table ${table}:`, e.message)
    process.exitCode = 1
  }
}

async function main() {
  const { table } = parseArgs()
  if (table) {
    await showRows(table)
  } else {
    await listTables()
  }
  await sql.end({ timeout: 5 })
}

main().catch((e) => {
  console.error('Error:', e)
  process.exitCode = 1
})
