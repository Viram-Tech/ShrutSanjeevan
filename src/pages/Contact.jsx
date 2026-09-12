import { useState } from 'react'
import StringDivider from '../components/StringDivider.jsx'
import Seo from '../components/Seo.jsx'
import { seo } from '../data/seo.js'
import { REQUEST_EMAIL } from '../config.js'

const offices = [
  {
    name: 'Ratnatrayee Trust (Ahmedabad)',
    phones: ['079-35602863'],
    email: 'ratnatrayeetrust@gmail.com',
  },
  {
    name: 'Help Desk',
    phones: ['7383 94 9333', '7383 94 9555'],
    email: null,
  },
]

const socials = [
  {
    label: 'Facebook',
    href: '#',
    path: 'M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3H12V6.5a.5.5 0 0 1 .5-.5H15V3z',
  },
  {
    label: 'Instagram',
    href: '#',
    path: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4.5-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  },
  {
    label: 'YouTube',
    href: '#',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z',
  },
  {
    label: 'X',
    href: '#',
    path: 'M17.5 4h2.9l-6.34 7.25L21.5 20h-5.6l-4.38-5.73L6.5 20H3.6l6.78-7.75L3 4h5.74l3.96 5.24L17.5 4zm-1.02 14.2h1.6L7.6 5.7H5.9l10.58 12.5z',
  },
]

const fieldClass =
  'w-full p-3 rounded-lg border border-warm focus:border-secondary-fixed-dim focus:ring-2 focus:ring-secondary-fixed-dim focus:ring-opacity-50 transition-shadow bg-surface font-body-md text-body-md'
const labelClass = 'block font-label-md text-label-md text-on-surface mb-base'

const inquiryTypes = ['General enquiry', 'Join as a volunteer', 'Business query']

const emptyForm = { inquiryType: inquiryTypes[0], name: '', email: '', phone: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  // The site has no mail backend, so the form composes the message and hands it
  // to whatever email app the visitor already uses. They press send there — we
  // never silently swallow a message, and they keep a copy in their own Sent
  // folder. The trade-off is that a browser with no mail handler configured may
  // do nothing at all, which is why the form is NOT cleared afterwards and the
  // composed text stays available to copy.
  const composed = () => {
    const subject = form.subject.trim()
      ? `${form.inquiryType}: ${form.subject.trim()}`
      : form.inquiryType
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
      `Reason: ${form.inquiryType}`,
      '',
      form.message.trim(),
    ]
      .filter((line) => line !== null)
      .join('\n')
    return { subject, body }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const { subject, body } = composed()
    // encodeURIComponent, not encodeURI: subjects and messages contain & and #,
    // which would otherwise cut the mailto short.
    const href = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
    setSent(true)
    window.location.href = href
  }

  const copyMessage = async () => {
    const { subject, body } = composed()
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context, or the visitor declined) — the
      // address is on screen either way, so there is nothing to recover from.
    }
  }

  const handleDonate = () => {
    // TODO: Connect Razorpay Checkout here.
    // 1. Load https://checkout.razorpay.com/v1/checkout.js
    // 2. Create an order on your backend and get order_id.
    // 3. const rzp = new window.Razorpay({
    //      key: RAZORPAY_KEY_ID,
    //      currency: 'INR',
    //      name: 'Ratnatrayee Trust',
    //      description: 'Dravya Sanjivan donation',
    //      order_id,
    //      handler: (res) => { /* verify payment on backend */ },
    //    })
    // 4. rzp.open()
    window.alert('Online donations coming soon.')
  }

  return (
    <>
      <Seo {...seo.contact} />
      {/* Page Header */}
      <div className="mb-stack-lg text-center">
        <p className="eyebrow mb-3">Write to the kendra</p>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-sepia mb-base">
          Get in touch
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted">
          Questions about the collection, access, or a manuscript? We would love to hear from you.
        </p>
        <StringDivider className="mt-stack-md max-w-xl mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
        {/* Left: Contact details */}
        <div className="flex flex-col gap-stack-md">
          <div className="bg-surface-container-lowest border border-warm rounded-xl shadow-sm p-stack-md">
            <h2 className="font-headline-md text-headline-md text-sepia mb-stack-sm">
              Ratnatrayee Trust
            </h2>

            <p className="font-label-md text-label-md text-on-surface mb-base">Correspondence &middot; Ahmedabad</p>
            <div className="flex items-start gap-3 mb-stack-sm">
              <span className="material-symbols-outlined text-secondary-fixed-dim">location_on</span>
              <p className="font-body-md text-body-md text-text-muted">
                14, Ellora Park Society, Near Naranpura Four Cross Road,<br />
                Opp Jain Temple, Naranpura, Ahmedabad - 380013,<br />
                Gujarat - India
              </p>
            </div>
            <div className="flex items-start gap-3 mb-stack-md">
              <span className="material-symbols-outlined text-secondary-fixed-dim">schedule</span>
              <p className="font-body-md text-body-md text-text-muted">10 AM to 7 PM</p>
            </div>

            <p className="font-label-md text-label-md text-on-surface mb-base">Correspondence &middot; Mumbai</p>
            <div className="flex items-start gap-3 mb-stack-sm">
              <span className="material-symbols-outlined text-secondary-fixed-dim">location_on</span>
              <p className="font-body-md text-body-md text-text-muted">
                258, Gandhi Lane, Swadeshi Market, Kalbadevi Road,<br />
                Mumbai 400002, Maharashtra, India
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary-fixed-dim">schedule</span>
              <p className="font-body-md text-body-md text-text-muted">12 PM to 5 PM</p>
            </div>
          </div>

          {/* Office listings */}
          <div className="bg-surface-container-lowest border border-warm rounded-xl shadow-sm p-stack-md">
            <h2 className="font-headline-md text-headline-md text-sepia mb-stack-sm">
              Departments
            </h2>
            <div className="flex flex-col divide-y divide-warm">
              {offices.map((o) => (
                <div key={o.name} className="py-stack-sm first:pt-0 last:pb-0">
                  <p className="font-label-md text-label-md text-on-surface mb-base">{o.name}</p>
                  {o.phones.map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 font-body-md text-body-md text-text-muted hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">call</span>
                      {p}
                    </a>
                  ))}
                  {o.email && (
                    <a
                      href={`mailto:${o.email}`}
                      className="flex items-center gap-2 font-body-md text-body-md text-text-muted hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">mail</span>
                      {o.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div className="bg-surface-container-lowest border border-warm rounded-xl shadow-sm p-stack-md">
            <h2 className="font-headline-md text-headline-md text-sepia mb-stack-sm">Follow Us</h2>
            <div className="flex gap-4">
              {socials.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-11 h-11 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-straw transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path fill="currentColor" d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Contact form */}
        <div className="bg-surface-container-lowest border border-warm rounded-xl shadow-sm p-stack-md">
          <h2 className="font-headline-md text-headline-md text-sepia mb-stack-sm">
            Send a Message
          </h2>

          {sent && (
            <div className="mb-stack-sm rounded-lg bg-secondary-fixed bg-opacity-40 text-on-secondary-fixed p-3 font-body-md text-body-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">outgoing_mail</span>
                Your email app should have opened with the message ready — press
                send there to deliver it.
              </div>
              {/* A browser with no mail handler does nothing visible, so always
                  offer the address and the text itself. */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm">
                <span>Nothing opened? Write to</span>
                <a className="underline" href={`mailto:${REQUEST_EMAIL}`}>
                  {REQUEST_EMAIL}
                </a>
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center gap-1 rounded-md border border-warm px-2 py-1 hover:bg-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copied' : 'Copy message'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-stack-sm">
            <div>
              <label className={labelClass} htmlFor="inquiryType">I&rsquo;m reaching out to</label>
              <select
                id="inquiryType"
                className={fieldClass}
                value={form.inquiryType}
                onChange={update('inquiryType')}
              >
                {inquiryTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                required
                className={fieldClass}
                placeholder="Your full name"
                value={form.name}
                onChange={update('name')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
              <div>
                <label className={labelClass} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className={fieldClass}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Contact Number</label>
                <input
                  id="phone"
                  type="tel"
                  className={fieldClass}
                  placeholder="+91 …"
                  value={form.phone}
                  onChange={update('phone')}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                className={fieldClass}
                placeholder="How can we help?"
                value={form.subject}
                onChange={update('subject')}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                rows={5}
                className={`${fieldClass} resize-y`}
                placeholder="Write your message…"
                value={form.message}
                onChange={update('message')}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-primary text-straw font-label-md text-label-md hover:bg-maroon-dark transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
                Send via email app
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Donation — Dravya Sanjivan. Full-bleed band in a warm sand tone. */}
      <section className="-mb-10 mt-stack-lg ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen bg-[#EAE2D2] py-stack-lg dark:bg-surface-container-low">
        <div className="mx-auto w-full max-w-container-max px-margin-mobile">
        <p className="eyebrow mb-3 text-brass">Dravya Sanjivan</p>
        <h2 className="mb-stack-sm font-headline-md text-headline-md text-sepia">Support the mission</h2>
        <p className="mb-stack-md max-w-3xl font-body-md text-body-md text-text-muted">
          Through Shrutsanjeevan&rsquo;s initiatives, shravaks and sanghs — through their Gyan Dravya —
          have an auspicious opportunity to serve the publication and preservation of priceless
          scriptures. Contributions may also go towards scanning, digitization and related projects.
        </p>

        <div className="grid grid-cols-1 gap-stack-md lg:grid-cols-2">
          {/* Benefaction */}
          <div className="rounded-xl border border-warm bg-surface-container-lowest p-stack-md shadow-sm">
            <p className="mb-stack-sm font-label-md text-label-md text-on-surface">Benefaction</p>
            <div className="grid grid-cols-2 gap-gutter">
              <div>
                <p className="font-headline-md text-[24px] leading-none text-oxblood">₹4,00,000</p>
                <p className="mt-1 font-label-md text-label-md text-text-muted">Granthank</p>
              </div>
              <div>
                <p className="font-headline-md text-[24px] leading-none text-oxblood">₹3,00,000</p>
                <p className="mt-1 font-label-md text-label-md text-text-muted">Granthratna</p>
              </div>
            </div>
            <div className="mt-stack-sm border-t border-warm pt-stack-sm">
              <p className="mb-base font-label-md text-label-md text-on-surface">Contact for contributions</p>
              <div className="flex flex-col gap-1">
                {[
                  ['Palakbhai', '98254 33715'],
                  ['Kaushikbhai', '98671 68606'],
                ].map(([name, num]) => (
                  <a
                    key={num}
                    href={`tel:${num.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 font-body-md text-body-md text-text-muted transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">call</span>
                    {name} · {num}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="rounded-xl border border-warm bg-surface-container-lowest p-stack-md shadow-sm">
            <p className="mb-stack-sm font-label-md text-label-md text-on-surface">Bank details</p>
            <dl className="flex flex-col divide-y divide-warm font-body-md text-body-md">
              {[
                ['Account holder', 'Ratnatrayee Trust'],
                ['Bank', 'HDFC Bank Ltd'],
                ['Branch', 'Naranpura'],
                ['Account type', 'Savings'],
                ['A/C No.', '50100436678739'],
                ['IFSC', 'HDFC0000383'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="font-normal text-on-surface">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="mt-stack-md font-body-md text-sm italic text-text-muted">
          Your sacred donation is an auspicious offering (Aahuti) in this &ldquo;Pushya&rdquo; Yagna
          begun by Shrutsanjeevan.
        </p>

        {/* Give online — Razorpay integration point (same block) */}
        <div className="mt-stack-md border-t border-warm pt-stack-md">
          <p className="eyebrow mb-3 text-brass">Give online</p>
          <h2 className="mb-stack-sm font-headline-md text-headline-md text-sepia">Make a contribution</h2>
        <p className="mb-stack-md max-w-3xl font-body-md text-body-md text-text-muted">
          Support the preservation of India&rsquo;s scriptural heritage. Contribute securely online.
        </p>

        <div className="flex flex-col items-center gap-4 py-stack-sm text-center">
          <button
            type="button"
            onClick={handleDonate}
            aria-label="Donate Now — Secured by Razorpay"
            className="inline-flex items-stretch overflow-hidden rounded-md border border-[#d7dbe3] bg-surface shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex items-center justify-center bg-[#3395ff] px-3">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l7.732-24z" />
                <path fill="#cfe4ff" d="M1.372 15.076L0 20.194l6.037-3.917 1.663-6.257z" />
              </svg>
            </span>
            <span className="flex flex-col items-start px-6 py-2.5 text-left leading-tight">
              <span className="font-body-md text-lg font-bold italic tracking-wide text-[#0d2366]">
                Donate Now
              </span>
              <span className="text-[11px] italic tracking-[0.18em] text-[#8890a3]">
                Secured by Razorpay
              </span>
            </span>
          </button>
          <p className="text-xs text-text-muted">Secure checkout coming soon.</p>
          </div>
        </div>
        </div>
      </section>
    </>
  )
}
