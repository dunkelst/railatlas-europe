export const PAGES_ORIGIN = 'https://dunkelst.github.io';

function allowed(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin || origin === PAGES_ORIGIN;
}

export function apiJson(request, body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Vary', 'Origin');
  const origin = request.headers.get('Origin');
  if (origin && allowed(request)) headers.set('Access-Control-Allow-Origin', origin);
  return Response.json(body, {...init, headers});
}

export function rejectOrigin(request) {
  if (!allowed(request)) return apiJson(request, {error: 'Dieser Browser-Ursprung ist nicht freigegeben.'}, {status: 403});
}

export function apiOptions(request, method) {
  const rejected = rejectOrigin(request);
  if (rejected) return rejected;
  const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (request.headers.get('Access-Control-Request-Method') !== method || requestedHeaders.some(h => h !== 'content-type')) {
    return apiJson(request, {error: 'Ungültige Browser-Anfrage.'}, {status: 400});
  }
  const headers = new Headers({
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': method,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store',
  });
  const origin = request.headers.get('Origin');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(null, {status: 204, headers});
}
