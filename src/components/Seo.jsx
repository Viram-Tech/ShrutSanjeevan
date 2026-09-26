import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL } from '../config.js'

// -----------------------------------------------------------------------------
// Per-page <head> tags: title, description, canonical URL and social preview.
//
// Without this every route shared the single <title> in index.html, so search
// results and WhatsApp/X link previews looked identical for all seven pages.
//
// The tags are written straight into document.head rather than rendered as JSX.
// React 19 can hoist <title>/<meta> on its own, but it APPENDS them — the
// <title> already in index.html would stay first and keep winning. Updating the
// existing tags in place avoids that, and keeps index.html's values as the
// fallback a crawler sees before any JavaScript runs.
// -----------------------------------------------------------------------------

const DEFAULT_IMAGE = '/images/manuscript-cover.jpg'

// Finds the tag by its identifying attribute, creating it the first time.
function setTag(tagName, keyAttr, keyValue, valueAttr, value) {
  const selector = `${tagName}[${keyAttr}="${keyValue}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(tagName)
    el.setAttribute(keyAttr, keyValue)
    document.head.appendChild(el)
  }
  el.setAttribute(valueAttr, value)
}

const setMeta = (name, content) => setTag('meta', 'name', name, 'content', content)
const setProp = (property, content) => setTag('meta', 'property', property, 'content', content)

export default function Seo({ title, description, image = DEFAULT_IMAGE, type = 'website', noindex = false }) {
  const { pathname } = useLocation()

  useEffect(() => {
    // One canonical form per page: sub-pages never keep a trailing slash, and
    // the homepage always keeps its single "/" — matching what sitemap.xml
    // lists. Without the "/" the canonical tag and og:url disagree, because the
    // browser normalises a <link href> but leaves a <meta content> untouched.
    const url = pathname === '/' ? `${SITE_URL}/` : SITE_URL + pathname.replace(/\/$/, '')
    const imageUrl = image.startsWith('http') ? image : SITE_URL + image

    document.title = title

    setMeta('description', description)
    setTag('link', 'rel', 'canonical', 'href', url)

    setProp('og:site_name', 'Shrutsanjivan')
    setProp('og:type', type)
    setProp('og:url', url)
    setProp('og:title', title)
    setProp('og:description', description)
    setProp('og:image', imageUrl)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('twitter:image', imageUrl)

    // Only pages that must stay out of search results carry a robots tag; the
    // rest are left alone, which search engines read as "index, follow".
    const robots = document.head.querySelector('meta[name="robots"]')
    if (noindex) setMeta('robots', 'noindex, follow')
    else if (robots) robots.remove()
  }, [title, description, image, type, noindex, pathname])

  return null
}
