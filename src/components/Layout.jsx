import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Footer from './Footer.jsx'
import ChatWidget from './ChatWidget.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import LanguageModal from './LanguageModal.jsx'
// TEMPORARY: dark mode is off site-wide — see the note in index.html.
// import ThemeToggle from './ThemeToggle.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Layout() {
  const { count } = useCart()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isArchivePage = pathname.startsWith('/search')
  const reduce = useReducedMotion()

  // Primary inline links shown on desktop. Archive also keeps its icon on the
  // right, which swaps to the request list while on the archive page.
  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/about', label: t.nav.about },
    { to: '/search', label: t.nav.archive },
    { to: '/library', label: t.nav.library },
    { to: '/contact', label: t.nav.contact },
  ]
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  // Full menu — all pages, always shown.
  const menuItems = [
    { link: '/', text: t.nav.home, image: '/images/hero-garden.jpg' },
    { link: '/about', text: t.nav.about, image: '/images/manuscript-texture.png' },
    { link: '/search', text: t.nav.archive, image: '/images/pages/p1.jpg' },
    { link: '/library', text: t.nav.library, image: '/images/manuscript-cover.jpg' },
    {
      link: '/requests',
      text: count > 0 ? `${t.requestCart} (${count})` : t.requestCart,
      image: '/images/manuscript-cover.jpg',
    },
    { link: '/contact', text: t.nav.contact, image: '/images/garden-strip.jpg' },
  ]

  // On navigation, close the menu and jump to the top of the new page.
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Lock body scroll while the full-screen menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  // Hide the glass navbar on scroll-down, reveal it on scroll-up
  // (always shown near the top and whenever the menu is open). `scrolled`
  // drives the Aceternity-style shrink, matching ViramTech's navbar.
  const [navHidden, setNavHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // The pill's padding is animated inline, so it can't come from a Tailwind
  // breakpoint — track the viewport instead and use tighter padding on phones.
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const onChange = (e) => setIsCompact(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const lastScrollY = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 80)
      // Stay visible until we've scrolled past one full viewport; after that,
      // hide on scroll-down and reveal on scroll-up.
      if (y < window.innerHeight) {
        setNavHidden(false)
      } else if (y > lastScrollY.current + 4) {
        setNavHidden(true) // scrolling down
      } else if (y < lastScrollY.current - 4) {
        setNavHidden(false) // scrolling up
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navbar — floating glass pill, exact ViramTech dimensions (max-w 80rem,
          shrinking to 64rem on scroll); hides on scroll-down, returns on scroll-up.
          `keep-light` pins the pill (and its dropdown) to the light palette in dark
          mode so the logo video's white background blends into it — no plate needed.
          It also goes fully opaque in dark mode: a translucent white over dark page
          content would drag the video's multiply blend back down to grey. */}
      <motion.nav
        initial={false}
        animate={{
          maxWidth: scrolled ? '64rem' : '80rem',
          top: scrolled ? '1rem' : '0.75rem',
          y: navHidden && !menuOpen ? '-140%' : '0%',
          opacity: navHidden && !menuOpen ? 0 : 1,
          paddingTop: scrolled ? '0.5rem' : '0.75rem',
          paddingBottom: scrolled ? '0.5rem' : '0.75rem',
          paddingLeft: isCompact ? '0.875rem' : scrolled ? '1.25rem' : '1.75rem',
          paddingRight: isCompact ? '0.875rem' : scrolled ? '1.25rem' : '1.75rem',
          boxShadow: scrolled ? '0 12px 32px rgba(0,0,0,0.12)' : '0 6px 20px rgba(0,0,0,0.08)',
        }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 50 }}
        className="keep-light fixed inset-x-0 z-50 mx-auto flex w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-warm/60 bg-surface/70 backdrop-blur-md supports-[backdrop-filter]:bg-surface/60 dark:bg-surface sm:gap-6 lg:gap-8"
      >
        {/* Left: logo + wordmark */}
        <Link
          to="/"
          aria-label="Shrutsanjivan"
          className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3"
        >
          {/* Logo video: white background dropped via multiply onto the glass,
              which stays light in both themes. The source clip is 768×980 with
              wide white margins (and a watermark in the bottom corner), so the
              artwork — x 100–690, y 150–870 — is cropped to fill this box: scale
              to 980/720 of the box height, then shift the 100px/150px offsets
              back out of view. */}
          <span className="relative block h-8 w-[26px] shrink-0 overflow-hidden rounded-md sm:h-9 sm:w-[29px]">
            <video
              src="/nav-logo.mp4"
              className="absolute left-0 top-0 h-[136.1%] w-auto max-w-none -translate-x-[13.02%] -translate-y-[15.31%] mix-blend-multiply"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          </span>
          <span className="truncate font-headline-lg text-[15px] leading-[1.35] text-sepia sm:text-[24px]">
            Shrutsanjivan
          </span>
        </Link>

        {/* Center: primary links (desktop only) */}
        <ul className="hidden items-center gap-1 text-sm font-normal lg:flex">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`px-3 py-2 transition-colors ${
                  isActive(link.to) ? 'text-oxblood' : 'text-ink/80 hover:text-oxblood'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: contextual archive/request icon, controls, mobile menu */}
        <div className="flex shrink-0 items-center justify-end gap-0.5 sm:flex-1 sm:gap-2">
          {isArchivePage ? (
            // On the archive page the icon becomes the request list, badged with its count.
            <Link
              to="/requests"
              aria-label={`${t.requestCart}${count > 0 ? ` (${count})` : ''}`}
              title={t.requestCart}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-surface hover:text-oxblood"
            >
              <span className="material-symbols-outlined">list_alt</span>
              {count > 0 && (
                <sup className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oxblood px-1 text-[10px] font-bold leading-none text-straw">
                  {count}
                </sup>
              )}
            </Link>
          ) : (
            <Link
              to="/search"
              aria-label={t.nav.archive}
              title={t.nav.archive}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-surface hover:text-oxblood"
            >
              <span className="material-symbols-outlined">search</span>
            </Link>
          )}
          {/* Desktop only — on mobile the theme toggle lives inside the menu. */}
          <span className="hidden lg:block">
            {/* TEMPORARY: dark-mode toggle hidden — <ThemeToggle /> */}
          </span>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-surface hover:text-oxblood lg:hidden"
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile dropdown — drops from the bottom edge of the glass pill; the
            page stays visible below it (no full-page takeover). */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={reduce ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full mt-3 origin-top overflow-hidden rounded-2xl border border-warm bg-surface/95 p-2 shadow-xl backdrop-blur-md dark:bg-surface lg:hidden"
            >
              <ul className="flex flex-col">
                {menuItems.map((item) => (
                  <li key={item.link}>
                    <Link
                      to={item.link}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-xl px-4 py-3 font-headline-md text-[17px] transition-colors ${
                        isActive(item.link)
                          ? 'bg-cream-surface text-oxblood'
                          : 'text-ink hover:bg-cream-surface hover:text-oxblood'
                      }`}
                    >
                      {item.text}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-warm pt-1">
                  {/* TEMPORARY: dark-mode toggle hidden — <ThemeToggle withLabel /> */}
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Tap-outside catcher — closes the dropdown without dimming the page. */}
      {menuOpen && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 cursor-default lg:hidden"
        />
      )}

      <main
        className={
          isHome
            ? 'w-full flex-1 pt-[5rem]'
            : 'mx-auto w-full max-w-container-max flex-1 px-margin-mobile pb-10 pt-[calc(5rem+2.5rem)]'
        }
      >
        <Outlet />
      </main>

      <Footer />

      {/* First-visit language chooser */}
      <LanguageModal />

      {/* Floating site guide */}
      <ChatWidget />
    </div>
  )
}
