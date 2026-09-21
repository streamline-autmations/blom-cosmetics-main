import crypto from 'crypto'

export const REF_COOKIE = 'blom_ref'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Personal data (IP, user agent) is only ever stored hashed. The salt is secret so the
// hashes can't be reversed by rainbow table against the small SA IPv4 space.
const HASH_SALT = process.env.AFFILIATE_HASH_SALT || SERVICE_KEY || ''

export type AttributionMethod = 'link' | 'cookie' | 'account' | 'ip_match'

export interface Attribution {
  affiliateId: string
  code: string
  clickId: string | null
  method: AttributionMethod
}

export interface Affiliate {
  id: string
  code: string
  commission_rate: number
  attribution_days: number
}

export const hashValue = (value: string | null | undefined): string | null => {
  if (!value) return null
  return crypto.createHmac('sha256', HASH_SALT).update(value).digest('hex')
}

export const sb = async (path: string, init: RequestInit = {}) => {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY as string,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export const parseCookies = (header?: string | null): Record<string, string> => {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}

export const getClientIp = (event: any): string | null =>
  event.headers?.['x-nf-client-connection-ip'] ||
  String(event.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
  null

// Codes are used in URLs and SQL filters — keep them to a strict charset.
export const normalizeCode = (value: unknown): string | null => {
  const code = String(value || '').trim().toLowerCase()
  if (!code || code.length > 40) return null
  return /^[a-z0-9_-]+$/.test(code) ? code : null
}

export const buildRefCookie = (code: string, clickId: string | null, days: number): string => {
  const value = clickId ? `${code}.${clickId}` : code
  const maxAge = days * 24 * 60 * 60
  // HttpOnly: the cookie is only ever read server-side, by create-order. Set from our own
  // domain rather than JavaScript so Safari's 7-day script-cookie cap doesn't apply.
  return `${REF_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const parseRefCookie = (raw?: string): { code: string | null; clickId: string | null } => {
  if (!raw) return { code: null, clickId: null }
  const [codePart, clickPart] = raw.split('.')
  // A forged cookie must not put a non-UUID into affiliate_click_id: the PATCH would fail
  // and the whole order would go unattributed.
  const clickId = clickPart && UUID_RE.test(clickPart) ? clickPart : null
  return { code: normalizeCode(codePart), clickId }
}

export const getActiveAffiliate = async (code: string | null): Promise<Affiliate | null> => {
  if (!code) return null
  const res = await sb(
    `affiliates?code=eq.${encodeURIComponent(code)}&status=eq.active&select=id,code,commission_rate,attribution_days&limit=1`
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] || null
}

/**
 * True if this buyer is the affiliate themselves. Nothing stops a partner pasting their
 * own code and earning 5% on their own shopping, so the buyer's email is checked against
 * the affiliate's contact address and its portal login accounts.
 */
const isSelfReferral = async (affiliateId: string, buyerEmail?: string | null): Promise<boolean> => {
  const email = String(buyerEmail || '').trim().toLowerCase()
  if (!email) return false

  const [contactRes, usersRes] = await Promise.all([
    sb(`affiliates?id=eq.${affiliateId}&select=contact_email`),
    sb(`affiliate_users?affiliate_id=eq.${affiliateId}&select=email`),
  ])

  const known: string[] = []
  if (contactRes.ok) {
    for (const row of (await contactRes.json()) || []) {
      if (row?.contact_email) known.push(String(row.contact_email).toLowerCase())
    }
  }
  if (usersRes.ok) {
    for (const row of (await usersRes.json()) || []) {
      if (row?.email) known.push(String(row.email).toLowerCase())
    }
  }

  return known.includes(email)
}

/**
 * Resolve which affiliate (if any) should be credited for an order.
 *
 * Layered so attribution survives cookie loss, most-recent signal first:
 *   1. link    — ref carried in the current visit (URL → memory/sessionStorage)
 *   2. cookie  — first-party cookie from an earlier visit
 *   3. account — stamped on the customer's profile, works cross-device
 *   4. ip_match — server-side click match on hashed IP + user agent, no browser storage
 *
 * Every layer is re-validated against the affiliates table, and every result is filtered
 * through the self-referral check; nothing the client sends is trusted as-is.
 */
export const resolveAttribution = async (opts: {
  event: any
  bodyRef?: unknown
  userId?: string | null
  buyerEmail?: string | null
}): Promise<Attribution | null> => {
  const { event, bodyRef, userId, buyerEmail } = opts

  const accept = async (attribution: Attribution): Promise<Attribution | null> =>
    (await isSelfReferral(attribution.affiliateId, buyerEmail)) ? null : attribution

  // 1. Current-visit link
  const linkCode = normalizeCode(bodyRef)
  if (linkCode) {
    const affiliate = await getActiveAffiliate(linkCode)
    if (affiliate) return accept({ affiliateId: affiliate.id, code: affiliate.code, clickId: null, method: 'link' })
  }

  // 2. First-party cookie
  const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie)
  const { code: cookieCode, clickId } = parseRefCookie(cookies[REF_COOKIE])
  if (cookieCode) {
    const affiliate = await getActiveAffiliate(cookieCode)
    if (affiliate) return accept({ affiliateId: affiliate.id, code: affiliate.code, clickId, method: 'cookie' })
  }

  // 3. Account stamp
  if (userId) {
    const res = await sb(
      `profiles?id=eq.${encodeURIComponent(userId)}&select=referred_by_affiliate_id,referred_at&limit=1`
    )
    if (res.ok) {
      const profile = (await res.json())?.[0]
      if (profile?.referred_by_affiliate_id && profile?.referred_at) {
        const affRes = await sb(
          `affiliates?id=eq.${profile.referred_by_affiliate_id}&status=eq.active&select=id,code,attribution_days&limit=1`
        )
        const affiliate = affRes.ok ? (await affRes.json())?.[0] : null
        if (affiliate && withinWindow(profile.referred_at, affiliate.attribution_days)) {
          return accept({ affiliateId: affiliate.id, code: affiliate.code, clickId: null, method: 'account' })
        }
      }
    }
  }

  // 4. Cookieless fallback: a recent click from the same hashed device fingerprint.
  const ipHash = hashValue(getClientIp(event))
  const uaHash = hashValue(event.headers?.['user-agent'])
  if (ipHash && uaHash) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const res = await sb(
      `affiliate_clicks?ip_hash=eq.${ipHash}&ua_hash=eq.${uaHash}&occurred_at=gte.${since}` +
        `&select=id,affiliate_id,occurred_at,affiliates(id,code,status,attribution_days)` +
        `&order=occurred_at.desc&limit=1`
    )
    if (res.ok) {
      const click = (await res.json())?.[0]
      const affiliate = click?.affiliates
      if (
        affiliate?.status === 'active' &&
        withinWindow(click.occurred_at, affiliate.attribution_days)
      ) {
        return accept({ affiliateId: affiliate.id, code: affiliate.code, clickId: click.id, method: 'ip_match' })
      }
    }
  }

  return null
}

const withinWindow = (isoDate: string, days: number): boolean => {
  const age = Date.now() - new Date(isoDate).getTime()
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000
}
