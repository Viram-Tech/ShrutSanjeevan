// -----------------------------------------------------------------------------
// Live "total downloads" counter, backed by Supabase.
//
// One shared row (counters/'downloads') holds a single number. Every visitor
// reads it; each download adds to it through bump_download_count(), a
// `security definer` function — so a visitor can add to the total but cannot
// set it. See the Download counter section of supabase/schema.sql.
//
// This used to be a Firestore document. Moving it here removes the project's
// last dependency on Firebase, puts the number in the same account as the
// catalogue it counts, and makes it tamper-resistant: the old Firestore rule
// let any client write any integer.
//
// If SUPABASE is not configured (src/config.js), everything here is a no-op and
// the UI simply hides the counter — same contract as before.
// -----------------------------------------------------------------------------
import { SUPABASE } from '../config.js'

const enabled = Boolean(SUPABASE.url && SUPABASE.anonKey)

// Mounted counters, so a download can refresh them without a live subscription.
const listeners = new Set()

const rpc = async (fn, body) => {
  const res = await fetch(`${SUPABASE.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error(`rpc ${fn}: HTTP ${res.status}`)
  return res.json()
}

// Report the total to `onValue`, then again after each local download so the
// figure on screen reflects the visitor's own action immediately.
//
// Unlike the Firestore version this is not a live socket: the number is read
// once on mount rather than streamed. The component animates it from zero and
// nothing on the page depends on seeing other visitors' downloads in real time,
// so a single request is the honest trade — no subscription held open on a
// roadside connection. Returns an unsubscribe function, as before.
export function subscribeDownloadCount(onValue) {
  if (!enabled) return () => {}
  let cancelled = false

  const read = async () => {
    try {
      const total = await rpc('get_download_count')
      if (!cancelled) onValue(Number(total) || 0)
    } catch {
      // Transient read failure: leave whatever is on screen alone.
    }
  }

  read()
  listeners.add(read)
  return () => {
    cancelled = true
    listeners.delete(read)
  }
}

// Record one download by atomically adding to the shared total. Safe to call
// repeatedly; failures (offline, counter off) are swallowed so downloads never
// break because of analytics.
export async function incrementDownloadCount(by = 1) {
  if (!enabled) return
  try {
    await rpc('bump_download_count', { amount: by })
    // Refresh anything on screen with the new total.
    for (const read of listeners) read()
  } catch {
    // Non-fatal: the download itself has already been triggered.
  }
}

export const downloadCounterEnabled = enabled
