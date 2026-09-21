import crypto from 'crypto'
import { parseCookies, sb } from './affiliate'

export const SESSION_COOKIE = 'blom_aff_session'
const SESSION_HOURS = 12

export interface AffiliateSession {
  affiliateUserId: string
  affiliateId: string
  code: string
  name: string
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export const buildSessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_HOURS * 3600}; Secure; HttpOnly; SameSite=Lax`

export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`

export const createSession = async (opts: {
  affiliateUserId: string
  ipHash: string | null
  userAgent: string | null
}): Promise<string | null> => {
  // Only the hash is stored, so a database leak can't be replayed as a live session.
  const token = crypto.randomBytes(32).toString('hex')
  const res = await sb('affiliate_sessions', {
    method: 'POST',
    body: JSON.stringify({
      affiliate_user_id: opts.affiliateUserId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString(),
      ip_hash: opts.ipHash,
      user_agent: (opts.userAgent || '').slice(0, 300) || null,
    }),
  })
  return res.ok ? token : null
}

export const getSession = async (event: any): Promise<AffiliateSession | null> => {
  const token = parseCookies(event.headers?.cookie || event.headers?.Cookie)[SESSION_COOKIE]
  if (!token) return null

  const res = await sb(
    `affiliate_sessions?token_hash=eq.${hashToken(token)}&revoked_at=is.null` +
      `&expires_at=gt.${new Date().toISOString()}` +
      `&select=affiliate_user_id,affiliate_users(id,affiliate_id,affiliates(id,code,name,status))&limit=1`
  )
  if (!res.ok) return null

  const row = (await res.json())?.[0]
  const affiliate = row?.affiliate_users?.affiliates
  if (!affiliate || affiliate.status !== 'active') return null

  return {
    affiliateUserId: row.affiliate_user_id,
    affiliateId: affiliate.id,
    code: affiliate.code,
    name: affiliate.name,
  }
}

/** Returns false if the session could not actually be revoked server-side. */
export const revokeSession = async (event: any): Promise<boolean> => {
  const token = parseCookies(event.headers?.cookie || event.headers?.Cookie)[SESSION_COOKIE]
  if (!token) return true
  const res = await sb(`affiliate_sessions?token_hash=eq.${hashToken(token)}`, {
    method: 'PATCH',
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  })
  return res.ok
}
