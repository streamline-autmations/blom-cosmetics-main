/**
 * Affiliate referral capture.
 *
 * Attribution never depends on a single mechanism. In order of durability:
 *   1. module memory   — survives the whole visit even with all storage blocked (SPA:
 *                        navigation never reloads the page)
 *   2. sessionStorage  — survives a refresh or a restored tab
 *   3. first-party cookie — set server-side by affiliate-click, survives across visits
 *   4. account stamp / server-side click match — handled entirely on the server
 *
 * Layers 1 and 2 are why a shopper who blocks cookies still gets attributed.
 */

const STORAGE_KEY = 'blom_ref'
const REF_PARAMS = ['ref', 'aff']

let memoryRef: string | null = null
let reportedRef: string | null = null

const normalize = (value: string | null | undefined): string | null => {
  const code = String(value || '').trim().toLowerCase()
  if (!code || code.length > 40) return null
  return /^[a-z0-9_-]+$/.test(code) ? code : null
}

const readSession = (): string | null => {
  try {
    return normalize(window.sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

const writeSession = (code: string) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Private mode or storage disabled — memory still carries the visit.
  }
}

/** The referral code for this visit, if any. */
export const getAffiliateRef = (): string | null => memoryRef || readSession()

/**
 * Read ?ref= from the URL, persist it, register the click, and clean the URL.
 * Safe to call on every route change — the click is only reported once per code.
 */
export const captureAffiliateRef = (): void => {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const raw = REF_PARAMS.map((key) => params.get(key)).find(Boolean)
  const code = normalize(raw)

  if (code) {
    // Last click wins: a newer ref replaces whatever was held before.
    memoryRef = code
    writeSession(code)

    // Strip the tracking params so shoppers don't share or bookmark a referral URL.
    REF_PARAMS.forEach((key) => params.delete(key))
    const query = params.toString()
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (query ? `?${query}` : '') + window.location.hash
    )
  } else if (!memoryRef) {
    memoryRef = readSession()
  }

  // Only a genuine ?ref= in the URL counts as a click. Without this, every page reload or
  // restored tab would log a new click and renew the attribution window indefinitely.
  if (!memoryRef || reportedRef === memoryRef || !code) return

  reportedRef = memoryRef
  const payload = {
    ref: memoryRef,
    path: window.location.pathname,
    referrer: document.referrer || null,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  }

  // Fire and forget — tracking must never delay or break the page.
  fetch('/.netlify/functions/affiliate-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
