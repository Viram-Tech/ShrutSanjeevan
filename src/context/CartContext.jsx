import { createContext, useContext, useEffect, useMemo, useState } from 'react'

// A lightweight "request cart" for the Search page. Users collect books they
// want to request; the list is sent to the library via WhatsApp or email.
// Persisted to localStorage so it survives navigation and page reloads.

const CartContext = createContext(null)
const STORAGE_KEY = 'shrutsanjivan.requestCart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [items])

  const value = useMemo(() => ({
    items,
    count: items.length,
    has: (id) => items.some((b) => b.id === id),
    add: (book) =>
      setItems((prev) => (prev.some((b) => b.id === book.id) ? prev : [...prev, book])),
    remove: (id) => setItems((prev) => prev.filter((b) => b.id !== id)),
    toggle: (book) =>
      setItems((prev) =>
        prev.some((b) => b.id === book.id)
          ? prev.filter((b) => b.id !== book.id)
          : [...prev, book],
      ),
    clear: () => setItems([]),
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
