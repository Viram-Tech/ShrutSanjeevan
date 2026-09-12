import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

// A small site guide that answers "where do I find…" questions. It posts to
// /api/chat, which holds the OpenRouter key and the assistant's brief — this
// component only carries the conversation and the UI.
//
// Replies may contain a site path — the assistant answers "do you have X?" with
// a pre-filled search link rather than a claim about the catalogue it cannot
// see. Those paths are rendered as real in-app links below; written as plain
// text they would be something the visitor has to retype, which defeats the
// point.

// The routes a reply is allowed to link to (src/App.jsx). Anything else in a
// reply stays plain text, so a hallucinated path cannot become a dead link the
// visitor is invited to click.
const LINKABLE = 'search|library|requests|contact|about'

// A path, plus its query string if it has one. Two guards earn their keep: the
// lookahead stops "/searching" being linked as "/search", and the final class
// keeps sentence punctuation out, so "…try /search?q=kalpasutra." does not
// swallow the full stop into the link.
const PATH_RE = new RegExp(
  `(/(?:${LINKABLE})(?![\\w-])(?:\\?[^\\s)\\]]*[^\\s)\\].,;:!?])?)`,
  'g',
)

// The brief asks for plain sentences, but the free models on the fallback chain
// reach for markdown anyway — **bold** headings and * bullets are the common
// two. The bubble renders text verbatim, so those arrive as literal asterisks.
// Strip the markers rather than render them: this is a chat bubble, and a
// markdown parser here would be a lot of surface area for a stray asterisk.
function stripMarkdown(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+)__/g, '$1') // __bold__
    .replace(/^[ \t]*[*-][ \t]+/gm, '• ') // "* item" / "- item" -> a real bullet
}

// Split a reply into text and link segments. The capture group in PATH_RE means
// String.split keeps the matches, so the pieces alternate text, path, text…
function segments(text) {
  return stripMarkdown(text)
    .split(PATH_RE)
    .filter((part) => part !== '' && part !== undefined)
    .map((part, i) => ({ key: i, path: PATH_RE.test(part) ? reset(part) : null, part }))
}

// PATH_RE is global, so .test() advances lastIndex and the next call on the same
// string would miss. Reset it and hand the value back in one step.
function reset(value) {
  PATH_RE.lastIndex = 0
  return value
}

export default function ChatWidget() {
  const { lang, t } = useLanguage()
  const c = t.chat
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Freeze the page behind the sheet while it is open on a phone.
  //
  // overscroll-contain alone is not enough: the sheet covers the viewport, so
  // any touch that starts outside the message list still drags the page around
  // underneath it. Only on mobile — on desktop the panel is a small corner card
  // and locking the whole page while it is open would be obstructive.
  //
  // position:fixed rather than overflow:hidden because iOS Safari ignores
  // overflow:hidden on body; the scroll offset is stashed and restored so the
  // visitor comes back to where they were rather than the top of the page.
  useEffect(() => {
    if (!open) return
    if (!window.matchMedia('(max-width: 639px)').matches) return

    const { position, top, width, overflow } = document.body.style
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      document.body.style.overflow = overflow
      window.scrollTo(0, y)
    }
  }, [open])

  // Escape closes the panel, matching the site's other overlays.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(text) {
    const question = text.trim()
    if (!question || busy) return

    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setDraft('')
    setError(null)
    setBusy(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, lang }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // The proxy distinguishes "too many questions" and "not set up yet"
        // from a generic fault, so the visitor gets a useful sentence.
        setError(
          data.error === 'rate_limited'
            ? c.errorBusy
            : data.error === 'not_configured'
              ? c.errorUnavailable
              : c.error,
        )
        return
      }
      // `action` rides along on the message rather than firing a navigation.
      // The visitor decides when to leave the conversation — a chat that moves
      // the page on its own takes the choice away, and they may well want to
      // narrow the search first.
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply, actions: data.actions ?? [] },
      ])
    } catch {
      setError(c.errorNetwork)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? c.close : c.open}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-oxblood text-white shadow-lg transition hover:bg-oxblood-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-3.6-.7L3 21l1.9-5A8.2 8.2 0 014 11.5 8.4 8.4 0 0112.5 3 8.4 8.4 0 0121 11.5z"
            />
          )}
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={c.title}
          // Mobile is a bottom sheet: edge to edge, anchored to the bottom, only
          // the top corners rounded. The floating card that works on desktop
          // wastes a margin all the way round on a phone and still has to leave
          // room for the launcher beneath it. From sm up it goes back to the
          // card.
          className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-rule bg-parchment shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:max-h-[min(32rem,calc(100dvh-8rem))] sm:w-[calc(100vw-2.5rem)] sm:max-w-sm sm:rounded-2xl sm:border-b"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-rule px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-ink">{c.title}</p>
              <p className="text-xs text-text-muted">{c.subtitle}</p>
            </div>
            {/* The sheet covers the launcher on a phone, so closing needs its
                own control here. Hidden from sm up, where the launcher is
                visible and already toggles the panel. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-cream-surface hover:text-ink sm:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {/* overscroll-contain stops the bounce at either end of this list
              from being handed to the page underneath — the reason scrolling
              the conversation on a phone moved the results behind it. */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-text-muted">{c.greeting}</p>
                <div className="flex flex-wrap gap-2">
                  {c.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-rule px-3.5 py-2 text-[13px] text-sepia transition hover:border-olive hover:text-ink sm:py-1.5 sm:text-xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={m.role === 'user' ? '' : 'space-y-2'}>
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed sm:text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-oxblood text-white'
                    : 'mr-auto bg-cream-surface text-ink'
                }`}
              >
                {m.role === 'assistant'
                  ? segments(m.content).map(({ key, path, part }) =>
                      path ? (
                        <Link
                          key={key}
                          to={path}
                          onClick={() => setOpen(false)}
                          className="font-medium text-oxblood underline decoration-oxblood/40 underline-offset-2 transition hover:decoration-oxblood"
                        >
                          {part}
                        </Link>
                      ) : (
                        <span key={key}>{part}</span>
                      ),
                    )
                  : m.content}
              </div>

              {/* The search result-set, as a button rather than a pasted URL.
                  A raw /search?q=…&language=… wraps across lines and shows the
                  visitor query-string plumbing; this says what they will get
                  and how many, and the path stays out of sight. */}
              {m.actions?.map((a) => (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => {
                    navigate(a.path)
                    // On a phone the sheet covers the results it just opened,
                    // so following the button has to collapse it — otherwise
                    // the visitor taps "see 175 results" and still sees the
                    // conversation. On desktop it stays open, where the panel
                    // sits beside the results and narrowing the search from
                    // there is the whole point.
                    if (window.matchMedia('(max-width: 639px)').matches) setOpen(false)
                  }}
                  className="mr-auto flex w-full items-center justify-between gap-2 rounded-2xl border border-oxblood/25 sm:w-[85%] bg-oxblood/[0.06] px-4 py-3 text-left text-[15px] font-medium text-oxblood transition sm:px-3.5 sm:py-2.5 sm:text-sm hover:border-oxblood/50 hover:bg-oxblood/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-oxblood"
                >
                  <span>{a.label}</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </button>
              ))}
              </div>
            ))}

            {busy && (
              <p className="mr-auto text-sm text-text-muted" aria-live="polite">
                {c.thinking}
              </p>
            )}
            {error && (
              <p className="mr-auto text-sm text-oxblood" role="alert">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
            className="flex shrink-0 items-center gap-2 border-t border-rule px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={c.placeholder}
              maxLength={1000}
              aria-label={c.placeholder}
              className="min-w-0 flex-1 rounded-full border border-rule bg-straw px-4 py-2.5 text-base text-ink placeholder:text-text-muted focus:border-olive focus:outline-none focus:ring-0 sm:py-2 sm:text-sm"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={c.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-oxblood text-white transition hover:bg-oxblood-dark disabled:opacity-40 sm:h-9 sm:w-9"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <p className="shrink-0 border-t border-rule px-4 py-2 text-[11px] text-text-muted">{c.disclaimer}</p>
        </div>
      )}
    </>
  )
}
