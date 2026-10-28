import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {NETWORK_MODES,networkMode,networkQuery,parseNetwork,fetchNetwork,findMexicanMapStations,defaultNetworkLayers,mergeNetworkStops} from '../lib/network.mjs';
import {parseBusStops,findBusStops} from '../lib/stop-search.mjs';
import {localZonedISO,zonedInput,localBerlinISO} from '../lib/rail.mjs';
import {MEXICO_PLACES,TIME_ZONES} from '../lib/regions.mjs';
import {handleApi} from '../lib/api.mjs';
const bounds=[20.62,-87.08,20.635,-87.065],fixture=()=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/osm-playa-colectivos.json.gz',import.meta.url))));

test('Actual Playa Colectivo relations retain source fragments and mapped boarding places in an independent layer',()=>{
 const raw=fixture(),before=JSON.stringify(raw),d=parseNetwork(raw,bounds,['bus','colectivo']);
 assert.equal(d.layers.colectivo.lines.length,31);assert.equal(d.layers.colectivo.stops.length,13);assert.equal(d.layers.bus.lines.length,0);
 for(const ref of ['CL02','CL03','CL05','CL07'])assert.ok(d.layers.colectivo.lines.some(l=>l.ref===ref));
 const coords=new Set(raw.elements.filter(e=>e.type==='node').map(e=>JSON.stringify([e.lat,e.lon])));
 assert.ok(d.layers.colectivo.lines.every(l=>l.segments.flat().every(p=>coords.has(JSON.stringify(p)))));
 assert.ok(d.layers.colectivo.stops.every(s=>s.boardingKind==='mapped'&&s.sourceUrl.startsWith('https://www.openstreetmap.org/')));
 assert.equal(JSON.stringify(raw),before);
 const layers=defaultNetworkLayers();assert.equal(layers.colectivo.lines,false);assert.equal(layers.colectivo.stops,false);layers.colectivo.lines=true;assert.equal(layers.bus.lines,false);
});

test('Colectivos follow explicit source classification; ordinary bus, private taxi and Metro stay separate',()=>{
 for(const tags of [{route:'share_taxi'},{route:'minibus'},{route:'bus',bus:'minibus'},{route:'bus',name:'Colectivos a Tulum'}])assert.equal(networkMode(tags),'colectivo');
 assert.equal(networkMode({route:'bus',name:'Metrobús 1'}),'bus');assert.equal(networkMode({route:'subway',operator:'Sistema de Transporte Colectivo Metro'}),'subway');assert.equal(networkMode({route:'taxi'}),null);
 const q=networkQuery(bounds,['colectivo']);assert.match(q,/share_taxi/);assert.match(q,/bus=minibus/);assert.match(q,/role|platform/);
});

test('Mexico snapshot is usable through the shared API despite upstream outages, with original IDs and data provenance',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('unexpected upstream');});
 const r=await handleApi(new Request('https://railatlas.local/api/network?'+new URLSearchParams({bbox:bounds.join(','),modes:'colectivo',detail:'stops'}),{headers:{Origin:'https://dunkelst.github.io'}}));
 assert.equal(r.status,200);assert.equal(calls,0);assert.equal(r.headers.get('access-control-allow-origin'),'https://dunkelst.github.io');
 const d=await r.json();assert.equal(d.layers.colectivo.stops.length,14);assert.equal(d.layers.colectivo.lines.length,0);assert.ok(d.layers.colectivo.stops.every(s=>s.station.id==='osm:'+s.id&&['','MX'].includes(s.station.country)));assert.ok(d.attributions.some(a=>a.url==='https://www.openstreetmap.org/copyright'));
 const all=await fetchNetwork(bounds,['colectivo']);assert.equal(all.layers.colectivo.lines.length,31);assert.equal(calls,0);
});

test('Mexican source stops can be searched with city context, while excluded virtual points remain excluded',async()=>{
 const stops=await findMexicanMapStations('Zócalo');assert.ok(stops.length);assert.ok(stops.every(s=>s.country==='MX'&&s.dbId===''));
 const playa=await findMexicanMapStations('Playa del Carmen');assert.ok(playa.some(s=>s.networkMode==='colectivo'));
 const sources=JSON.parse(fs.readFileSync(new URL('../public/data/mexico-sources.json',import.meta.url)));assert.equal(sources.find(s=>s.id==='mex-oax-salinacruz').excludedVirtualStops,497);
 assert.ok(sources.every(s=>s.sha256.length===64&&s.license&&s.sourceDate));
});

test('Photon separates Mexico from Europe, and does not turn ordinary taxis into public stops',async t=>{
 const feature={type:'Feature',geometry:{type:'Point',coordinates:[-87.073,20.627]},properties:{osm_key:'highway',osm_value:'bus_stop',osm_type:'N',osm_id:123,name:'Playa del Carmen',countrycode:'MX'}};
 const raw={features:[feature]};assert.equal(parseBusStops(raw,'Playa del Carmen').length,0);assert.equal(parseBusStops(raw,'Playa del Carmen','mexico').length,1);
 assert.equal(parseBusStops({features:[{...feature,properties:{...feature.properties,countrycode:'US'}}]},'Playa','mexico').length,0);
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);assert.equal(u.searchParams.get('bbox'),'-118.5,14.3,-86.5,32.8');return Response.json(raw);});
 assert.equal((await findBusStops('Playa del Carmen',undefined,'mexico')).length,1);
});

test('Mexican and European wall times convert to the correct UTC date, including border DST',()=>{
 for(const [zone,expected] of [['America/Mexico_City','15'],['America/Cancun','14'],['America/Mazatlan','16'],['America/Hermosillo','16'],['America/Tijuana','16']]){
  const iso=localZonedISO('2026-10-31T09:00',zone);assert.equal(iso,'2026-10-31T'+expected+':00:00.000Z');assert.equal(zonedInput(iso,zone).slice(0,16),'2026-10-31T09:00');
 }
 assert.equal(localZonedISO('2026-11-02T09:00','America/Tijuana'),'2026-11-02T17:00:00.000Z');assert.throws(()=>localZonedISO('2026-03-08T02:30','America/Tijuana'));
 assert.equal(localBerlinISO('2026-10-31T09:00'),'2026-10-31T08:00:00.000Z');
 assert.equal(MEXICO_PLACES.length,43);assert.equal(new Set(MEXICO_PLACES.slice(0,32).map(p=>p.id)).size,32);assert.ok(MEXICO_PLACES.every(p=>TIME_ZONES.includes(p.timeZone)));
});

test('Real adjacent Mexico cells preserve both pieces of the same OSM route across the boundary',async()=>{
 const {default:index}=await import('../lib/mexico-osm-index.mjs');
 const load=async x=>{const entry=index.find(t=>t.bounds[0]===19.25&&t.bounds[1]===x);assert.ok(entry);const {default:encoded}=await entry.load();return JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));};
 const a=await load(-99.5),b=await load(-99.25),line=a.layers.bus.lines.find(l=>b.layers.bus.lines.some(k=>k.id===l.id));assert.ok(line,'The recorded CDMX cells share actual crossing bus routes');
 const other=b.layers.bus.lines.find(l=>l.id===line.id),merged=mergeNetworkStops(a,b,['bus']),result=merged.layers.bus.lines.find(l=>l.id===line.id);
 const expected=[...new Map([...line.segments,...other.segments].map(s=>[JSON.stringify(s),s])).values()];assert.deepEqual(result.segments,expected);assert.ok(result.segments.length>=line.segments.length);
});

test('Invalid regions and unsupported Mexican walking fallback requests fail without European provider calls',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('unexpected request');});
 const bad=await handleApi(new Request('https://railatlas.local/api/stations?q=Mexico&region=unknown'));assert.equal(bad.status,400);
 const r=await handleApi(new Request('https://railatlas.local/api/journeys',{method:'POST',body:JSON.stringify({region:'mexico',walkingBudget:30})}));assert.equal(r.status,400);assert.match((await r.json()).error,/Mexiko/);assert.equal(calls,0);
});

test('Actual Mexico City to Puebla plan uses the shared API and Mexican clock without European providers',async t=>{
 const f=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/transitous-mexico-puebla.json.gz',import.meta.url))));let calls=0;
 t.mock.method(Date,'now',()=>Date.parse('2026-10-28T12:00:00Z'));
 t.mock.method(globalThis,'fetch',async url=>{calls++;const u=new URL(url);assert.equal(u.origin,'https://api.transitous.org');assert.equal(u.pathname,'/api/v6/plan');assert.equal(u.searchParams.get('fromPlace'),f.request.from.transitousId);return Response.json(f.plan);});
 const r=await handleApi(new Request('https://railatlas.local/api/journeys',{method:'POST',body:JSON.stringify(f.request)}));assert.equal(r.status,200);const result=await r.json();assert.equal(result.journeys.length,3);assert.equal(calls,1);
 assert.equal(zonedInput(result.journey.departure,'America/Mexico_City').slice(0,16),'2026-10-31T09:00');assert.equal(zonedInput(result.journey.arrival,'America/Mexico_City').slice(0,16),'2026-10-31T11:15');
 assert.ok(result.journeys.every(j=>j.legs.every(l=>!l.cancelled&&l.mode!=='unknown')));
});
