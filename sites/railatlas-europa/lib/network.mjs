// Independent OSM network overlays. These are infrastructure, not a timetable.
export const NETWORK_MODES = [
  {id: 'rail', label: 'Bahn', color: '#405d74'},
  {id: 'suburban', label: 'S-Bahn', color: '#21834a'},
  {id: 'subway', label: 'U-Bahn', color: '#2669bf'},
  {id: 'tram', label: 'Tram / Stadtbahn', color: '#be3e53'},
  {id: 'bus', label: 'Bus', color: '#b5781e'},
];
export const defaultNetworkLayers = () => Object.fromEntries(NETWORK_MODES.map(m => [m.id, {lines: m.id === 'rail', stops: m.id === 'rail'}]));
export const NETWORK_MIN_ZOOM = 12;
// Allow the provider's documented queue (up to 15 s), execution (20 s), and transfer.
export const NETWORK_TIMEOUT_MS = 40000;
// Public worldwide instance listed by OpenStreetMap; the main instance is overloaded.
export const OVERPASS_URL = 'https://overpass.private.coffee/api/interpreter';

export function validateBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite)) throw Error('Ungültiger Kartenausschnitt.');
  const [s, w, n, e] = bounds;
  if (s < -85 || n > 85 || w < -180 || e > 180 || s >= n || w >= e) throw Error('Ungültiger Kartenausschnitt.');
  const area = (n - s) * (e - w) * 111.32 ** 2 * Math.cos((s + n) / 2 * Math.PI / 180);
  if (area > 2500 || n - s > 1 || e - w > 1.5) throw Error('Für die Detailnetze bitte näher heranzoomen.');
  return bounds;
}
export function networkMode(tags = {}) {
  const route = tags.route;
  if (route === 'bus' || route === 'trolleybus') return 'bus';
  if (route === 'subway') return 'subway';
  if (route === 'train' || route === 'light_rail') {
    if (/^(commuter|suburban)$/.test(tags.service || '') || tags.passenger === 'suburban' || /^S[ -]?\d/i.test(tags.ref || '') || /s[- ]?bahn/i.test(tags.network || '')) return 'suburban';
    if (route === 'light_rail') return /^U[ -]?\d/i.test(tags.ref || '') ? 'subway' : 'tram';
    return 'rail';
  }
  return route === 'tram' ? 'tram' : null;
}
export function networkQuery(bounds, modes) {
  validateBounds(bounds);
  const selected = [...new Set(modes)];
  if (!selected.length || selected.some(m => !NETWORK_MODES.some(x => x.id === m))) throw Error('Ungültige Netzebene.');
  const box = bounds.map(n => n.toFixed(5)).join(',');
  const routes = [];
  if (selected.includes('suburban')) routes.push('rel[type=route][route~"^(train|light_rail)$"][ref~"^S[ -]?[0-9]"]', 'rel[type=route][route=train][service~"^(commuter|suburban)$"]', 'rel[type=route][route=train][passenger=suburban]', 'rel[type=route][route=train][network~"[Ss]-?[Bb]ahn"]');
  if (selected.includes('subway')) routes.push('rel[type=route][route~"^(subway|light_rail)$"]');
  if (selected.includes('tram')) routes.push('rel[type=route][route~"^(tram|light_rail)$"]');
  if (selected.includes('bus')) routes.push('rel[type=route][route~"^(bus|trolleybus)$"]');
  const stops = [];
  if (selected.includes('rail')) stops.push('nwr[railway~"^(station|halt)$"][station!~"^(subway|light_rail)$"][train!=no]');
  if (selected.includes('subway')) stops.push('nwr[railway~"^(station|halt)$"][station=subway]', 'nwr[public_transport~"^(station|stop_position|platform)$"][subway=yes]');
  if (selected.includes('tram')) stops.push('nwr[railway=tram_stop]', 'nwr[public_transport~"^(station|stop_position|platform)$"][tram=yes]');
  if (selected.includes('bus')) stops.push('nwr[highway=bus_stop]', 'nwr[public_transport~"^(station|stop_position|platform)$"][bus=yes]');
  return `[out:json][timeout:20][maxsize:16777216];\n(${routes.length ? routes.map(r => r + '(' + box + ');').join('\n') : 'rel(0);'}) -> .routes;\n.routes out geom(${box});\n(${stops.map(r => r + '(' + box + ');').join('\n')}node(r.routes)(${box});way(r.routes:"platform")(${box}););\nout center;`;
}
export function geometrySegments(points = []) {
  const segments = []; let segment = [];
  for (const p of points) {
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180) segment.push([p.lat, p.lon]);
    else {if (segment.length > 1) segments.push(segment); segment = [];}
  }
  if (segment.length > 1) segments.push(segment);
  return segments;
}
function stopModes(tags) {
  const modes = [];
  if (tags.subway === 'yes' || tags.station === 'subway') modes.push('subway');
  if (tags.tram === 'yes' || tags.railway === 'tram_stop') modes.push('tram');
  if (tags.bus === 'yes' || tags.highway === 'bus_stop') modes.push('bus');
  if (['station', 'halt'].includes(tags.railway) && !['subway', 'light_rail'].includes(tags.station) && tags.train !== 'no') modes.push('rail');
  return modes;
}
export function parseNetwork(data, bounds, modes) {
  validateBounds(bounds);
  if (typeof data?.remark === 'string' && data.remark.trim()) throw Error('Die Kartendatenquelle hat die Anfrage nicht vollständig ausgeführt. Bitte erneut laden oder näher heranzoomen.');
  if (!Array.isArray(data?.elements)) throw Error('Die Kartendatenquelle hat keine lesbaren Daten geliefert.');
  const layers = Object.fromEntries(NETWORK_MODES.map(m => [m.id, {lines: [], stops: []}]));
  const elements = new Map(data.elements.map(e => [e.type + '/' + e.id, e]));
  const membership = new Map(), stopInfo = new Map();
  for (const relation of elements.values()) {
    if (relation.type !== 'relation' || !Array.isArray(relation.members)) continue;
    const mode = networkMode(relation.tags);
    if (!mode || !modes.includes(mode)) continue;
    const tags = relation.tags || {}, segments = [];
    for (const member of relation.members) {
      const key = member.type + '/' + member.ref;
      if (/^(stop|platform)(_|$)/.test(member.role || '')) {
        if (!membership.has(key)) membership.set(key, new Set());
        membership.get(key).add(mode);
        if (!stopInfo.has(key)) stopInfo.set(key, {lines: new Set(), member});
        if (tags.ref) stopInfo.get(key).lines.add(tags.ref);
      } else if (member.type === 'way') segments.push(...geometrySegments(member.geometry));
    }
    if (segments.length) layers[mode].lines.push({id: 'relation/' + relation.id, name: tags.name || tags.ref || 'Linie ohne Namen', ref: tags.ref || '', segments});
  }
  const inside = (lat, lon) => lat >= bounds[0] && lon >= bounds[1] && lat <= bounds[2] && lon <= bounds[3];
  const keys = new Set([...elements.keys(), ...membership.keys()]);
  for (const key of keys) {
    const info = stopInfo.get(key), e = elements.get(key) || info?.member;
    if (!e) continue;
    const tags = e.tags || {};
    if (tags.disused === 'yes' || tags.abandoned === 'yes' || tags.construction === 'yes') continue;
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inside(lat, lon)) continue;
    const assigned = new Set([...stopModes(tags), ...(membership.get(key) || [])]);
    for (const mode of assigned) if (modes.includes(mode)) layers[mode].stops.push({id: key, name: tags.name || tags['name:de'] || 'Halt ohne OSM-Namen', lat, lon, lines: [...(info?.lines || [])]});
  }
  return {layers, bounds, fetchedAt: new Date().toISOString(), source: 'OpenStreetMap / Overpass', coverage: 'partial'};
}
const cache = new Map();
let nextRequestAt = 0;
export async function fetchNetwork(bounds, modes, signal) {
  if(signal?.aborted)throw new DOMException('Abgebrochen', 'AbortError');
  const query = networkQuery(bounds, modes), key = query, found = cache.get(key);
  if (found && Date.now() - found.at < 300000) return found.data;
  if (Date.now() < nextRequestAt) throw Error('Die Kartendatenquelle ist ausgelastet. Bitte in etwa einer Minute erneut laden.');
  let timedOut = false;
  const controller = new AbortController(), abort = () => controller.abort(), timer = setTimeout(() => {timedOut = true; controller.abort();}, NETWORK_TIMEOUT_MS);
  signal?.addEventListener('abort', abort, {once: true});
  try {
    if (signal?.aborted) controller.abort();
    const response = await fetch(OVERPASS_URL, {method: 'POST', headers: {Accept: 'application/json', ...(typeof window === 'undefined' ? {'User-Agent': 'RailAtlas-Europa/1.0 (+https://github.com/dunkelst/railatlas-europe)'} : {})}, body: new URLSearchParams({data: query}), signal: controller.signal});
    if (!response.ok) {
      if (response.status === 429 || response.status === 406 || response.status >= 500) {const seconds=Number(response.headers.get('Retry-After'));nextRequestAt=Date.now()+Math.max(30,Math.min(300,Number.isFinite(seconds)?seconds:30))*1000;}
      throw Error(`Die Kartendatenquelle ist gerade nicht verfügbar (HTTP ${response.status}). Bitte später erneut laden.`);
    }
    const reader = response.body.getReader(), chunks = []; let size = 0;
    while (true) {const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 16 * 1024 * 1024) {await reader.cancel(); throw Error('Zu viele Kartendaten. Bitte näher heranzoomen.');} chunks.push(value);}
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
    const result = parseNetwork(JSON.parse(new TextDecoder().decode(bytes)), bounds, modes);
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
    if (cache.size >= 8) cache.delete(cache.keys().next().value);
    cache.set(key, {data: result, at: Date.now()}); return result;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
    if (timedOut) {nextRequestAt = Date.now() + 30000; throw Error('Die Kartendatenquelle hat nicht rechtzeitig geantwortet. Bitte später erneut laden oder näher heranzoomen.');}
    throw error;
  } finally {clearTimeout(timer); signal?.removeEventListener('abort', abort);}
}
