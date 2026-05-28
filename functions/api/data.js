// Cloudflare Pages Function: API for Data Collection
// KV Namespace binding: RSB_DATA (configured in Cloudflare Pages dashboard)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const unitId = url.searchParams.get('unit');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    if (unitId) {
      // Get single unit data
      const data = await env.RSB_DATA.get(`unit:${unitId}`, 'json');
      return new Response(JSON.stringify({ ok: true, data: data || null }), { headers });
    } else {
      // Get ALL units data (admin)
      const list = await env.RSB_DATA.list({ prefix: 'unit:' });
      const allData = {};
      for (const key of list.keys) {
        const uid = key.name.replace('unit:', '');
        allData[uid] = await env.RSB_DATA.get(key.name, 'json');
      }
      return new Response(JSON.stringify({ ok: true, data: allData }), { headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const { unitId, tables, savedBy } = body;

    if (!unitId || !tables) {
      return new Response(JSON.stringify({ ok: false, error: 'unitId and tables required' }), { status: 400, headers });
    }

    const record = {
      unitId,
      tables,
      savedBy: savedBy || 'anonymous',
      updatedAt: new Date().toISOString(),
    };

    // Save per-unit
    await env.RSB_DATA.put(`unit:${unitId}`, JSON.stringify(record));

    // Also update the merged export for RSB Generator auto-sync
    await _updateMergedExport(env);

    return new Response(JSON.stringify({ ok: true, saved: unitId }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const unitId = url.searchParams.get('unit');
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (!unitId) {
    return new Response(JSON.stringify({ ok: false, error: 'unit param required' }), { status: 400, headers });
  }

  await env.RSB_DATA.delete(`unit:${unitId}`);
  return new Response(JSON.stringify({ ok: true, deleted: unitId }), { headers });
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper: merge all unit data into single export format for Generator
async function _updateMergedExport(env) {
  const list = await env.RSB_DATA.list({ prefix: 'unit:' });
  const merged = { timestamp: new Date().toISOString(), tables: {} };

  for (const key of list.keys) {
    const record = await env.RSB_DATA.get(key.name, 'json');
    if (record && record.tables) {
      Object.entries(record.tables).forEach(([tblId, tblData]) => {
        merged.tables[tblId] = tblData;
      });
    }
  }

  await env.RSB_DATA.put('merged_export', JSON.stringify(merged));
}
