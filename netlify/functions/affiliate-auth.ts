import type { Handler } from '@netlify/functions'
import { getClientIp, hashValue, sb } from './_lib/affiliate'
import {
  buildSessionCookie,
  clearSessionCookie,
  createSession,
  getSession,
  revokeSession,
} from './_lib/affiliate-session'

const json = (statusCode: number, body: unknown, cookie?: string) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  ...(cookie ? { multiValueHeaders: { 'Set-Cookie': [cookie] } } : {}),
  body: JSON.stringify(body),
})

export const handler: Handler = async (event) => {
  try {
    // Who am I? Used by the portal on load to decide login screen vs dashboard.
    if (event.httpMethod === 'GET') {
      const session = await getSession(event)
      if (!session) return json(401, { authenticated: false })
      return json(200, { authenticated: true, affiliate: { code: session.code, name: session.name } })
    }

    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const body = JSON.parse(event.body || '{}')

    if (body.action === 'logout') {
      // If the token could not be revoked it stays valid until expiry, so don't report a
      // clean logout — the client needs to know the session may still be live.
      const revoked = await revokeSession(event)
      if (!revoked) {
        return json(500, { error: 'Could not sign you out. Please try again.' }, clearSessionCookie())
      }
      return json(200, { ok: true }, clearSessionCookie())
    }

    const email = String(body.email || '').trim()
    const password = String(body.password || '')
    if (!email || !password) return json(400, { error: 'Email and password are required.' })

    const res = await sb('rpc/affiliate_verify_login', {
      method: 'POST',
      body: JSON.stringify({ p_email: email, p_password: password }),
    })
    if (!res.ok) {
      console.error('affiliate_verify_login failed:', await res.text())
      return json(500, { error: 'Sign in is unavailable right now.' })
    }

    const result = (await res.json())?.[0]

    if (result?.outcome === 'locked') {
      return json(429, { error: 'Too many failed attempts. Try again in 15 minutes.' })
    }
    if (result?.outcome === 'disabled') {
      return json(403, { error: 'This account is no longer active.' })
    }
    if (result?.outcome !== 'ok') {
      // Deliberately identical for a wrong password and an unknown email.
      return json(401, { error: 'Incorrect email or password.' })
    }

    const token = await createSession({
      affiliateUserId: result.affiliate_user_id,
      ipHash: hashValue(getClientIp(event)),
      userAgent: event.headers?.['user-agent'] || null,
    })
    if (!token) return json(500, { error: 'Could not start a session.' })

    return json(
      200,
      { ok: true, affiliate: { code: result.affiliate_code, name: result.affiliate_name } },
      buildSessionCookie(token)
    )
  } catch (error: any) {
    console.error('affiliate-auth error:', error?.message || error)
    return json(500, { error: 'Something went wrong.' })
  }
}
