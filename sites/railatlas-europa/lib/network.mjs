// Independent EFA/OSM network overlays. These are infrastructure, not a timetable.
import {requestEfaMap,parseVrrStation,vrrProduct,EFA_PROVIDER,EFA_SOURCE} from './vrr.mjs';
import {berlinInput,distanceKm} from './rail.mjs';
import {sameNearbyStation} from './journey.mjs';
import {fetchTransitousStops,fetchTransitousRoutes,parseTransitousStation,transitousModes,TRANSITOUS_SOURCE,TRANSITOUS_ATTRIBUTIONS} from './transitous.mjs';
import {decodePolyline} from './transit.mjs';
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
// A partial overview is not a substitute for a substantially closer query.
export const networkCovers = (data, bounds, modes) => containsBounds(data?.bounds,bounds) && modes.every(mode=>data.modes?.includes(mode)) && [0,1].every(axis=>data.bounds[axis+2]-data.bounds[axis]<=2*(bounds[axis+2]-bounds[axis]));
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
export async function fetchOsmNetwork(bounds, modes, signal, refresh=false, timeout=NETWORK_TIMEOUT_MS) {
  if(signal?.aborted)throw new DOMException('Abgebrochen', 'AbortError');
  const query = networkQuery(bounds, modes), key = query, found = cache.get(key);
  if (!refresh && found && Date.now() - found.at < 300000) return found.data;
  if(!refresh)for(const item of cache.values())if(Date.now()-item.at<300000 && networkCovers(item.data,bounds,modes))return item.data;
  if (Date.now() < nextRequestAt) throw Error('Die Kartendatenquelle ist ausgelastet. Bitte in etwa einer Minute erneut laden.');
  let timedOut = false;
  const controller = new AbortController(), abort = () => controller.abort(), timer = setTimeout(() => {timedOut = true; controller.abort();}, timeout);
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
 if(warning){result.warning=warning;result.warningScope='lines';}
 return result;
}
function sameNetworkStop(a,b,mode,cos){return Math.abs(a.lat-b.lat)<.003&&Math.abs(a.lon-b.lon)<.003/cos&&sameNearbyStation({...(a.station||a),networkMode:mode},{...(b.station||b),networkMode:mode});}
const transitousFeed=id=>id.includes('_')?id.slice(0,id.indexOf('_')):'';
export function parseTransitousNetwork(raw,bounds,modes){
 validateBounds(bounds);
 const layers=Object.fromEntries(NETWORK_MODES.map(m=>[m.id,{lines:[],stops:[]}])),seen=new Set(),cos=Math.max(.05,Math.cos((bounds[0]+bounds[2])/2*Math.PI/180));
 for(const item of raw){
  const station=parseTransitousStation(item);
  if(!station||seen.has(station.id)||!insideBounds(bounds,[station.lat,station.lon]))continue;
  seen.add(station.id);
  const stop={id:station.id,name:station.name,lat:station.lat,lon:station.lon,station,source:TRANSITOUS_SOURCE,lines:[]},feed=transitousFeed(station.transitousId);
  for(const mode of transitousModes(item))if(modes.includes(mode)){
   const index=feed?layers[mode].stops.findIndex(p=>!(p.station.transitousIds||[p.station.transitousId]).some(id=>transitousFeed(id)===feed)&&sameNetworkStop(p,stop,mode,cos)):-1;
   if(index<0)layers[mode].stops.push(stop);
   else{const first=layers[mode].stops[index];layers[mode].stops[index]={...first,station:{...first.station,transitousIds:[...(first.station.transitousIds||[first.station.transitousId]),station.transitousId]}};}
  }
 }
 return {layers,bounds,modes:[...modes],detail:'stops',source:TRANSITOUS_SOURCE,attributions:TRANSITOUS_ATTRIBUTIONS,fetchedAt:new Date().toISOString(),coverage:'partial',...(raw.length>=8192?{warning:'Sehr viele Halte geliefert; für weitere Details bitte näher heranzoomen.',warningScope:'stops'}:{})};
}
export function parseTransitousRoutes(data,bounds,modes){
 validateBounds(bounds);
 if(!Array.isArray(data?.routes)||!Array.isArray(data?.polylines))throw Error('Keine lesbaren MOTIS-Linienverläufe.');
 const result=parseTransitousNetwork([],bounds,modes),decoded=new Map(),grouped=new Map();result.detail='all';
 for(const route of data.routes){
  const mode=transitousModes({modes:[route.mode]})[0];
  if(!modes.includes(mode)||!['TIMETABLE','ROUTED'].includes(route.pathSource)||!Array.isArray(route.transitRoutes)||!Array.isArray(route.segments))continue;
  const metadata=route.transitRoutes.filter(r=>typeof r.id==='string'&&typeof r.shortName==='string');if(!metadata.length)continue;
  const key=JSON.stringify([mode,route.pathSource,metadata.map(r=>[r.id,r.shortName,r.longName||''])]),segments=[];
  for(const index of new Set(route.segments.map(s=>s.polyline).filter(i=>Number.isInteger(i)&&i>=0))){
   if(!decoded.has(index)){const p=data.polylines[index]?.polyline;decoded.set(index,p?visibleNetworkSegments([decodePolyline(p.points,p.precision)],bounds):[]);}
   segments.push(...decoded.get(index));
  }
  if(!segments.length)continue;
  if(!grouped.has(key))grouped.set(key,{mode,id:'transitous-route:'+key,sourceIndex:route.routeIdx,sourceIds:metadata.map(r=>r.id),names:[...new Set(metadata.map(r=>r.shortName).filter(Boolean))],name:metadata.map(r=>r.longName||r.shortName).filter(Boolean).join(' / ')||'Linie laut Auskunft',ref:metadata.map(r=>r.shortName).filter(Boolean).join(' / '),pathSource:route.pathSource,calculated:route.pathSource==='ROUTED',segments:[],keys:new Set()});
  const entry=grouped.get(key);for(const segment of segments){const k=JSON.stringify(segment);if(!entry.keys.has(k)){entry.keys.add(k);entry.segments.push(segment);}}
 }
 for(const {mode,keys,...line} of grouped.values())result.layers[mode].lines.push(line);
 if(data.zoomFiltered){result.warning='Die Linienquelle begrenzt ihre Auswahl bei dieser Zoomstufe; weitere Linien können fehlen.';result.warningScope='lines';}
 return result;
}
export function mergeNetworkStops(primary,regional,modes){
 if(!primary)return regional;if(!regional)return primary;
 const layers=Object.fromEntries(NETWORK_MODES.map(m=>[m.id,{lines:[...new Map([...primary.layers[m.id].lines,...regional.layers[m.id].lines].map(line=>[line.id,line])).values()],stops:[...primary.layers[m.id].stops]}]));
 const cos=Math.max(.05,Math.cos((primary.bounds[0]+primary.bounds[2])/2*Math.PI/180));
 for(const mode of modes)for(const stop of regional.layers[mode].stops){
  const index=layers[mode].stops.findIndex(p=>sameNetworkStop(p,stop,mode,cos));
  if(index<0)layers[mode].stops.push(stop);
  else{const first=layers[mode].stops[index];layers[mode].stops[index]={...first,lines:[...new Set([...first.lines,...stop.lines])],source:[...new Set([first.source,stop.source].filter(Boolean))].join(' + ')};}
 }
 const warning=[...new Set([primary.warning,regional.warning].filter(Boolean))].join(' ');
 return {...primary,layers,source:[...new Set([primary.source,regional.source].flatMap(s=>s.split(' + ')))].join(' + '),attributions:[...new Map([...(primary.attributions||[]),...(regional.attributions||[])].map(a=>[a.url,a])).values()],...(warning?{warning,warningScope:primary.warningScope==='all'||regional.warningScope==='all'?'all':'lines'}:{})};
}
export async function fetchNetwork(bounds,modes,signal,detail='all',refresh=false){
 signal?.throwIfAborted();
 try{networkQuery(bounds,modes);if(!['all','stops'].includes(detail))throw Error('Ungültige Auswahl für die Netzdaten.');}catch(error){error.code='INVALID_INPUT';throw error;}
 if(!refresh)for(const entry of mapCache.values())if(Date.now()-entry.at<300000&&networkCovers(entry.data,bounds,modes)&&(entry.data.detail==='all'||detail==='stops'))return entry.data;
 let result,efaError,transitousError,routeError,osmError,primary,regional;
 const hasData=data=>data&&modes.some(m=>data.layers[m].lines.length||data.layers[m].stops.length),needLines=detail==='all'&&modes.some(m=>m!=='rail');
 const replies=await Promise.allSettled([fetchTransitousStops(bounds,modes,signal),...(needLines?[fetchEfaNetwork(bounds,modes,signal,detail)]:[])]);signal?.throwIfAborted();
 if(replies[0].status==='fulfilled')primary=parseTransitousNetwork(replies[0].value,bounds,modes);else transitousError=replies[0].reason;
 if(needLines){if(replies[1].status==='fulfilled')regional=replies[1].value;else efaError=replies[1].reason;}
 else if(!hasData(primary))try{regional=await fetchEfaNetwork(bounds,modes,signal,detail);}catch(error){signal?.throwIfAborted();efaError=error;}
 result=mergeNetworkStops(hasData(primary)?primary:null,hasData(regional)?regional:null,modes);
 if(needLines){
  const missing=modes.filter(mode=>mode!=='rail'&&!result?.layers[mode].lines.length);
  if(missing.length)try{const lines=parseTransitousRoutes(await fetchTransitousRoutes(bounds,signal),bounds,missing);if(hasData(lines))result=mergeNetworkStops(result,lines,modes);}catch(error){signal?.throwIfAborted();routeError=error;}
 }
 if(!result)try{result=await fetchOsmNetwork(bounds,modes,signal,refresh);result.detail='all';}catch(error){signal?.throwIfAborted();throw Error('Die allgemeinen Netzdaten sind gerade nicht erreichbar. '+(efaError?'Auch die ergänzende Haltestellen-/Linienauskunft ist ausgefallen. ':'')+error.message);}
 else if(needLines){
  // A stop response does not satisfy a request for line paths. Supplement only
  // missing modes, preserving existing source stops, IDs and regional lines.
  const missing=modes.filter(mode=>mode!=='rail'&&!result.layers[mode].lines.length);
  if(missing.length)try{result=mergeNetworkStops(result,await fetchOsmNetwork(bounds,missing,signal,refresh,12000),modes);}catch(error){signal?.throwIfAborted();osmError=error;}
 }
 const warnings=[result.warning,transitousError?'Die europäische Haltestellenquelle ist gerade nicht erreichbar; ergänzende Quelldaten werden gezeigt.':'',needLines&&efaError?'Die ergänzende Linienauskunft ist gerade nicht erreichbar; gelieferte Halte bleiben sichtbar.':''];
 const missing=needLines?modes.filter(mode=>mode!=='rail'&&!result.layers[mode].lines.length):[];
 if(missing.length)warnings.push('Für '+missing.map(mode=>NETWORK_MODES.find(m=>m.id===mode).label).join(', ')+' fehlen bestätigte Linienverläufe in diesem Ausschnitt. '+(routeError?.responseTooLarge?'Die Linienquelle liefert zu viele Daten; bitte näher heranzoomen. ':routeError?'Die ergänzende Transitous-Linienkarte ist nicht erreichbar. ':'')+(osmError?'Auch die ergänzende OSM-Abfrage ist nicht erreichbar. ':'')+'Die gelieferten Halte bleiben nutzbar; daraus folgt keine Aussage über vorhandenen Verkehr.');
 if(modes.some(mode=>result.layers[mode].lines.some(line=>line.calculated)))warnings.push('Berechnete Linienverläufe sind gestrichelt dargestellt; sie sind keine bestätigten Original-Fahrplanverläufe.');
 const warning=[...new Set(warnings.filter(Boolean))].join(' ');
 result={...result,detail,...(warning?{warning,warningScope:primary?.warning||transitousError?'all':'lines'}:{})};
 if(mapCache.size>=8)mapCache.delete(mapCache.keys().next().value);
 mapCache.set(detail+':'+modes.join(',')+':'+bounds.join(','),{data:result,at:Date.now()});return result;
}
