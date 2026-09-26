import { useLanguage, LANGUAGES } from '../context/LanguageContext.jsx'

// Language popup. Shows automatically on first visit (blocking until a language
// is picked), and can be reopened any time from the navbar switcher.
export default function LanguageModal() {
  const { chosen, pickerOpen, setLang, closePicker, lang } = useLanguage()
  const open = !chosen || pickerOpen
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={chosen ? closePicker : undefined}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-warm bg-surface p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {chosen && (
          <button
            type="button"
            onClick={closePicker}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-cream-surface hover:text-oxblood"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}

        <img src="/logo.png" alt="Shrutsanjivan" className="mx-auto mb-4 h-16 w-auto" />
        <p className="eyebrow mb-3">Shrutsanjivan</p>
        <h2 className="mb-6 font-headline-md text-headline-md text-sepia">
          Select a language
          <span className="mt-1 block text-base text-text-muted">भाषा चुनें &middot; ભાષા પસંદ કરો</span>
        </h2>

        <div className="flex flex-col gap-3">
          {LANGUAGES.map((l) => {
            const active = chosen && l.code === lang
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`flex items-center justify-between rounded-lg border px-6 py-3 font-headline-md text-lg transition-colors ${
                  active
                    ? 'border-oxblood bg-cream-surface text-oxblood'
                    : 'border-warm text-ink hover:border-oxblood hover:bg-cream-surface'
                }`}
              >
                {l.label}
                {active && <span className="material-symbols-outlined text-oxblood">check_circle</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
