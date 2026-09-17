import type { Handler } from '@netlify/functions';

// Approve/publish a review from n8n. Requires Netlify env vars:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Secure this function by setting a secret token in N8N_REVIEW_TOKEN and passing it as header x-review-token.

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const token = event.headers['x-review-token'] || event.headers['X-Review-Token'];
    const expected = process.env.N8N_REVIEW_TOKEN;
    if (!expected || token !== expected) return { statusCode: 401, body: 'Unauthorized' };

    const body = JSON.parse(event.body || '{}');
    const {
      product_slug,
      product_id,
      reviewer_name,
      reviewer_email,
      title,
      body: review_body,
      rating,
      photos,
      is_verified_buyer,
      order_id,
      created_at
    } = body;

    if (!product_slug || !reviewer_name || !review_body) {
      return { statusCode: 400, body: 'product_slug, reviewer_name and body are required' };
    }

    const supaUrl = process.env.SUPABASE_URL!;
    const srk = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supaUrl || !srk) return { statusCode: 500, body: 'Missing Supabase env' };

    const headers = { apikey: srk, Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' } as any;

    // Upsert based on (product_slug, reviewer_name, body hash) to avoid duplicates
    const hash = Buffer.from(`${product_slug}|${reviewer_name}|${review_body}`).toString('base64');

    const payload = {
      product_slug,
      product_id: product_id || null,
      reviewer_name,
      reviewer_email: reviewer_email || null,
      title: title || null,
      body: review_body,
      rating: typeof rating === 'number' ? Math.max(1, Math.min(5, rating)) : null,
      photos: Array.isArray(photos) ? photos : [],
      is_verified_buyer: !!is_verified_buyer,
      order_id: order_id || null,
      created_at: created_at || new Date().toISOString(),
      // client hash not stored but could be as a unique column if desired
    };

    const res = await fetch(`${supaUrl}/rest/v1/product_reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, body: `Supabase error: ${err}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};


