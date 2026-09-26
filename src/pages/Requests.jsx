import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import Dialog from '../components/Dialog.jsx'
import { REQUEST_WHATSAPP, REQUEST_EMAIL } from '../config.js'
import Seo from '../components/Seo.jsx'
import { seo } from '../data/seo.js'

// Builds the plain-text message the library receives.
function buildMessage(items, name, phone, email, note) {
  const lines = ['Book request from the Shrutsanjivan website', '']
  if (name) lines.push(`Name: ${name}`)
  if (phone) lines.push(`Phone: ${phone}`)
  if (email) lines.push(`Email: ${email}`)
  if (name || phone || email) lines.push('')
  lines.push('Requested books:')
  items.forEach((b, i) => {
    const detail = [b.author, b.tikakaar, b.language].filter(Boolean).join(', ')
    lines.push(`${i + 1}. ${b.name}${detail ? ` — ${detail}` : ''}`)
  })
  if (note) lines.push('', `Note: ${note}`)
  return lines.join('\n')
}

export default function Requests() {
  const { items, remove, clear, count } = useCart()
  const { t } = useLanguage()
  const r = t.requestsPage
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const message = buildMessage(items, name, phone, email, note)
  const disabled = count === 0
  const contactMissing = !name.trim() || !phone.trim() || !email.trim()
  const canSend = !disabled && !contactMissing

  const sendWhatsApp = () => {
    if (!canSend) return
    const url = `https://wa.me/${REQUEST_WHATSAPP}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
  }

  const sendEmail = () => {
    if (!canSend) return
    const subject = `Book request (${count} book${count === 1 ? '' : 's'})`
    window.location.href = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`
  }

  return (
    <div className="min-h-[calc(100vh-6rem)]">
      <Seo {...seo.requests} />
      {/* Header */}
      <div className="mb-stack-md">
        <p className="eyebrow mb-2">{r.eyebrow}</p>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-sepia">
          {r.title}{count > 0 ? ` · ${count}` : ''}
        </h1>
        <p className="mt-2 font-body-lg text-body-lg text-text-muted">
          {r.intro}
        </p>
      </div>

      {disabled ? (
        <div className="rounded-xl border border-warm bg-surface-container-lowest p-12 text-center">
          <span className="material-symbols-outlined mb-3 text-oxblood" style={{ fontSize: '44px' }}>
            menu_book
          </span>
          <p className="mb-6 font-body-md text-body-md text-text-muted">
            {r.empty}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            {r.browse}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-stack-lg lg:grid-cols-[1fr_360px]">
          {/* List */}
          <div>
            <ul className="border-t border-warm">
              {items.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 border-b border-warm py-4">
                  <div className="min-w-0">
                    <p className="font-headline-md text-[18px] leading-snug text-ink">{b.name}</p>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {[b.author, b.tikakaar, b.language].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    aria-label={`Remove ${b.name}`}
                    title="Remove from list"
                    className="flex-none text-text-muted transition-colors hover:text-oxblood"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>cancel</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setConfirmClear(true)}
              className="mt-stack-sm font-label-md text-label-md text-sm text-text-muted transition-colors hover:text-oxblood"
            >
              {r.clear}
            </button>
          </div>

          {/* Action card */}
          <aside className="h-fit rounded-xl border border-warm bg-surface-container-lowest p-stack-md lg:sticky lg:top-6">
            <h2 className="mb-stack-sm font-headline-md text-headline-md text-sepia">{r.sendTitle}</h2>
            <div className="mb-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder={`${r.namePh} *`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
              <input
                type="tel"
                placeholder={`${r.phonePh} *`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
              <input
                type="email"
                placeholder={`${r.emailPh} *`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
              <textarea
                rows={3}
                placeholder={r.notePh}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-y rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
            </div>
            <button
              onClick={sendWhatsApp}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-oxblood px-4 py-3.5 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-oxblood"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
              {r.whatsapp}
            </button>
            <button
              onClick={sendEmail}
              disabled={!canSend}
              className="mt-3 flex w-full items-center justify-center gap-1.5 font-label-md text-label-md text-sm text-oxblood transition-colors hover:text-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
              {r.email}
            </button>
          </aside>
        </div>
      )}

      {/* Clear-list confirmation */}
      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        ariaLabel="Clear request list"
        panelClassName="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-stack-md"
      >
        <h2 className="font-headline-md text-headline-md text-sepia">{r.clearTitle}</h2>
        <p className="mt-2 font-body-md text-body-md text-text-muted">
          {r.clearBody}
        </p>
        <div className="mt-stack-md flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmClear(false)}
            className="rounded-lg border border-warm px-5 py-2 font-label-md text-label-md text-ink transition-colors hover:bg-surface-container-low"
          >
            {r.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              clear()
              setConfirmClear(false)
            }}
            className="rounded-lg bg-primary px-5 py-2 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark"
          >
            {r.clear}
          </button>
        </div>
      </Dialog>
    </div>
  )
}
