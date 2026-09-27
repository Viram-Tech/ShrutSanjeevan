import { Link } from 'react-router-dom'

const socials = [
  {
    label: 'Instagram',
    href: '#',
    path: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4.5-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  },
  {
    label: 'X',
    href: '#',
    path: 'M17.5 4h2.9l-6.34 7.25L21.5 20h-5.6l-4.38-5.73L6.5 20H3.6l6.78-7.75L3 4h5.74l3.96 5.24L17.5 4zm-1.02 14.2h1.6L7.6 5.7H5.9l10.58 12.5z',
  },
  {
    label: 'Facebook',
    href: '#',
    path: 'M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3H12V6.5a.5.5 0 0 1 .5-.5H15V3z',
  },
  {
    label: 'YouTube',
    href: '#',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z',
  },
]

const navLinks = [
  { label: 'About', to: '/about' },
  { label: 'Archive', to: '/search' },
  { label: 'Library', to: '/library' },
  { label: 'Contact', to: '/contact' },
]

function InfoBlock({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-lg font-normal text-sepia">{label}</p>
      <div className="text-base leading-relaxed text-text-muted">{children}</div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t-2 border-brass/50 bg-[#EAE2D2] dark:bg-[#262016]">
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-stack-lg">
        {/* Top */}
        <div className="flex flex-col gap-stack-lg lg:flex-row lg:items-start lg:justify-between">
          {/* Left — brand + CTA */}
          <div>
            <div className="mb-8 flex items-center gap-3">
              <img src="/logo.png" alt="Shrutsanjivan" className="h-11 w-auto" />
              <span className="font-headline-md text-[24px] text-sepia">Shrutsanjivan</span>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center font-label-md text-base text-oxblood transition-colors hover:opacity-80"
            >
              Contact us
            </Link>
          </div>

          {/* Right — contact grid */}
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:min-w-[460px]">
            <InfoBlock label="Call us">
              079-35602863
              <br />
              Help desk · 7383 94 9333 / 7383 94 9555
            </InfoBlock>
            <InfoBlock label="Email">
              <a
                href="mailto:ratnatrayeetrust@gmail.com"
                className="transition-colors hover:text-oxblood"
              >
                ratnatrayeetrust@gmail.com
              </a>
            </InfoBlock>
            <InfoBlock label="Ahmedabad">
              14, Ellora Park Society, Near Naranpura Four Cross Road, Opp Jain Temple, Naranpura,
              Ahmedabad – 380013, Gujarat, India
            </InfoBlock>
            <InfoBlock label="Mumbai">
              258, Gandhi Lane, Swadeshi Market, Kalbadevi Road, Mumbai 400002, Maharashtra, India
            </InfoBlock>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-stack-lg flex flex-col items-center gap-4 border-t border-warm pt-6 md:flex-row md:justify-between">
          <span className="text-[15px] text-text-muted">
            © 2026 Shrutsanjivan. All rights reserved.
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-[15px] text-sepia transition-colors hover:text-oxblood"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            {socials.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-text-muted transition-colors hover:text-oxblood"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path fill="currentColor" d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
