// Independent EFA/OSM network overlays. These are infrastructure, not a timetable.
import {requestEfaMap,parseVrrStation,vrrProduct,EFA_PROVIDER,EFA_SOURCE} from './vrr.mjs';
import {berlinInput,distanceKm} from './rail.mjs';
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
export const containsBounds = (outer, inner) => Array.isArray(outer) && Array.isArray(inner) && outer.length===4 && inner.length===4 && outer[0]<=inner[0] && outer[1]<=inner[1] && outer[2]>=inner[2] && outer[3]>=inner[3];
// Stable, slightly larger cells prevent a new upstream query for every small pan.
export function networkRequestBounds(bounds) {
  validateBounds(bounds);
  const [s,w,n,e]=bounds,dy=2**Math.floor(Math.log2(n-s)),dx=2**Math.floor(Math.log2(e-w));
  const expanded=[Math.floor(s/dy)*dy,Math.floor(w/dx)*dx,Math.ceil(n/dy)*dy,Math.ceil(e/dx)*dx].map((v,i)=>(i<2?Math.floor(v*1e5):Math.ceil(v*1e5))/1e5);
  try{return validateBounds(expanded);}catch{return bounds;}
}
export const networkCovers = (data, bounds, modes) => containsBounds(data?.bounds,bounds) && modes.every(mode=>data.modes?.includes(mode));
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
  return {layers, bounds, modes:[...modes], fetchedAt: new Date().toISOString(), source: 'OpenStreetMap / Overpass', coverage: 'partial'};
}
const cache = new Map();
let nextRequestAt = 0;
export async function fetchOsmNetwork(bounds, modes, signal) {
  if(signal?.aborted)throw new DOMException('Abgebrochen', 'AbortError');
  const query = networkQuery(bounds, modes), key = query, found = cache.get(key);
  if (found && Date.now() - found.at < 300000) return found.data;
  for(const item of cache.values())if(Date.now()-item.at<300000 && networkCovers(item.data,bounds,modes))return item.data;
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

const efaServingCache=new Map(),mapCache=new Map();
const mapMode=transport=>({train:'rail','replacement-bus':'bus'})[vrrProduct(transport).mode]||vrrProduct(transport).mode;
const insideBounds=(bounds,point)=>point[0]>=bounds[0]&&point[0]<=bounds[2]&&point[1]>=bounds[1]&&point[1]<=bounds[3];
function edgeInBounds(a,b,[s,w,n,e]){
 const dy=b[0]-a[0],dx=b[1]-a[1];let from=0,to=1;
 for(const [p,q] of [[-dx,a[1]-w],[dx,e-a[1]],[-dy,a[0]-s],[dy,n-a[0]]]){
  if(p===0){if(q<0)return false;continue;}
  const t=q/p;if(p<0)from=Math.max(from,t);else to=Math.min(to,t);
  if(from>to)return false;
 }
 return true;
}
// Keep original neighbouring points at the viewport edge and never join gaps.
export function visibleNetworkSegments(sequences,bounds){
 const output=[];
 for(const sequence of sequences){let run=[];for(let i=1;i<sequence.length;i++){
  const a=sequence[i-1],b=sequence[i],touches=edgeInBounds(a,b,bounds);
  if(touches){if(!run.length)run.push(a);run.push(b);}else{if(run.length>1)output.push(run);run=[];}
 }if(run.length>1)output.push(run);}
 return output;
}
// The cache can cover a larger area. Rendering and counts use this same view.
export function networkInView(data,bounds){
 if(!data)return null;
 const layers=Object.fromEntries(Object.entries(data.layers).map(([mode,layer])=>[mode,{
  lines:layer.lines.map(line=>({...line,segments:visibleNetworkSegments(line.segments,bounds)})).filter(line=>line.segments.length),
  stops:layer.stops.filter(stop=>insideBounds(bounds,[stop.lat,stop.lon]))
 }]));
 return {...data,bounds,layers};
}
export function parseEfaNetwork(locations,lines,geometry,bounds,modes,servingByStop=new Map()){
 validateBounds(bounds);
 const layers=Object.fromEntries(NETWORK_MODES.map(m=>[m.id,{lines:[],stops:[]}])),source=EFA_SOURCE+' · Netzkarte';
 for(const raw of locations||[]){
  if(raw.type!=='stop')continue;
  const station=parseVrrStation(raw,EFA_PROVIDER);
  if(!station.efaId||![station.lat,station.lon].every(Number.isFinite)||!insideBounds(bounds,[station.lat,station.lon]))continue;
  for(const mode of new Set((raw.productClasses||[]).map(cls=>mapMode({product:{class:cls}}))))if(modes.includes(mode))layers[mode].stops.push({id:station.id,name:station.name,lat:station.lat,lon:station.lon,station,source,lines:[...new Set((servingByStop.get(station.efaId)||[]).filter(l=>mapMode(l)===mode).map(l=>l.number||l.disassembledName||l.name).filter(Boolean))]});
 }
 const metadata=new Map(lines.map(l=>[l.id,l])),grouped=new Map();
 for(const raw of geometry?.transportations||[]){
  const line=metadata.get(raw.id);if(!line)continue;
  const mode=mapMode(line);if(!modes.includes(mode)||mode==='rail')continue;
  const coords=Array.isArray(raw.coords)?raw.coords:[],sequences=Array.isArray(coords[0]?.[0])?coords:[coords];
  const segments=visibleNetworkSegments(sequences.filter(Array.isArray).flatMap(seq=>geometrySegments(seq.map(p=>Array.isArray(p)&&p.length===2?{lat:p[0],lon:p[1]}:null))),bounds);
  if(!segments.length)continue;
  const key=mode+':'+(line.properties?.globalId||line.id);
  if(!grouped.has(key))grouped.set(key,{mode,id:'efa-line:'+(line.properties?.globalId||line.id),name:line.name||line.number,ref:line.number||line.disassembledName||'',segments:[],keys:new Set()});
  const entry=grouped.get(key);for(const segment of segments){const key=JSON.stringify(segment);if(!entry.keys.has(key)){entry.keys.add(key);entry.segments.push(segment);}}
 }
 for(const {mode,keys,...line} of grouped.values())layers[mode].lines.push(line);
 return {layers,bounds,modes:[...modes],source,fetchedAt:new Date().toISOString(),coverage:'partial'};
}
async function servingLines(stop,date,signal){
 const key=date+':'+stop.efaId,cached=efaServingCache.get(key);signal?.throwIfAborted();if(cached&&cached.until>Date.now())return cached.lines;
 const data=await requestEfaMap('XML_SERVINGLINES_REQUEST',{commonMacro:'servinglines',type_sl:'stopID',name_sl:stop.efaId,mode:'odv',lsShowTrainsExplicit:'1',locationServerActive:'1'},signal);
 if(!Array.isArray(data.lines))throw Error('Die Linienauskunft hat keine lesbare Linienliste geliefert.');
 const lines=data.lines.filter(l=>typeof l.id==='string'&&l.id.length<180&&(!l.properties?.validity?.from||l.properties.validity.from<=date)&&(!l.properties?.validity?.to||l.properties.validity.to>=date));
 if(efaServingCache.size>=100)efaServingCache.delete(efaServingCache.keys().next().value);
 efaServingCache.set(key,{lines,until:Date.now()+2*3600000});return lines;
}
export async function fetchEfaNetwork(bounds,modes,signal,detail='all'){
 validateBounds(bounds);signal?.throwIfAborted();
 const [s,w,n,e]=bounds,box={boundingBox:'1',boundingBoxLU:`${w}:${n}:WGS84[dd.ddddd]`,boundingBoxRL:`${e}:${s}:WGS84[dd.ddddd]`},date=berlinInput(Date.now()).slice(0,10);
 const stops=await requestEfaMap('XML_COORD_REQUEST',{commonMacro:'coord',coordListOutputFormat:'list',inclFilter:'1',type_1:'STOP',...box},signal);
 if(!Array.isArray(stops.locations))throw Error('Die Karten-Haltestellenauskunft hat keine lesbaren Daten geliefert.');
 const relevant=stops.locations.filter(l=>l.type==='stop'&&Array.isArray(l.coord)&&insideBounds(bounds,l.coord)&&(l.productClasses||[]).some(cls=>modes.includes(mapMode({product:{class:cls}}))));
 let lines=[],geometry={},warning='',byStop=new Map();
 if(detail!=='stops'&&modes.some(m=>m!=='rail')&&relevant.length){
  const centre={lat:(s+n)/2,lon:(w+e)/2},candidates=relevant.map(l=>parseVrrStation(l,EFA_PROVIDER)).sort((a,b)=>distanceKm(a,centre)-distanceKm(b,centre));
  const selected=[];while(candidates.length&&selected.length<4){const index=selected.length?candidates.reduce((best,c,i)=>Math.min(...selected.map(x=>distanceKm(x,c)))>Math.min(...selected.map(x=>distanceKm(x,candidates[best])))?i:best,0):0;selected.push(candidates.splice(index,1)[0]);}
  const results=await Promise.allSettled(selected.map(stop=>servingLines(stop,date,signal)));signal?.throwIfAborted();
  results.forEach((r,i)=>{if(r.status==='fulfilled')byStop.set(selected[i].efaId,r.value);});
  const all=[...new Map(results.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(l=>modes.includes(mapMode(l))&&mapMode(l)!=='rail').map(l=>[l.id,l])).values()];
  lines=all.slice(0,12);
  if(relevant.length>selected.length||all.length>lines.length)warning='Linienauswahl begrenzt; für weitere Details bitte näher heranzoomen.';
  if(results.some(r=>r.status==='rejected'))warning='Ein Teil der Linienauskunft ist nicht erreichbar; gelieferte Halte bleiben sichtbar.';
  if(lines.length)try{geometry=await requestEfaMap('XML_GEOOBJECT_REQUEST',{commonMacro:'geoobj',coordListOutputFormat:'list',line:lines.map(l=>l.id),filterDate:date.replaceAll('-',''),...box},signal);if(!Array.isArray(geometry.transportations))throw Error('Keine lesbaren Linienverläufe.');}catch(error){signal?.throwIfAborted();warning='Linienverläufe sind gerade nicht erreichbar; gelieferte Halte bleiben sichtbar.';}
 }
 const result=parseEfaNetwork(relevant,lines,geometry,bounds,modes,byStop);result.detail=detail;
 if(detail!=='stops'&&modes.some(m=>m!=='rail')&&relevant.length&&!modes.some(m=>result.layers[m].lines.length)&&!warning)warning='Die Quelle liefert Halte, aber keine Linienverläufe für diesen Ausschnitt.';
 if(warning)result.warning=warning;
 return result;
}
export async function fetchNetwork(bounds,modes,signal,detail='all'){
 signal?.throwIfAborted();networkQuery(bounds,modes);
 if(!['all','stops'].includes(detail))throw Error('Ungültige Auswahl für die Netzdaten.');
 for(const entry of mapCache.values())if(Date.now()-entry.at<300000&&networkCovers(entry.data,bounds,modes)&&(entry.data.detail==='all'||detail==='stops'))return entry.data;
 let result,efaError;
 try{const data=await fetchEfaNetwork(bounds,modes,signal,detail);if(modes.some(m=>data.layers[m].lines.length||data.layers[m].stops.length))result=data;}catch(error){signal?.throwIfAborted();efaError=error;}
 if(!result)try{result=await fetchOsmNetwork(bounds,modes,signal);result.detail='all';}catch(error){signal?.throwIfAborted();throw Error('Die allgemeinen Netzdaten sind gerade nicht erreichbar. '+(efaError?'Auch die ergänzende Haltestellen-/Linienauskunft ist ausgefallen. ':'')+error.message);}
 if(mapCache.size>=8)mapCache.delete(mapCache.keys().next().value);
 mapCache.set(detail+':'+modes.join(',')+':'+bounds.join(','),{data:result,at:Date.now()});return result;
}
