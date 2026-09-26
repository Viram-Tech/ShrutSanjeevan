import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from '../data/translations.js'

// The three languages the site offers.
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
]

const LanguageContext = createContext(null)
const STORAGE_KEY = 'shrutsanjivan.lang'

export function LanguageProvider({ children }) {
  // `null` until the visitor picks a language (triggers the first-visit modal).
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  // On-demand language picker (opened from the navbar switcher).
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!lang) return
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* storage unavailable — ignore */
    }
  }, [lang])

  const setLang = (code) => {
    setLangState(code)
    setPickerOpen(false)
  }

  const value = {
    lang,
    setLang,
    chosen: Boolean(lang),
    t: translations[lang || 'en'],
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
