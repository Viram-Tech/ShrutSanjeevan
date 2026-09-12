// -----------------------------------------------------------------------------
// Sync the published Google Sheet catalogue -> Supabase `books` table.
//
//   node scripts/sync-sheet-to-supabase.mjs
//
// Reuses the SAME parsing + transliteration the website uses (booksStore.js), so
// the stored search keys match the in-browser ones exactly. Runs on a schedule
// from .github/workflows/sync-catalogue.yml (every 2 hours) and can be run
// locally too.
//
// Required env:
//   SUPABASE_URL                 your project URL
//   SUPABASE_SERVICE_ROLE_KEY    the SECRET service_role key (Settings -> API)
// Optional env:
//   BOOKS_SHEET_CSV_URL          overrides the URL baked into src/config.js
//
// The service_role key bypasses Row Level Security so it can write. NEVER put it
// in the frontend or src/config.js — only in GitHub Action secrets / your shell.
// -----------------------------------------------------------------------------
import crypto from 'node:crypto'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'
import { parseCsv, rowsToBooks } from '../src/lib/booksStore.js'
import { BOOKS_SHEET_CSV_URL as CONFIG_CSV_URL } from '../src/config.js'

// supabase-js constructs a realtime client that needs a global WebSocket.
// Node < 22 has none, so polyfill it. (The sync itself only uses the REST API.)
if (!globalThis.WebSocket) globalThis.WebSocket = ws

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const CSV_URL = process.env.BOOKS_SHEET_CSV_URL || CONFIG_CSV_URL

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (!SUPABASE_URL) fail('SUPABASE_URL is not set.')
if (!SERVICE_ROLE) fail('SUPABASE_SERVICE_ROLE_KEY is not set.')
if (!CSV_URL) fail('No catalogue CSV URL (set BOOKS_SHEET_CSV_URL or configure it in src/config.js).')

// A stable id from the row's content: unchanged rows keep the same id across
// syncs (so the request cart stays valid), removed rows drop out, edited rows
// get a new id. Identical duplicate rows collapse to one — which is desirable.
function rowId(b) {
  const sig = [b.name, b.type, b.language, b.author, b.tikakaar, b.speciality].join('')
  return crypto.createHash('sha1').update(sig).digest('hex').slice(0, 16)
}

function toRecord(b, syncedAt) {
  return {
    id: rowId(b),
    name: b.name,
    type: b.type,
    language: b.language,
    author: b.author,
    tikakaar: b.tikakaar,
    speciality: b.speciality,
    search_key: b._key,
    search_text: b._text,
    author_key: b._authorKey,
    tik_key: b._tikKey,
    langs: b._langs,
    genres: b._genres,
    has_tikakaar: Boolean(b.tikakaar),
    synced_at: syncedAt,
  }
}

// Supabase's gateway gives up well before Postgres does. A run that only
// refreshes `synced_at` is cheap, but one where the search keys themselves
// change — a transliteration fix, say — rewrites six GIN trigram indexes for
// every row, and a big batch then times out mid-write.
const isTransient = (message = '') =>
  /timeout|gateway|502|503|504|fetch failed|ECONNRESET|socket hang up/i.test(
    message,
  )

async function chunkedUpsert(supabase, records, size = 200) {
  for (let i = 0; i < records.length; i += size) {
    const batch = records.slice(i, i + size)
    let failure = null

    // Upserts are idempotent, so replaying a batch that timed out is always
    // safe — the row either was written or was not, and either way the same
    // payload lands. Back off rather than failing the whole catalogue.
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const { error } = await supabase
        .from('books')
        .upsert(batch, { onConflict: 'id' })
      if (!error) {
        failure = null
        break
      }
      failure = error
      if (!isTransient(error.message) || attempt === 5) break
      const waitMs = 2 ** attempt * 1000
      console.log(
        `  batch at ${i} failed (${error.message}) — retry ${attempt}/4 in ${waitMs / 1000}s`,
      )
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    if (failure) throw new Error(`Upsert failed at row ${i}: ${failure.message}`)
    console.log(`  upserted ${Math.min(i + size, records.length)} / ${records.length}`)
  }
}

async function main() {
  console.log(`→ Fetching catalogue CSV…`)
  const res = await fetch(CSV_URL)
  if (!res.ok) fail(`Could not fetch the sheet (HTTP ${res.status}).`)
  const parsed = rowsToBooks(parseCsv(await res.text()))
  if (!parsed.length) fail('The sheet parsed to 0 rows — aborting so the table is not wiped.')
  // A usable title has at least one letter or digit in ANY script. The sheet
  // carries a few rows whose name is only punctuation or a ditto mark ("-",
  // "("); indexing those puts unfindable noise in the Archive.
  const books = parsed.filter((b) => /[\p{L}\p{N}]/u.test(b.name || ''))
  const skipped = parsed.length - books.length
  console.log(
    `→ Parsed ${parsed.length} rows` +
      (skipped ? `; skipped ${skipped} without a real title.` : '.'),
  )

  const syncedAt = new Date().toISOString()
  // De-duplicate by id (identical rows collapse) before writing.
  const byId = new Map()
  for (const b of books) byId.set(rowId(b), toRecord(b, syncedAt))
  const records = [...byId.values()]
  console.log(`→ ${records.length} unique records after de-duplication.`)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  })

  console.log(`→ Upserting…`)
  await chunkedUpsert(supabase, records)

  // Prune rows that were not part of this run (removed from the sheet). Because
  // we upsert first and delete second, the table is never empty mid-sync.
  console.log(`→ Pruning removed rows…`)
  const { error: delErr, count } = await supabase
    .from('books')
    .delete({ count: 'exact' })
    .neq('synced_at', syncedAt)
  if (delErr) throw new Error(`Prune failed: ${delErr.message}`)
  console.log(`  pruned ${count ?? 0} stale rows.`)

  console.log(`✓ Sync complete: ${records.length} books live.`)
}

main().catch((err) => fail(err.message || String(err)))
