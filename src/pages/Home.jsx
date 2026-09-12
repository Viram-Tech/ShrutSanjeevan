import { Link } from 'react-router-dom'
import CountUp from '../components/CountUp.jsx'
import { blobB, blobC } from '../data/blobs.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import Seo from '../components/Seo.jsx'
import { seo } from '../data/seo.js'

const gurudevBlobs = [blobB, blobC]

const heroStats = [
  { to: 80000, from: 79000 },
  { to: 25 },
  { to: 4 },
  { to: 8 },
]

// Portraits are static; the text (name, title, bio, facts) is translated.
const gurudevImages = ['/images/gurudev-rajendrasuri.jpg', '/images/gurudev-ratnasundarsuri.jpg']

// Partner list + logos mirrored from vk.jyot.in.
const partners = [
  { name: 'Jyot', role: 'Host', logo: '/images/partners/jyot.jpg' },
  { name: 'Vivekananda International Foundation', role: 'Knowledge Partner', logo: '/images/partners/vif.jpg' },
  { name: 'India Foundation', role: 'Knowledge Partner', logo: '/images/partners/india-foundation.jpg' },
  { name: 'Gitarth Ganga', role: 'Research Partner', logo: '/images/partners/gitarth-ganga.jpg' },
  { name: 'MNLU', role: 'Education Partner', logo: '/images/partners/mnlu.jpg' },
  { name: 'Jain University', role: 'Education Partner', logo: '/images/partners/jain-university.png' },
  { name: 'Nirma University', role: 'Education Partner', logo: '/images/partners/nirma-university.png' },
  { name: 'Surana & Surana College of Law', role: 'Education Partner', logo: '/images/partners/surana.png' },
  { name: 'JJ College of Law', role: 'Education Partner', logo: '/images/partners/jj.png' },
  { name: 'NIMCJ', role: 'Media Education Partner', logo: '/images/partners/nimcj.jpg' },
  { name: 'Geostrata', role: 'Support Partner', logo: '/images/partners/geostrata.jpg' },
  { name: 'BMK Foundation', role: 'Supporters', logo: '/images/partners/bmk-foundation.jpg' },
  { name: 'BCAS', role: 'Support Partner', logo: '/images/partners/bcas.png' },
  { name: 'Pravarsh', role: 'Support Partner', logo: '/images/partners/pravarsh.png' },
]

function RevealList({ items }) {
  return (
    <div className="space-y-2 mt-auto">
      {items.map((it, i) => (
        <div key={it.title} className="group cursor-pointer">
          <div className="relative overflow-hidden border-t border-warm pt-6 pb-4">
            <div
              className={`absolute left-0 top-0 h-[2px] bg-oxblood transition-all duration-500 group-hover:w-full ${
                i === 0 ? 'w-1/3' : 'w-0'
              }`}
            />
            <h3
              className={`mb-2 text-lg font-normal transition-colors ${
                i === 0 ? 'text-ink' : 'text-ink/55 group-hover:text-ink'
              }`}
            >
              {it.title}
            </h3>
            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out group-hover:grid-rows-[1fr]">
              <p className="overflow-hidden pr-4 text-sm leading-relaxed text-text-muted">{it.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeatureSection({ icon, eyebrow, title, intro, items, image, reverse, card, cardAlign = 'center' }) {
  // Bleed the whole panel out to its side's viewport edge (removes the dark
  // gutter left by the centered container); the card stays centered within it.
  const bleed =
    cardAlign === 'left'
      ? 'lg:ml-[calc(50%-50vw+3.5rem)]'
      : cardAlign === 'right'
        ? 'lg:mr-[calc(50%-50vw+3.5rem)]'
        : ''
  return (
    <section className="w-full border-y border-warm bg-[#faf7f1] dark:bg-straw">
      <div
        className={`mx-auto flex w-full max-w-container-max flex-col lg:min-h-[560px] lg:flex-row lg:gap-10 ${
          reverse ? 'lg:flex-row-reverse' : ''
        }`}
      >
        {/* Text side */}
        <div className="flex w-full flex-col justify-between px-margin-mobile py-10 lg:w-2/5">
          <div>
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <div className="mb-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-oxblood">{icon}</span>
              <h2 className="font-headline-lg text-headline-lg text-sepia">{title}</h2>
            </div>
            <p className="mb-8 max-w-md text-sm leading-relaxed text-text-muted">{intro}</p>
          </div>
          <RevealList items={items} />
        </div>

        {/* Visual side — square panel; the texture fills right into the corners */}
        <div className={`group relative flex w-full items-center justify-center overflow-hidden p-5 lg:flex-1 ${bleed}`}>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.45] transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/45 to-white/15" />
          {card}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const h = t.home
  return (
    <>
      <Seo {...seo.home} />
      {/* Hero — white background + brand logo on the left, hero lead text to its right. */}
      {/* First fold — hero grows to fill; the logo loop sits flush at the
          bottom of the viewport (no scroll needed to see it end). */}
      <div className="flex min-h-[calc(100vh-4.5rem)] flex-col">
      <section className="flex w-full flex-1 flex-col">
        <div className="relative flex min-h-[52vh] w-full flex-1 items-center overflow-hidden bg-[#faf7f1] md:min-h-[64vh] dark:bg-straw">
          {/* Brand logo — a large centered watermark on mobile; on desktop it
              returns to the left as the full-opacity hero mark. */}
          <img
            src="/logo.png"
            alt="Shrutsanjeevan"
            className="pointer-events-none absolute bottom-1/2 left-1/2 z-[5] w-[82%] max-w-[340px] -translate-x-1/2 translate-y-1/2 object-contain opacity-[0.24] md:left-[4%] md:w-[30%] md:max-w-[360px] md:translate-x-0 md:opacity-100"
          />

          <div
            className="relative z-10 flex max-w-3xl flex-col px-margin-mobile py-stack-lg text-center [text-shadow:0_1px_8px_rgba(250,247,241,0.9)] md:ml-[44%] md:items-start md:pr-8 md:text-left md:[text-shadow:none] dark:[text-shadow:none]"
          >
            {/* The visible title of this page is the logo image, which leaves the
                page with no <h1> for search engines and screen readers. This
                supplies one without changing the design. */}
            <h1 className="sr-only">Shrutsanjeevan — {h.heroKicker}</h1>
            <p className="eyebrow mb-4 self-center md:self-start">{h.heroKicker}</p>
            <p className="font-headline-md text-[26px] leading-snug tracking-tight text-ink sm:text-[30px] md:text-[34px] md:tracking-normal">
              {h.heroLead}
            </p>
          </div>
        </div>
      </section>


      {/* Partner marquee — the "logo loop" keeps its light band in both themes
          (partner logos are supplied on white). */}
      <section className="keep-light w-full overflow-hidden border-t border-[#e7dcc7] bg-[#faf7f1] py-6">
        <div className="marquee-track">
          {[0, 1].map((g) => (
            <div key={g} className="flex items-end gap-16 pr-16">
              {partners.map((p) => (
                <div key={p.name} className="flex w-36 shrink-0 flex-col items-center gap-2.5 text-center">
                  <div className="flex h-11 items-center justify-center">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.name}
                        className="max-h-11 w-auto max-w-[7rem] object-contain"
                      />
                    ) : (
                      <span className="font-headline-md text-[15px] leading-snug text-[#5c4326] line-clamp-3">
                        {p.name}
                      </span>
                    )}
                  </div>
                  {/* Smaller and tighter than the label-md token these used to
                      use: at 13px with 0.14em tracking a two-word role filled
                      the 9rem column and "Media Education Partner" broke across
                      two lines, crowding the logo above it. */}
                  <span className="font-label-md text-[10px] leading-[14px] tracking-[0.08em] text-text-muted">
                    {h.partnerRoles[p.role] || p.role}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Feature 1 — Search & request */}
      <FeatureSection
        icon="travel_explore"
        eyebrow={h.search.eyebrow}
        title={h.search.title}
        intro={h.search.intro}
        items={h.search.steps}
        image="/images/manuscript-texture.png"
        cardAlign="right"
        card={
          <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-warm bg-surface/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-warm p-4">
              <span className="font-label-md text-label-md text-sepia">{h.search.requestList}</span>
              <span className="material-symbols-outlined text-oxblood">menu_book</span>
            </div>
            <div className="divide-y divide-warm">
              {['Tattvartha Sutra', 'Kalpa Sutra', 'Yogashastra'].map((t) => (
                <div key={t} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-normal text-ink">{t}</p>
                    <p className="text-xs text-text-muted">Koba Gyanmandir</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Toggle ${t}`}
                    className="text-olive transition-colors hover:text-oxblood"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4">
              <Link
                to="/requests"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-oxblood py-2.5 font-label-md text-label-md text-straw transition-colors hover:bg-maroon-dark"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                {h.search.requestWhatsApp}
              </Link>
            </div>
          </div>
        }
      />

      {/* Collection stats — between the two feature sections */}
      <section className="mx-auto w-full max-w-container-max px-margin-mobile py-24 lg:py-32">
        <p className="eyebrow mb-3">{h.byNumbers}</p>
        <h2 className="mb-stack-md font-headline-lg text-headline-lg text-sepia">{h.digitalCollection}</h2>
        <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
          {heroStats.map((s, i) => (
            <div key={i} className="border-t border-oxblood/70 pt-5">
              <CountUp
                to={s.to}
                from={s.from ?? 0}
                separator=","
                duration={1.4}
                ease="linear"
                className="block font-headline-xl text-[40px] leading-none text-ink"
              />
              <p className="mt-2 font-label-md text-label-md text-text-muted">{h.stats[i]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature 2 — Read & download (swapped) */}
      <FeatureSection
        reverse
        icon="auto_stories"
        eyebrow={h.read.eyebrow}
        title={h.read.title}
        intro={h.read.intro}
        items={h.read.steps}
        image="/images/manuscript-texture-2.jpg"
        cardAlign="left"
        card={
          <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-warm bg-surface/95 shadow-2xl backdrop-blur-xl">
            <div
              className="relative flex h-56 flex-col items-center justify-center border-b border-warm px-6 pb-7 text-center"
              style={{ background: 'linear-gradient(150deg,#22323b,#2f4a54 55%,#1c2b31)' }}
            >
              <div className="pointer-events-none absolute inset-3 rounded-sm border" style={{ borderColor: '#cfa15a55' }} />
              <span className="mb-2 text-lg leading-none" style={{ color: '#cfa15a' }}>॥</span>
              <p className="font-headline-md text-[20px] leading-tight" style={{ color: '#eef3f1' }}>Tattvartha Sutra</p>
              <span className="my-2.5 block h-px w-8" style={{ background: '#cfa15a' }} />
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: '#eef3f1', opacity: 0.75 }}>Umaswati</p>
              <span
                className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.18em]"
                style={{ color: '#eef3f1', opacity: 0.6 }}
              >
                Sanskrit · 412 pp
              </span>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                <Link
                  to="/library"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-oxblood py-2 font-label-md text-label-md text-straw transition-colors hover:bg-maroon-dark"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_stories</span>
                  {h.read.readBtn}
                </Link>
                <Link
                  to="/library"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-oxblood py-2 font-label-md text-label-md text-oxblood transition-colors hover:bg-cream-surface"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  {h.read.pdfBtn}
                </Link>
              </div>
            </div>
          </div>
        }
      />

      {/* Blessings of the Gurudevs — just before the footer */}
      <section className="mx-auto w-full max-w-container-max px-margin-mobile pb-32 pt-24 lg:pb-40 lg:pt-32">
        <div className="mb-stack-md text-center">
          <p className="eyebrow mb-3">{h.reverence}</p>
          <h2 className="font-headline-lg text-headline-lg text-sepia">{h.gurudevsTitle}</h2>
        </div>
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            {gurudevBlobs.map((d, i) => (
              <clipPath key={i} id={`gurudev-blob-${i}`} clipPathUnits="objectBoundingBox">
                {/* grow only the 2nd blob 9% so more of the portrait (hair) shows */}
                <path d={d} transform={i === 1 ? 'translate(0.5 0.5) scale(1.09) translate(-0.5 -0.5)' : undefined} />
              </clipPath>
            ))}
          </defs>
        </svg>
        <div className="mx-auto flex max-w-5xl flex-col gap-stack-lg">
          {h.gurudevs.map((g, i) => (
            <div
              key={g.name}
              className={`flex flex-col gap-6 lg:min-h-[420px] lg:items-center ${
                i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
              }`}
            >
              {/* Portrait — organic blob frame */}
              <div className="relative mx-auto w-full max-w-[460px] self-center lg:mx-0 lg:w-[42%] lg:max-w-[470px] lg:shrink-0">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[-10%]"
                  style={{
                    background:
                      'radial-gradient(58% 58% at 50% 42%, rgba(217,164,65,0.26) 0%, rgba(217,164,65,0.08) 46%, rgba(217,164,65,0) 70%)',
                  }}
                />
                <img
                  src={gurudevImages[i]}
                  alt={g.name}
                  className="relative aspect-[4/4.4] w-full object-cover object-top"
                  style={{ clipPath: `url(#gurudev-blob-${i})` }}
                />
              </div>
              {/* Text — no container */}
              <div
                className={`flex min-w-0 flex-1 flex-col justify-center gap-4 ${
                  i % 2 === 1 ? 'lg:pr-4' : 'lg:pl-4'
                }`}
              >
                <div>
                  <p className="eyebrow mb-2 break-words text-brass">{g.title}</p>
                  <h3 className="font-headline-md text-[24px] leading-snug text-sepia break-words">{g.name}</h3>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-text-muted">{g.bio}</p>
                {g.facts.length > 0 && (
                  <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-warm pt-4">
                    {g.facts.map((f) => (
                      <div key={f.label}>
                        <p className="font-headline-md text-[19px] leading-none text-oxblood">{f.value}</p>
                        <p className="mt-1 font-label-md text-label-md text-text-muted">{f.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
