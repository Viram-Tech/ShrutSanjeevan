import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { REQUEST_WHATSAPP, REQUEST_EMAIL } from '../config.js'

// Builds the plain-text message the library receives, listing every requested
// book plus the requester's name and optional note.
function buildMessage(items, name, note) {
  const lines = ['Book request from the Shrutsanjivan website', '']
  if (name) lines.push(`Name: ${name}`, '')
  lines.push('Requested books:')
  items.forEach((b, i) => {
    const bhandar = b.bhandar ? ` — ${b.bhandar}` : ''
    lines.push(`${i + 1}. ${b.name} (No. ${b.id})${bhandar}`)
  })
  if (note) lines.push('', `Note: ${note}`)
  return lines.join('\n')
}

export default function CartDrawer({ open, onClose }) {
  const { items, remove, clear, count } = useCart()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  const message = buildMessage(items, name, note)
  const disabled = count === 0

  const sendWhatsApp = () => {
    if (disabled) return
    const url = `https://wa.me/${REQUEST_WHATSAPP}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
  }

  const sendEmail = () => {
    if (disabled) return
    const subject = `Book request (${count} book${count === 1 ? '' : 's'})`
    window.location.href = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Panel — styled like the request-list card */}
      <aside
        className={`keep-light fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-2xl border-y border-l border-warm bg-surface shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Request list"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-warm px-5 py-4">
          <h2 className="font-headline-md text-headline-md tracking-[0.12em] text-sepia">
            Request list{count > 0 ? ` · ${count}` : ''}
          </h2>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-oxblood">menu_book</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-text-muted transition-colors hover:text-oxblood"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {disabled ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-text-muted">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: '40px' }}>
                menu_book
              </span>
              <p className="font-body-md text-body-md">
                Your request list is empty. Add books from the Search page.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-warm">
              {items.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-body-md text-[17px] text-ink">{b.name}</p>
                    <p className="font-body-md text-sm text-text-muted">
                      {b.bhandar || `No. ${b.id}`}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    aria-label={`Remove ${b.name}`}
                    title="Remove from list"
                    className="group/rm flex-none text-olive transition-colors hover:text-oxblood"
                  >
                    <span className="material-symbols-outlined group-hover/rm:hidden" style={{ fontSize: '24px' }}>
                      check_circle
                    </span>
                    <span className="material-symbols-outlined hidden group-hover/rm:inline" style={{ fontSize: '24px' }}>
                      cancel
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer: requester details + actions */}
        {!disabled && (
          <div className="border-t border-warm px-5 py-4">
            <div className="mb-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
              <textarea
                rows={2}
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-y rounded-lg border border-warm bg-surface p-2.5 font-body-md text-sm focus:border-oxblood focus:outline-none focus:ring-2 focus:ring-oxblood/20"
              />
            </div>
            <button
              onClick={sendWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-oxblood px-4 py-3.5 font-label-md text-label-md text-straw shadow-sm transition-colors hover:bg-maroon-dark"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
              Request via WhatsApp
            </button>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={sendEmail}
                className="flex items-center gap-1.5 font-label-md text-label-md text-sm text-oxblood transition-colors hover:text-maroon-dark"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
                Email instead
              </button>
              <button
                onClick={clear}
                className="font-label-md text-label-md text-sm text-text-muted transition-colors hover:text-oxblood"
              >
                Clear list
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
