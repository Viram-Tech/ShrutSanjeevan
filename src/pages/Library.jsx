import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLibrary } from '../lib/libraryStore.js'
import PdfReaderModal from '../components/PdfReaderModal.jsx'
import Dialog from '../components/Dialog.jsx'
import HindiKeyboard from '../components/HindiKeyboard.jsx'
import { trackDownload } from '../lib/analytics.js'
import { incrementDownloadCount } from '../lib/downloadCounter.js'
import DownloadCounter from '../components/DownloadCounter.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import Seo from '../components/Seo.jsx'
import { seo } from '../data/seo.js'

// Records a download in both Google Analytics and the live shared counter.
// `count` lets a whole-book download tally all its chapters at once.
function recordDownload(book, count = 1) {
  trackDownload(book)
  incrementDownloadCount(count)
}

// Deterministic jacket themes so every book gets a distinct, stable cover.
const COVERS = [
  { bg: 'linear-gradient(150deg,#7c1d1a,#8a1f1c 55%,#5f1512)', fg: '#f3e9d6', accent: '#d9a441' },
  { bg: 'linear-gradient(150deg,#22323b,#2f4a54 55%,#1c2b31)', fg: '#eef3f1', accent: '#cfa15a' },
  { bg: 'linear-gradient(150deg,#3c3c1f,#55552b 55%,#2b2b16)', fg: '#f2efcf', accent: '#cbb24a' },
  { bg: 'linear-gradient(150deg,#48300f,#5c4326 55%,#382512)', fg: '#f4e6d1', accent: '#d9a441' },
  { bg: 'linear-gradient(150deg,#2a2340,#3d3560 55%,#201a34)', fg: '#ece8f5', accent: '#c3a3e6' },
  { bg: 'linear-gradient(150deg,#123a34,#1c5147 55%,#0e2a26)', fg: '#e8f2ee', accent: '#cfa15a' },
]
const coverFor = (id) =>
  COVERS[[...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % COVERS.length]

const selectClass =
  'appearance-none rounded-full border border-warm bg-surface px-4 py-2.5 pr-9 font-body-md text-sm text-on-surface transition-shadow focus:border-secondary-fixed-dim focus:ring-2 focus:ring-secondary-fixed-dim focus:ring-opacity-50'

// Filters shown inside the search bar — borderless, plain, like the archive controls.
const inBarSelectClass =
  'appearance-none cursor-pointer border-0 bg-transparent px-3 py-1.5 pr-9 font-label-md text-label-md text-text-muted transition-colors hover:text-oxblood focus:border-0 focus:outline-none focus:ring-0'

export default function Library() {
  // The toolbar's state is seedable from the query string, so a link can arrive
  // already searched — this is what the chat assistant's button carries when a
  // visitor asks for a book by name. Seeded here on mount, then kept in step by
  // the sync effect below.
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(() => searchParams.get('q') || '')
  const [language, setLanguage] = useState(() => searchParams.get('language') || '')
  const [topic, setTopic] = useState(() => searchParams.get('topic') || '')
  const [sort, setSort] = useState('title')
  const [hindiKb, setHindiKb] = useState(false)
  const keywordRef = useRef(null)

  // Re-read the URL when the query string changes on an already-mounted page.
  // React Router does not remount for a same-route navigation, so without this
  // a second link — the chat assistant sending a visitor from /library?q=a to
  // /library?q=b, or the Back button — would change the address bar and nothing
  // else. Mirrors the same effect on the Archive page.
  //
  // Safe unconditionally: this page never writes its own URL, so every change
  // to it comes from outside and always means "search for something new".
  const paramsKey = searchParams.toString()
  const appliedParams = useRef(paramsKey)
  useEffect(() => {
    if (paramsKey === appliedParams.current) return // already seeded by useState
    appliedParams.current = paramsKey
    const next = new URLSearchParams(paramsKey)
    setKeyword(next.get('q') || '')
    setLanguage(next.get('language') || '')
    setTopic(next.get('topic') || '')
  }, [paramsKey])

  const { t } = useLanguage()
  const lp = t.libraryPage
  const [selected, setSelected] = useState(null)
  const [reading, setReading] = useState(null)
  const [chapterSel, setChapterSel] = useState(new Set())
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)

  // Load the catalogue (Sanity when configured, else the sample list).
  useEffect(() => {
    let alive = true
    getLibrary().then((data) => {
      if (!alive) return
      setAllBooks(data)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const languages = useMemo(
    () => [...new Set(allBooks.map((b) => b.language).filter(Boolean))].sort(),
    [allBooks]
  )
  const topics = useMemo(
    () => [...new Set(allBooks.map((b) => b.topic).filter(Boolean))].sort(),
    [allBooks]
  )

  // A seeded ?language=/?topic= that no book carries would leave a dropdown
  // showing an option it does not have and a filter that can only ever return
  // nothing. Once the catalogue is in, drop anything the data cannot back.
  useEffect(() => {
    if (!allBooks.length) return
    setLanguage((v) => (v && !languages.includes(v) ? '' : v))
    setTopic((v) => (v && !topics.includes(v) ? '' : v))
  }, [allBooks, languages, topics])

  const openBook = (b) => {
    setSelected(b)
    setChapterSel(new Set())
  }

  const toggleChapter = (i) =>
    setChapterSel((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const toggleAll = () =>
    setChapterSel((prev) =>
      prev.size === selected.chapters.length
        ? new Set()
        : new Set(selected.chapters.map((_, i) => i))
    )

  const readChapter = (ch) => {
    if (!ch.previewUrl) return
    setReading({ title: `${selected.title} — ${ch.title}`, previewUrl: ch.previewUrl })
    setSelected(null)
  }

  // Download each chapter as an actual file. We fetch into a Blob and save it,
  // rather than opening new tabs — multiple new tabs get pop-up-blocked (only
  // the first opens), which is the bug this replaces. Falls back to opening the
  // URL if the file can't be fetched (e.g. the host blocks cross-origin reads).
  const downloadChapters = async (chs) => {
    const list = chs.filter((c) => c.downloadUrl)
    for (const ch of list) {
      const filename = `${selected.title} — ${ch.title}.pdf`.replace(/[\\/:*?"<>|]+/g, '-')
      try {
        const res = await fetch(ch.downloadUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const href = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = href
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(href)
      } catch {
        window.open(ch.downloadUrl, '_blank', 'noopener')
      }
      recordDownload({ ...selected, chapter: ch.title })
    }
  }

  const downloadSelected = () => {
    const chs = [...chapterSel].sort((a, b) => a - b).map((i) => selected.chapters[i])
    downloadChapters(chs)
  }

  // "Download whole book": use a single combined file if the book has one,
  // otherwise select and download every chapter.
  const downloadWholeBook = () => {
    const chapters = selected.chapters || []
    if (selected.downloadUrl) {
      const a = document.createElement('a')
      a.href = selected.downloadUrl
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      recordDownload(selected, chapters.filter((c) => c.downloadUrl).length || 1)
      return
    }
    downloadChapters(chapters)
  }

  const books = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = allBooks.filter((b) => {
      const matchesKeyword =
        !kw ||
        [b.title, b.author, b.topic, b.summary]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(kw)
      const matchesLanguage = !language || b.language === language
      const matchesTopic = !topic || b.topic === topic
      return matchesKeyword && matchesLanguage && matchesTopic
    })
    return [...list].sort((a, b) => {
      if (sort === 'year') return (b.year || 0) - (a.year || 0)
      if (sort === 'author') return (a.author || '').localeCompare(b.author || '')
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [keyword, language, topic, sort, allBooks])

  const chevron = (
    <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
      expand_more
    </span>
  )

  return (
    <>
      <Seo {...seo.library} />
      {/* Header */}
      <div className="mb-stack-md flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">{lp.eyebrow}</p>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-sepia">{lp.title}</h1>
          <p className="mt-2 font-body-lg text-body-lg text-text-muted">
            {lp.subtitle}
          </p>
        </div>
        <DownloadCounter label={lp.downloaded} className="md:flex-col md:items-end md:gap-0 md:text-right" />
      </div>

      {/* Toolbar — one search bar with the filters inside it */}
      <div className="mb-stack-md rounded-2xl border border-warm bg-surface px-4 py-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-secondary-fixed-dim focus-within:ring-opacity-50">
        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-1 top-1/2 -translate-y-1/2 text-secondary-fixed-dim">
            search
          </span>
          <input
            ref={keywordRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search your library…"
            className="w-full border-0 bg-transparent py-2 pl-10 pr-1 font-body-md text-body-md text-on-surface outline-none placeholder:text-text-muted focus:border-0 focus:outline-none focus:ring-0"
          />
        </div>
        {/* Filters */}
        <div className="mt-1 flex flex-wrap items-center gap-1 border-t border-warm pt-2">
          <div className="relative">
            <select className={inBarSelectClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {chevron}
          </div>
          <div className="relative">
            <select className={inBarSelectClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {chevron}
          </div>
          <div className="relative">
            <select className={inBarSelectClass} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
              <option value="year">Sort: Newest</option>
            </select>
            {chevron}
          </div>

          {/* Hindi keyboard toggle */}
          <button
            type="button"
            onClick={() => setHindiKb((v) => !v)}
            aria-pressed={hindiKb}
            title="हिन्दी कीबोर्ड"
            className={`indic ml-auto inline-flex items-center px-3 py-1.5 font-label-md text-label-md transition-colors ${
              hindiKb ? 'text-oxblood' : 'text-text-muted hover:text-oxblood'
            }`}
          >
            हिन्दी
          </button>
        </div>

        {/* On-screen Hindi keyboard */}
        {hindiKb && (
          <HindiKeyboard
            inputRef={keywordRef}
            value={keyword}
            setValue={setKeyword}
            onClose={() => setHindiKb(false)}
          />
        )}
      </div>

      {!loading && (
        <p className="mb-stack-md font-body-md text-sm text-text-muted">
          <strong className="text-on-surface">{books.length}</strong>{' '}
          {books.length === 1 ? 'book' : 'books'}
        </p>
      )}

      {/* Cover grid */}
      {loading ? (
        <div className="rounded-xl border border-warm bg-surface-container-lowest p-8 text-center text-text-muted">
          Loading library…
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border border-warm bg-surface-container-lowest p-8 text-center text-text-muted">
          No books match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-gutter gap-y-stack-md sm:grid-cols-3 lg:grid-cols-4">
          {books.map((b) => {
            const c = coverFor(b.id)
            return (
              <div key={b.id} className="group">
                {/* Jacket */}
                <div
                  onClick={() => openBook(b)}
                  className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded-md shadow-md ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                  style={{ background: c.bg }}
                >
                  {/* spine + jacket frame */}
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-black/25" />
                  <div className="absolute inset-3 rounded-sm border" style={{ borderColor: `${c.accent}55` }} />

                  {/* title block */}
                  <div className="relative flex h-full flex-col items-center justify-center px-4 pb-8 text-center">
                    <span className="mb-2 text-lg leading-none" style={{ color: c.accent }}>॥</span>
                    <h3
                      className="font-headline-md text-[17px] leading-tight line-clamp-4"
                      style={{ color: c.fg }}
                    >
                      {b.title}
                    </h3>
                    <span className="my-2.5 block h-px w-8" style={{ background: c.accent }} />
                    <p
                      className="text-[10px] uppercase tracking-[0.16em] line-clamp-1"
                      style={{ color: c.fg, opacity: 0.75 }}
                    >
                      {b.author}
                    </p>
                  </div>

                  {/* language, bottom */}
                  <span
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.18em]"
                    style={{ color: c.fg, opacity: 0.6 }}
                  >
                    {b.language} · {b.pages} pp
                  </span>

                  {/* hover quick actions */}
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-3 items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openBook(b)
                      }}
                      title="View details"
                      className="flex flex-1 items-center justify-center gap-1 rounded-md bg-surface/95 py-1.5 font-label-md text-xs text-oxblood shadow transition-colors hover:bg-surface"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_stories</span>
                      Read
                    </button>
                  </div>
                </div>

                {/* caption under cover */}
                <button
                  type="button"
                  onClick={() => openBook(b)}
                  className="mt-2.5 block w-full text-left"
                >
                  <p className="line-clamp-1 text-sm font-normal text-ink transition-colors group-hover:text-oxblood">
                    {b.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-text-muted">
                    {b.author} · {b.year}
                  </p>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Details dialog */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        ariaLabel={selected?.title}
        panelClassName="keep-light bg-surface-container-lowest rounded-xl shadow-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto"
      >
        {selected && (
          <div className="flex flex-col gap-5 p-stack-md sm:flex-row">
            {/* mini cover */}
            <div
              className="relative hidden aspect-[2/3] w-56 shrink-0 self-start overflow-hidden rounded-md shadow-md ring-1 ring-black/10 sm:block"
              style={{ background: coverFor(selected.id).bg }}
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-black/25" />
              <div className="absolute inset-3 rounded-sm border" style={{ borderColor: `${coverFor(selected.id).accent}55` }} />
              <div className="relative flex h-full flex-col items-center justify-center px-5 pb-8 text-center">
                <span className="mb-2 text-lg leading-none" style={{ color: coverFor(selected.id).accent }}>॥</span>
                <h3 className="font-headline-md text-[19px] leading-tight" style={{ color: coverFor(selected.id).fg }}>
                  {selected.title}
                </h3>
                <span className="my-2.5 block h-px w-8" style={{ background: coverFor(selected.id).accent }} />
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: coverFor(selected.id).fg, opacity: 0.75 }}>
                  {selected.author}
                </p>
              </div>
              <span
                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.18em]"
                style={{ color: coverFor(selected.id).fg, opacity: 0.6 }}
              >
                {selected.language} · {selected.pages} pp
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-stack-sm flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">{selected.title}</h2>
                  <p className="font-body-md text-body-md text-text-muted">
                    {selected.author} · {selected.language} · {selected.year} · {selected.pages} pages
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <h3 className="mb-base font-label-md text-label-md uppercase text-on-surface">Summary</h3>
              <p className="mb-stack-md font-body-md text-body-md text-text-muted">{selected.summary}</p>

              {selected.chapters?.length ? (
                <>
                  <div className="mb-base flex items-center justify-between">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface">
                      Chapters <span className="text-text-muted">· {selected.chapters.length}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs font-normal text-oxblood transition-colors hover:underline"
                    >
                      {chapterSel.size === selected.chapters.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  <ul className="mb-stack-sm border-t border-warm">
                    {selected.chapters.map((ch, i) => {
                      const n = String(i + 1).padStart(2, '0')
                      return (
                        <li key={ch.title} className="flex items-center gap-4 border-b border-warm py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleChapter(i)}
                            aria-pressed={chapterSel.has(i)}
                            aria-label={`Select ${ch.title}`}
                            className="shrink-0 leading-none"
                          >
                            <span
                              className={`material-symbols-outlined ${
                                chapterSel.has(i) ? 'text-olive' : 'text-text-muted/60'
                              }`}
                              style={{ fontSize: '22px' }}
                            >
                              {chapterSel.has(i) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </button>
                          <span className="hidden w-7 shrink-0 text-sm tabular-nums text-text-muted sm:block">
                            {n}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-headline-md text-[17px] leading-snug text-ink">{ch.title}</p>
                            {ch.pages ? <p className="mt-0.5 text-sm text-text-muted">{ch.pages} pp.</p> : null}
                          </div>
                          <button
                            type="button"
                            disabled={!ch.previewUrl}
                            onClick={() => readChapter(ch)}
                            title="Preview chapter online"
                            className="shrink-0 rounded-full border border-warm px-3 py-1.5 font-label-md text-label-md text-oxblood transition-colors hover:border-oxblood hover:bg-cream-surface disabled:opacity-40"
                          >
                            Preview
                          </button>
                          <a
                            href={ch.downloadUrl || undefined}
                            target="_blank"
                            rel="noopener"
                            onClick={() => ch.downloadUrl && recordDownload({ ...selected, chapter: ch.title })}
                            title="Download chapter"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-oxblood transition-colors hover:bg-cream-surface ${
                              ch.downloadUrl ? '' : 'pointer-events-none opacity-40'
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                          </a>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={chapterSel.size === 0}
                      onClick={downloadSelected}
                      className="flex items-center gap-1 rounded-lg border border-primary px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                      Download selected{chapterSel.size ? ` (${chapterSel.size})` : ''}
                    </button>
                    <button
                      type="button"
                      disabled={
                        !selected.downloadUrl &&
                        !(selected.chapters || []).some((c) => c.downloadUrl)
                      }
                      onClick={downloadWholeBook}
                      className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu_book</span>
                      Download whole book
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!selected.previewUrl}
                    onClick={() => {
                      setReading(selected)
                      setSelected(null)
                    }}
                    className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_stories</span>
                    Read preview
                  </button>
                  <a
                    href={selected.downloadUrl || undefined}
                    target="_blank"
                    rel="noopener"
                    aria-disabled={!selected.downloadUrl}
                    onClick={() => selected.downloadUrl && recordDownload(selected)}
                    className={`flex items-center gap-1 rounded-lg border border-primary px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low ${
                      selected.downloadUrl ? '' : 'pointer-events-none opacity-50'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Partial-preview PDF reader */}
      <PdfReaderModal
        open={Boolean(reading)}
        title={reading?.title}
        url={reading?.previewUrl}
        onClose={() => setReading(null)}
      />
    </>
  )
}
