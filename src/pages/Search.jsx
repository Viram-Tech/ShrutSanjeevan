import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBooks } from '../lib/supabase.js'
import { LANGUAGES, GENRES, facetLabel } from '../lib/catalogFacets.js'
import { BOOKS_SHEET_CSV_URL } from '../config.js'
import { LoaderOne } from '../components/Loader.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import Seo from '../components/Seo.jsx'
import { seo } from '../data/seo.js'

// Shared typography with the About page: Playfair serif titles + gold eyebrow.
const serif = { fontFamily: "'Playfair Display', serif" }
const eyebrowGold = 'font-label-md text-[12px] uppercase tracking-[0.26em] text-brass'

const emptyFilters = {
  keyword: '',
  language: '',
  topic: '',
  author: '',
  tikakaar: '',
  onlyCommentary: false,
}


// iPhone-style Devanagari keyboard — a letters page and a "more" page for
// matras, marks & digits, toggled from the bottom row.
const KB_LETTERS = [
  ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
  ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
  ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
  ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व'],
  ['श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ', 'अं', 'अः'],
]
const KB_MORE = [
  ['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ'],
  ['ं', 'ः', 'ँ', '्', 'ृ', 'ॉ', 'ॐ', '।'],
  ['१', '२', '३', '४', '५', '६', '७', '८', '९', '०'],
]

const fieldClass =
  'w-full p-3 rounded-2xl border border-warm focus:border-secondary-fixed-dim focus:ring-2 focus:ring-secondary-fixed-dim focus:ring-opacity-50 transition-shadow bg-surface font-body-md text-body-md'
const labelClass = 'block font-label-md text-label-md text-on-surface mb-base'

// --- Deep links -------------------------------------------------------------
// Read the filter set out of the query string. Facet values are checked against
// the canonical lists so only options the dropdowns actually offer survive;
// free-text fields (keyword, author, tikakaar) are passed through, since the
// search folds them through translit.js anyway.
const LANGUAGE_VALUES = LANGUAGES.map((l) => l.value)
const GENRE_VALUES = GENRES.map((g) => g.value)

// Case-insensitive so /search?language=sanskrit works as well as ?language=Sanskrit.
const canonical = (raw, allowed) =>
  allowed.find((v) => v.toLowerCase() === String(raw || '').trim().toLowerCase()) || ''

function paramsToFilters(params) {
  return {
    ...emptyFilters,
    keyword: params.get('q') || '',
    language: canonical(params.get('language'), LANGUAGE_VALUES),
    topic: canonical(params.get('topic'), GENRE_VALUES),
    author: params.get('author') || '',
    tikakaar: params.get('tikakaar') || '',
    onlyCommentary: params.get('commentary') === '1',
  }
}

const hasAnyFilter = (f) =>
  Boolean(f.keyword || f.language || f.topic || f.author || f.tikakaar || f.onlyCommentary)

export default function Search() {
  const { toggle, has } = useCart()
  const { t } = useLanguage()
  // The archive is searched server-side on Supabase — only the matching page of
  // rows is fetched (the whole catalogue is never downloaded to the browser).
  const [server, setServer] = useState({ rows: [], total: 0, loading: true, error: null })
  const [searchParams] = useSearchParams()

  // Clean, curated dropdown options (LANGUAGES/GENRES from catalogFacets).
  //
  // The whole filter set is readable from the URL, not just the keyword, so a
  // link can arrive pre-filtered — that is what the chat assistant hands out
  // when a visitor asks for something it cannot look up itself. Unknown facet
  // values are dropped rather than trusted: a stale or mistyped ?language=
  // would otherwise leave a dropdown showing an option it does not have and a
  // filter the database will never match.
  const initialFilters = useMemo(
    () => paramsToFilters(searchParams),
    // Seeds the state below once. Later query-string changes are handled by the
    // sync effect further down, not here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [draft, setDraft] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [perPage, setPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [hasSearched, setHasSearched] = useState(() => hasAnyFilter(initialFilters))
  const [hindiKb, setHindiKb] = useState(false)
  const [kbPage, setKbPage] = useState('letters')
  const [downloading, setDownloading] = useState(null)
  const keywordRef = useRef(null)

  // Re-read the URL whenever the query string changes on an already-mounted
  // page. React Router does not remount for a same-route navigation, so without
  // this a second deep link — the chat assistant sending a visitor from
  // /search?q=a to /search?q=b, or the browser Back button — would change the
  // address bar and nothing else.
  //
  // Safe to do unconditionally because this page never writes the URL itself:
  // every change to it comes from outside, so it always represents an intent to
  // search for something new rather than an echo of what the visitor is typing.
  const paramsKey = searchParams.toString()
  const appliedParams = useRef(paramsKey)
  useEffect(() => {
    if (paramsKey === appliedParams.current) return // already seeded by useState
    appliedParams.current = paramsKey
    const next = paramsToFilters(new URLSearchParams(paramsKey))
    setDraft(next)
    setFilters(next)
    setHasSearched(hasAnyFilter(next))
    setPage(1)
  }, [paramsKey])

  // Insert a character from the on-screen keyboard at the cursor position.
  const insertChar = (ch) => {
    const el = keywordRef.current
    const start = el?.selectionStart ?? draft.keyword.length
    const end = el?.selectionEnd ?? draft.keyword.length
    const next = draft.keyword.slice(0, start) + ch + draft.keyword.slice(end)
    setDraft({ ...draft, keyword: next })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + ch.length
      el.setSelectionRange(pos, pos)
    })
  }

  const backspaceChar = () => {
    const el = keywordRef.current
    const start = el?.selectionStart ?? draft.keyword.length
    const end = el?.selectionEnd ?? draft.keyword.length
    if (start === 0 && end === 0) return
    let next
    let pos
    if (start !== end) {
      next = draft.keyword.slice(0, start) + draft.keyword.slice(end)
      pos = start
    } else {
      next = draft.keyword.slice(0, start - 1) + draft.keyword.slice(start)
      pos = start - 1
    }
    setDraft({ ...draft, keyword: next })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  // Server-side search — refetch from Supabase whenever the filters or page change.
  useEffect(() => {
    let alive = true
    setServer((s) => ({ ...s, loading: true }))
    searchBooks({
      keyword: filters.keyword,
      language: filters.language,
      topic: filters.topic,
      author: filters.author,
      tikakaar: filters.tikakaar,
      onlyCommentary: filters.onlyCommentary,
      page,
      perPage,
    }).then(
      ({ rows, total }) => alive && setServer({ rows, total, loading: false, error: null }),
      (err) => alive && setServer({ rows: [], total: 0, loading: false, error: err }),
    )
    return () => {
      alive = false
    }
  }, [filters, page, perPage])

  const { loading, error, total: resultCount } = server
  const totalPages = Math.max(1, Math.ceil(resultCount / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageRows = server.rows
  // A search is "empty" when nothing is typed and no filter is chosen.
  const hasCriteria = Boolean(
    filters.keyword.trim() ||
      filters.language ||
      filters.topic ||
      filters.author.trim() ||
      filters.tikakaar.trim() ||
      filters.onlyCommentary,
  )

  const update = (key) => (e) => setDraft({ ...draft, [key]: e.target.value })

  const runSearch = (e) => {
    e.preventDefault()
    setFilters(draft)
    setPage(1)
    setHasSearched(true)
  }

  const newSearch = () => {
    setDraft(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
    setShowAdvanced(true)
    setHasSearched(false)
  }

  const clearAll = () => {
    setDraft(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
  }

  const clearOne = (key) => {
    const empty = emptyFilters[key]
    setDraft({ ...draft, [key]: empty })
    setFilters({ ...filters, [key]: empty })
    setPage(1)
  }

  // Download the entire catalogue (the published Google Sheet — the full archive)
  // in the requested format. The sheet serves csv/xlsx directly via its `output`
  // param; we fetch into a Blob so the browser saves a file rather than
  // navigating to the cross-origin URL.
  const downloadCatalogue = async (fmt) => {
    if (downloading || !BOOKS_SHEET_CSV_URL) return
    setDownloading(fmt)
    try {
      const url = new URL(BOOKS_SHEET_CSV_URL)
      url.searchParams.set('output', fmt)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `shrutsanjeevan-archive.${fmt}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    } catch {
      alert('Sorry — the catalogue could not be downloaded. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  // Active advanced filters, summarised for the "current search" chips
  const advancedChips = [
    filters.language && { key: 'language', label: facetLabel(filters.language) },
    filters.topic && { key: 'topic', label: facetLabel(filters.topic) },
    filters.author && { key: 'author', label: `Author: ${filters.author}` },
    filters.tikakaar && { key: 'tikakaar', label: `Commentator: ${filters.tikakaar}` },
    filters.onlyCommentary && { key: 'onlyCommentary', label: 'With commentary' },
  ].filter(Boolean)

  // A compact, windowed page list: 1 … (current-1, current, current+1) … last.
  // Keeps the control small even when there are thousands of pages.
  const pageItems = useMemo(() => {
    const items = []
    const window = 1 // pages to show either side of the current page
    const left = Math.max(2, currentPage - window)
    const right = Math.min(totalPages - 1, currentPage + window)
    items.push(1)
    if (left > 2) items.push('gap-left')
    for (let i = left; i <= right; i += 1) items.push(i)
    if (right < totalPages - 1) items.push('gap-right')
    if (totalPages > 1) items.push(totalPages)
    return items
  }, [currentPage, totalPages])

  return (
    <>
      <Seo {...seo.search} />
      <div
        className={
          hasSearched
            ? ''
            : 'mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col justify-start pt-[8vh]'
        }
      >
        {/* Header */}
        {hasSearched ? (
          <div className="mb-stack-sm flex items-center justify-between gap-4">
            <h1 className="text-[28px] leading-[1.1] text-ink md:text-[36px]" style={serif}>
              The archive
            </h1>
            <button
              type="button"
              onClick={newSearch}
              className="inline-flex items-center gap-1.5 py-1 font-label-md text-label-md text-text-muted transition-colors hover:text-oxblood"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              New search
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className={`${eyebrowGold} mb-3`}>{t.catalogue.eyebrow || 'The catalogue'}</p>
            <h1 className="mb-4 text-[38px] leading-[1.08] text-ink md:text-[54px]" style={serif}>
              {t.catalogue.heading}
            </h1>
            <p className="mx-auto max-w-xl text-[17px] leading-relaxed text-text-muted">
              {t.catalogue.subtitle}
            </p>
          </div>
        )}

        {/* Search box */}
        <form onSubmit={runSearch} className={hasSearched ? 'mb-stack-md' : 'mt-8 md:mt-12'}>
          <div className="rounded-2xl border border-warm bg-surface px-4 py-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-secondary-fixed-dim focus-within:ring-opacity-50">
            <input
              ref={keywordRef}
              className="w-full border-0 bg-transparent px-1 py-2 font-body-md text-body-md text-on-surface outline-none placeholder:text-text-muted focus:border-0 focus:outline-none focus:ring-0"
              id="keyword"
              placeholder="Search the archive — titles, authors, quotes, bhandars…"
              type="text"
              autoComplete="off"
              value={draft.keyword}
              onChange={update('keyword')}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              {/* left — advanced search */}
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                className={`inline-flex items-center gap-1 px-1 py-2 font-label-md text-label-md transition-colors ${
                  showAdvanced ? 'text-oxblood' : 'text-text-muted hover:text-oxblood'
                }`}
              >
                Advanced search
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform ${
                    showAdvanced ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* right — hindi keyboard */}
              <button
                type="button"
                onClick={() => setHindiKb((v) => !v)}
                aria-pressed={hindiKb}
                title="हिन्दी कीबोर्ड"
                className={`indic inline-flex items-center px-1 py-2 font-label-md text-label-md transition-colors ${
                  hindiKb ? 'text-oxblood' : 'text-text-muted hover:text-oxblood'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* On-screen Hindi keyboard — iPhone style */}
          {hindiKb && (
            <div className="mt-3 rounded-2xl bg-leaf-dark p-2 shadow-sm sm:p-2.5">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="indic font-label-md text-label-md text-sepia">हिन्दी कीबोर्ड</p>
                <button
                  type="button"
                  onClick={() => setHindiKb(false)}
                  aria-label="Close keyboard"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface/60 hover:text-oxblood"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {(kbPage === 'letters' ? KB_LETTERS : KB_MORE).map((row, r) => (
                  <div key={r} className="flex justify-center gap-1.5">
                    {row.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          insertChar(ch)
                        }}
                        className="flex h-10 flex-1 items-center justify-center rounded-md bg-surface text-[19px] leading-none text-ink shadow-[0_1px_1px_rgba(47,36,24,0.28)] transition-colors active:bg-cream-surface sm:h-11"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Bottom row: page toggle · space · backspace */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setKbPage((p) => (p === 'letters' ? 'more' : 'letters'))
                    }}
                    className="flex h-10 w-16 items-center justify-center rounded-md bg-black/5 font-label-md text-sm text-ink shadow-[0_1px_1px_rgba(47,36,24,0.2)] transition-colors active:bg-black/10 sm:h-11"
                  >
                    {kbPage === 'letters' ? '१२३' : 'अ'}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertChar(' ')
                    }}
                    className="h-10 flex-1 rounded-md bg-surface font-label-md text-label-md text-text-muted shadow-[0_1px_1px_rgba(47,36,24,0.28)] transition-colors active:bg-cream-surface sm:h-11"
                  >
                    Space
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      backspaceChar()
                    }}
                    aria-label="Backspace"
                    className="flex h-10 w-16 items-center justify-center rounded-md bg-black/5 text-ink shadow-[0_1px_1px_rgba(47,36,24,0.2)] transition-colors active:bg-black/10 sm:h-11"
                  >
                    <span className="material-symbols-outlined text-[20px]">backspace</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced options panel */}
          {showAdvanced && (
            <div className="mt-4 rounded-2xl border border-warm bg-surface-container-lowest p-stack-md shadow-sm">
              <div className="mb-stack-sm flex items-center justify-between">
                <p className="font-label-md text-label-md text-sepia">Advanced options</p>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  aria-label="Close advanced options"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container-low hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 items-end gap-gutter md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={labelClass} htmlFor="language">
                    Language
                  </label>
                  <select className={fieldClass} id="language" value={draft.language} onChange={update('language')}>
                    <option value="">All Languages</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="topic">
                    Type
                  </label>
                  <select className={fieldClass} id="topic" value={draft.topic} onChange={update('topic')}>
                    <option value="">All Types</option>
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="author">
                    Author (Karta)
                  </label>
                  <input
                    className={fieldClass}
                    id="author"
                    placeholder="E.g., Hemachandra, Bhadrabahu…"
                    type="text"
                    value={draft.author}
                    onChange={update('author')}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="tikakaar">
                    Commentator (Tikakaar)
                  </label>
                  <input
                    className={fieldClass}
                    id="tikakaar"
                    placeholder="E.g., Abhayadeva, Malayagiri…"
                    type="text"
                    value={draft.tikakaar}
                    onChange={update('tikakaar')}
                  />
                </div>
              </div>

              <div className="mt-stack-md flex flex-col items-center justify-between gap-4 sm:flex-row">
                <label className="flex cursor-pointer select-none items-center gap-2 font-body-md text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={draft.onlyCommentary}
                    onChange={(e) => setDraft({ ...draft, onlyCommentary: e.target.checked })}
                    className="h-4 w-4 rounded border-warm text-primary focus:ring-secondary-fixed-dim"
                  />
                  Only texts with a commentary (Tikakaar)
                </label>
                <div className="flex gap-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-primary px-6 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark"
                >
                  Apply filters
                </button>
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips — shown below the advanced options block */}
          {advancedChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {advancedChips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 py-1 font-label-md text-label-md leading-none text-sepia"
                >
                  <span className="leading-none">{c.label}</span>
                  <button
                    type="button"
                    onClick={() => clearOne(c.key)}
                    aria-label={`Remove ${c.label}`}
                    className="inline-flex items-center text-text-muted transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px] leading-none">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}
        </form>

        {/* Download the whole archive */}
        <div className="mt-3 mb-stack-md flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-label-md text-label-md">
          <span className="text-text-muted">Download the full catalogue:</span>
          <button
            type="button"
            onClick={() => downloadCatalogue('xlsx')}
            disabled={Boolean(downloading)}
            className="inline-flex items-center gap-1.5 text-oxblood transition-colors hover:text-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {downloading === 'xlsx' ? 'Preparing…' : 'Excel (.xlsx)'}
          </button>
          <button
            type="button"
            onClick={() => downloadCatalogue('csv')}
            disabled={Boolean(downloading)}
            className="inline-flex items-center gap-1.5 text-oxblood transition-colors hover:text-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {downloading === 'csv' ? 'Preparing…' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Results (after a search) */}
      {hasSearched && (
        <>
          {/* Results Summary */}
          <div className="mb-stack-sm flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="font-body-md text-body-md text-text-muted">
              {loading ? (
                'Searching…'
              ) : error ? (
                <span className="text-oxblood">Couldn’t load the catalogue.</span>
              ) : !hasCriteria ? (
                'Type a title, author, or keyword to search'
              ) : (
                <>
                  Found <strong className="text-on-surface">{resultCount.toLocaleString()}</strong>{' '}
                  {resultCount === 1 ? 'result' : 'results'}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <label className="font-label-md text-label-md text-text-muted" htmlFor="perPage">
                Results per page:
              </label>
              <select
                id="perPage"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="cursor-pointer rounded-lg border border-warm bg-surface py-2 pl-3 pr-9 font-body-md text-sm text-body-md transition-shadow focus:border-secondary-fixed-dim focus:ring-1 focus:ring-secondary-fixed-dim"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
          </div>

          {/* Results — editorial list */}
          <div className="mb-stack-md">
            {/* Column header */}
            <div className="hidden items-center gap-4 border-b border-warm pb-3 text-[11px] font-normal uppercase tracking-[0.16em] text-text-muted sm:flex">
              <span className="w-8 shrink-0">No.</span>
              <span className="flex-1">Manuscript</span>
              <span className="w-44 shrink-0">Language / Type</span>
              <span className="w-[6rem] shrink-0 text-right">Request</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4 border-b border-warm py-16 text-text-muted">
                <LoaderOne />
                <span className="font-body-md text-sm">Searching the archive…</span>
              </div>
            ) : pageRows.length === 0 ? (
              <div className="border-b border-warm py-12 text-center text-text-muted">
                {error
                  ? 'The catalogue could not be loaded. Please try again later.'
                  : hasCriteria
                    ? 'No books match your search.'
                    : 'Enter a title, author, or keyword above — or choose a filter — to search the archive.'}
              </div>
            ) : (
              <ul>
                {pageRows.map((b, i) => {
                  const inCart = has(b.id)
                  const num = String((currentPage - 1) * perPage + i + 1).padStart(2, '0')
                  return (
                    <li key={b.id} className="group border-b border-warm">
                      <div className="flex items-start gap-4 py-5">
                        <span className="hidden w-8 shrink-0 pt-1 text-sm tabular-nums text-text-muted sm:block">
                          {num}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-headline-md text-[19px] leading-snug text-ink transition-colors group-hover:text-oxblood">
                            {b.name}
                          </p>
                          {[b.author, b.tikakaar].filter(Boolean).length > 0 && (
                            <p className="mt-0.5 text-sm text-text-muted">
                              {[
                                b.author && `Karta: ${b.author}`,
                                b.tikakaar && `Tika: ${b.tikakaar}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                          {b.speciality && (
                            <p className="mt-0.5 text-sm italic text-text-muted">{b.speciality}</p>
                          )}
                          <p className="mt-1 text-sm text-text-muted sm:hidden">
                            {[b.language, b.type].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="hidden w-44 shrink-0 pt-1 text-sm text-text-muted sm:block">
                          {[b.language, b.type].filter(Boolean).join(' · ')}
                        </div>
                        <div className="w-[6rem] shrink-0 text-right">
                          <button
                            type="button"
                            onClick={() => toggle(b)}
                            aria-pressed={inCart}
                            className={`inline-flex items-center gap-1 py-1 font-label-md text-label-md transition-colors ${
                              inCart
                                ? 'text-olive hover:text-oxblood'
                                : 'text-oxblood hover:text-maroon-dark'
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              {inCart ? 'check_circle' : 'add'}
                            </span>
                            {inCart ? 'Added' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg border border-warm px-4 py-2 font-label-md text-label-md text-text-muted transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {pageItems.map((item) =>
              typeof item === 'string' ? (
                <span
                  key={item}
                  className="flex h-10 w-8 items-end justify-center pb-2 text-text-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={`h-10 min-w-[2.5rem] rounded-lg px-2 font-label-md text-label-md tabular-nums ${
                    item === currentPage
                      ? 'bg-primary text-straw shadow-sm'
                      : 'border border-warm text-on-surface transition-colors hover:bg-surface-container-low'
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg border border-warm px-4 py-2 font-label-md text-label-md text-text-muted transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Page indicator + jump-to-page for large result sets */}
          {totalPages > 1 && (
            <div className="mt-stack-sm flex flex-wrap items-center justify-center gap-3 text-text-muted">
              <span className="font-label-md text-label-md">
                Page <strong className="text-on-surface tabular-nums">{currentPage}</strong> of{' '}
                <span className="tabular-nums">{totalPages.toLocaleString()}</span>
              </span>
              {totalPages > 5 && (
                <span className="flex items-center gap-2">
                  <label htmlFor="jumpPage" className="font-label-md text-label-md">
                    Go to page
                  </label>
                  <input
                    id="jumpPage"
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    key={currentPage}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return
                      const n = Number(e.currentTarget.value)
                      if (n >= 1 && n <= totalPages) setPage(n)
                    }}
                    className="h-10 w-20 rounded-lg border border-warm bg-surface px-3 text-center font-body-md text-body-md tabular-nums transition-shadow focus:border-secondary-fixed-dim focus:ring-1 focus:ring-secondary-fixed-dim"
                  />
                </span>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
