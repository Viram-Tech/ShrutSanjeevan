// -----------------------------------------------------------------------------
// Site configuration — safe for a non-developer to edit.
// Change the values below and save; no other code needs to change.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Public address of the live website — used to build canonical URLs, social
// share tags and sitemap.xml. NO trailing slash.
//
// Change this the moment the site moves to its real domain: search engines use
// canonical URLs to decide which address to list, so a wrong value here means
// the wrong (or no) pages get indexed.
// -----------------------------------------------------------------------------
export const SITE_URL = 'https://shrutsanjeevan.org'

// Where book requests (from the Search page cart) are delivered.
// WhatsApp number: country code + number, DIGITS ONLY (no +, spaces or dashes).
// Example: +91 75750 01083  ->  '917575001083'
export const REQUEST_WHATSAPP = '919321577048'

// Email address that should receive book requests.
export const REQUEST_EMAIL = 'kendra@kobatirth.org'

// -----------------------------------------------------------------------------
// Archive catalogue — a published Google Sheet (CSV).
// File -> Share -> Publish to web -> pick the sheet -> "Comma-separated values
// (.csv)" -> Publish, then paste that URL here. Columns (any order):
//   Granth Name | Type | Language | Karta | Tikakaar | Speciality
// -----------------------------------------------------------------------------
export const BOOKS_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkn2CmRShypf5J5p0-kwWsdCiwrz58Ndo30e4wFyWnlwIRa7aAFxMYUCyV1UP5r9cwoKLs4dU4Uty4/pub?output=csv'

// -----------------------------------------------------------------------------
// Supabase (optional) — server-side archive search backed by a database.
// -----------------------------------------------------------------------------
// The Google Sheet stays your editing surface. A GitHub Action syncs the sheet
// into Supabase every 2 hours (.github/workflows/sync-catalogue.yml), and the
// Search page then queries the database instead of downloading the whole sheet.
//
// SETUP (one time):
//   1. Create a free project at https://supabase.com.
//   2. Open the SQL Editor and run the contents of  supabase/schema.sql .
//   3. Project Settings -> API: copy "Project URL" and the "anon public" key
//      into the two fields below. (Both are PUBLIC and safe to expose.)
//   4. Add the sync secrets in GitHub (see supabase/README-sync.md).
//
// Leave `url` blank to keep the in-browser Google Sheet search (no database).
export const SUPABASE = {
  url: 'https://hbmovzrvppmkovnfjwgc.supabase.co',
  anonKey: 'sb_publishable_oriOKX2IU3w89X-7eg239g_hApq992j',
}

// Google Analytics 4 Measurement ID, e.g. 'G-XXXXXXXXXX'.
// Leave it as '' to turn analytics off. When set, every "Download" click is
// recorded as a `book_download` event you can total up in the GA dashboard
// (Reports -> Engagement -> Events). GA is free and needs no credit card.
export const GA_MEASUREMENT_ID = ''

// -----------------------------------------------------------------------------
// Live "total downloads" counter (Firebase / Firestore — free, no server).

// -----------------------------------------------------------------------------
// Sanity CMS — powers the Library (books + chapters + PDFs), edited by non-devs.
// -----------------------------------------------------------------------------
// Staff add/edit books in the hosted Sanity Studio (no code); the Library page
// reads from here. The projectId is PUBLIC and safe to expose. Leave projectId
// as '' to use the built-in sample library in src/data/sampleLibrary.js.
//
// SETUP (one time, ~15 minutes — see studio/README.md for the full walkthrough):
//   1. In a NEW folder run:  npm create sanity@latest
//      Sign in, create a project (e.g. "shrutsanjeevan-library"), dataset
//      "production". This scaffolds a Studio app.
//   2. Copy studio/schemas/book.js from this repo into the Studio's schema
//      folder and register it (see studio/README.md).
//   3. Run  npx sanity deploy  to publish the Studio at <name>.sanity.studio.
//   4. Studio -> Settings -> API -> CORS origins: add your website URL (and
//      http://localhost:3000 for local dev).
//   5. Paste the projectId below. Add books in the Studio and reload the site.
export const SANITY = {
  projectId: '2x48hirj',
  dataset: 'production',
}
