// -----------------------------------------------------------------------------
// Catalogue lookups the chat assistant can actually run.
//
// The widget used to be able to describe the site but never look anything up,
// so "do you have X?" could only ever be answered with a link. These two
// functions are what the assistant calls instead — the same Supabase RPC the
// Archive page uses and the same Sanity dataset the Library reads, so an answer
// here can never disagree with what the visitor sees after they click through.
//
// Both are read-only and both use the PUBLIC keys already shipped in the browser
// bundle (src/config.js): the anon key and the Sanity project id are public by
// design. Nothing privileged is reachable from this file.
//
// Every function returns a plain object and never throws — a failed lookup comes
// back as { error }, which the model reports honestly ("I could not search just
// now") rather than the request dying with a 500.
// -----------------------------------------------------------------------------
import { SUPABASE, SANITY } from '../src/config.js'
import { searchKey } from '../src/lib/translit.js'

// How many rows come back to the model. The reply is a chat bubble, not a
// results page — a handful of titles plus the total count is what a visitor can
// actually read, and it keeps the tool result from dominating the token budget.
const MAX_ROWS = 6

// Matches the Archive page's own dial (src/lib/supabase.js), so the assistant's
// idea of "found" is the same as the page's.
const FUZZ = 0.35

/**
 * Search the manuscript archive. Mirrors the filters on /search.
 * Returns { total, rows: [{ name, type, language, author, tikakaar }], link }.
 */
export async function searchArchive({
  keyword = '',
  language = '',
  topic = '',
  author = '',
  tikakaar = '',
  only_commentary = false,
} = {}) {
  if (!SUPABASE.url || !SUPABASE.anonKey) {
    return { error: 'The archive database is not configured.' }
  }
  // The stored search key is transliteration-folded, so the query has to be
  // folded the same way — this is what lets "shreeparshvanatha" match
  // "श्रीपार्श्वनाथ". Skipping it silently returns nothing for Latin input.
  const body = {
    q: searchKey(keyword),
    f_language: language || '',
    f_topic: topic || '',
    f_author: searchKey(author),
    f_tikakaar: searchKey(tikakaar),
    f_only_commentary: Boolean(only_commentary),
    lim: MAX_ROWS,
    off: 0,
    fuzz: FUZZ,
  }

  try {
    const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/search_books`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE.anonKey,
        Authorization: `Bearer ${SUPABASE.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error('Archive search failed: %d %s', res.status, (await res.text()).slice(0, 300))
      return { error: 'The archive could not be reached just now.' }
    }
    const list = (await res.json()) || []
    return {
      kind: 'archive',
      total: list.length ? Number(list[0].total_count) : 0,
      rows: list.map((r) => ({
        name: r.name,
        type: r.type || undefined,
        language: r.language || undefined,
        author: r.author || undefined,
        tikakaar: r.tikakaar || undefined,
      })),
      link: archiveLink({ keyword, language, topic, author, tikakaar, only_commentary }),
    }
  } catch (err) {
    console.error('Archive search threw:', err)
    return { error: 'The archive could not be reached just now.' }
  }
}

/** The /search URL matching a set of filters, so the model never builds one by
 *  hand and can hand the visitor the full result set. */
function archiveLink({ keyword, language, topic, author, tikakaar, only_commentary }) {
  const p = new URLSearchParams()
  if (keyword) p.set('q', keyword)
  if (language) p.set('language', language)
  if (topic) p.set('topic', topic)
  if (author) p.set('author', author)
  if (tikakaar) p.set('tikakaar', tikakaar)
  if (only_commentary) p.set('commentary', '1')
  const qs = p.toString()
  return qs ? `/search?${qs}` : '/search'
}

/**
 * Search the digitized Library (Sanity). Unlike the archive these are books a
 * visitor can read or download immediately, which is why it is a separate tool
 * rather than one search over both.
 */
export async function searchLibrary({ keyword = '' } = {}) {
  if (!SANITY.projectId) {
    return { error: 'The library is not configured.' }
  }

  // Strip glob characters before they reach either the query or the link.
  //
  // GROQ's `match` treats * as a wildcard, but the Library page filters with a
  // literal substring test — so a model answering "what can I read?" with
  // keyword "*" got a count of every book from Sanity and a /library?q=* link
  // that matched none of them. The button promised books and delivered an empty
  // page. Once stripped, an all-wildcard keyword becomes the empty string,
  // which both sides already agree means "everything".
  const cleaned = String(keyword).replace(/[*?]/g, ' ').trim()
  // Sanity has no transliteration folding, so this is a plain case-insensitive
  // match on the fields a visitor would search by.
  //
  // `total` is a real count(), not rows.length. The rows are sliced to MAX_ROWS
  // for the model to quote from, so counting them would cap every answer at six
  // — a search matching fifty books would be labelled "Open 6 books in the
  // Library", and the button would then show fifty. The filter is repeated
  // rather than shared because GROQ has no way to bind it once here.
  const filter = `_type == "book" && (
      title match $q || author match $q || topic match $q || language match $q
    )`
  const groq = `{
    "total": count(*[${filter}]),
    "rows": *[${filter}][0...${MAX_ROWS}]{ title, author, language, topic, year,
      "canDownload": defined(fullBookPdf.asset->url) || defined(previewPdf.asset->url) }
  }`

  const url =
    `https://${SANITY.projectId}.api.sanity.io/v2024-01-01/data/query/` +
    `${SANITY.dataset || 'production'}` +
    `?query=${encodeURIComponent(groq)}` +
    // `match` wants a wildcard to behave like "contains".
    // An empty keyword becomes the bare wildcard: match everything.
    `&$q=${encodeURIComponent(JSON.stringify(cleaned ? `*${cleaned}*` : '*'))}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('Library search failed: %d %s', res.status, (await res.text()).slice(0, 300))
      return { error: 'The library could not be reached just now.' }
    }
    const { result } = await res.json()
    const rows = Array.isArray(result?.rows) ? result.rows : []
    return {
      kind: 'library',
      total: Number(result?.total ?? rows.length),
      rows,
      link: cleaned ? `/library?q=${encodeURIComponent(cleaned)}` : '/library',
    }
  } catch (err) {
    console.error('Library search threw:', err)
    return { error: 'The library could not be reached just now.' }
  }
}
