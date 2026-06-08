// Cloudflare Pages Function: API for Data Collection
// KV Namespace binding: RSB_DATA (configured in Cloudflare Pages dashboard)
// Auth: Protected by Cloudflare Access (JWT in CF_Authorization cookie)

const ALLOWED_ORIGIN = 'https://swot-blu-uin-ponorogo.pages.dev';
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
};

// Verify Cloudflare Access JWT — returns email or null
function getAuthEmail(request) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/CF_Authorization=([^;]+)/);
    if (!match) return null;
    const parts = match[1].split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.email || null;
  } catch (e) { return null; }
}

const KV_PREFIX = 'unit:'; // Prefix standar — simpel, sesuai backup lama

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const unitId = url.searchParams.get('unit');

  try {
    if (unitId) {
      const data = await env.RSB_DATA.get(`${KV_PREFIX}${unitId}`, 'json');
      return new Response(JSON.stringify({ ok: true, data: data || null }), { headers: CORS });
    } else {
      const list = await env.RSB_DATA.list({ prefix: KV_PREFIX });
      const allData = {};
      for (const key of list.keys) {
        const uid = key.name.replace(KV_PREFIX, '');
        allData[uid] = await env.RSB_DATA.get(key.name, 'json');
      }
      return new Response(JSON.stringify({ ok: true, data: allData }), { headers: CORS });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const email = getAuthEmail(request) || 'anonymous';

  try {
    const body = await request.json();
    const { unitId, tables, rawData, schemaVersion } = body;

    if (!unitId || !tables) {
      return new Response(JSON.stringify({ ok: false, error: 'unitId and tables required' }), { status: 400, headers: CORS });
    }

    const record = {
      unitId,
      tables,
      rawData,
      savedBy: email,
      schemaVersion: schemaVersion || 'unknown',
      updatedAt: new Date().toISOString(),
    };

    await env.RSB_DATA.put(`${KV_PREFIX}${unitId}`, JSON.stringify(record));

    return new Response(JSON.stringify({ ok: true, saved: unitId, by: email }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: CORS });
  }
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
