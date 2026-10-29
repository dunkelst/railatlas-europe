import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {handleApi} from '../lib/api.mjs';
import {findMexicanAirports,mexicoLookupContext,rankMexicanLocations} from '../lib/location-search.mjs';
import {parseBusStops} from '../lib/stop-search.mjs';
import {withinRegion} from '../lib/regions.mjs';
import {parseTransitousJourneys} from '../lib/transitous.mjs';
const monterrey=()=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/transitous-mexico-monterrey.json.gz',import.meta.url))));

test('CUN, MEX and their names resolve to actual airports, not bus stops or invented entrances',()=>{
 for(const [query,code,ident,lat,lon] of [['CUN','CUN','MMUN',21.040817,-86.87347],['Flughafen Cancun','CUN','MMUN',21.040817,-86.87347],['MEX','MEX','MMMX',19.435822,-99.07033],['Aeropuerto Benito Juarez','MEX','MMMX',19.435822,-99.07033]]){
  const s=findMexicanAirports(query).find(s=>s.iata===code);assert.ok(s,query);assert.equal(s.id,'airport:'+ident);assert.equal(s.lat,lat);assert.equal(s.lon,lon);assert.equal(s.locationType,'coordinate');assert.equal(s.placeType,'airport');assert.equal(s.transitousId,undefined);assert.equal(s.timetableStatus,'unverified');
 }
 assert.ok(findMexicanAirports('Flughafen Mexico DF').some(s=>s.iata==='MEX'));assert.ok(findMexicanAirports('MTY').some(s=>s.id==='airport:MMMY'));assert.deepEqual(findMexicanAirports('Rohdental'),[]);
 const m=JSON.parse(fs.readFileSync(new URL('../public/data/mexico-places-sources.json',import.meta.url)));assert.equal(m.airports,63);assert.equal(m.sources[0].license,'Public Domain');assert.ok(m.sources.every(s=>s.sha256.length===64));
});

test('Airport codes use the shared API even when external searches are unavailable',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('offline');});
 for(const q of ['CUN','MEX']){const r=await handleApi(new Request('https://railatlas.test/api/stations?'+new URLSearchParams({region:'mexico',q,near:'19.4326,-99.1332'}),{headers:{Origin:'https://dunkelst.github.io'}}));assert.equal(r.status,200);const d=await r.json();assert.equal(d.stations.length,1);assert.equal(d.stations[0].iata,q);assert.equal(r.headers.get('access-control-allow-origin'),'https://dunkelst.github.io');}
 assert.equal(calls,0);
});

test('Terminal queries retain the requested terminal and focus on the actual airport',()=>{
 for(const q of ['Terminal 2 CUN','T2 CUN']){const c=mexicoLookupContext(q,[19.4326,-99.1332]);assert.equal(c.query,'Terminal 2');assert.deepEqual(c.near,[21.040817,-86.87347]);}
 const mex=mexicoLookupContext('Terminal 2 MEX');assert.deepEqual(mex.airports.map(a=>a.iata),['MEX']);assert.deepEqual(mex.near,[19.435822,-99.07033]);
 const f={type:'Feature',geometry:{type:'Point',coordinates:[-86.87347,21.040817]},properties:{osm_type:'W',osm_id:123,osm_key:'aeroway',osm_value:'terminal',name:'Terminal 2',countrycode:'MX',city:'Cancún'}};
 const [s]=parseBusStops({features:[f]},'Terminal 2','mexico');assert.equal(s.placeType,'terminal');assert.equal(s.locationType,'coordinate');assert.equal(s.lat,f.geometry.coordinates[1]);assert.deepEqual(parseBusStops({features:[f]},'Terminal 3','mexico'),[]);
});

test('Mexican searches exclude distant foreign matches and distinguish same-named cities and stops',()=>{
 assert.equal(withinRegion(32.75135,-97.2162,'mexico'),false);assert.equal(withinRegion(25.68828,-100.3227,'mexico'),true);
 const c=mexicoLookupContext('Monterrey',[19.4326,-99.1332]);assert.deepEqual(c.near,[25.6866,-100.3161]);
 const stops=[{id:'cdmx',name:'Monterrey',lat:19.41434,lon:-99.16299},{id:'texas',name:'Handley & Monterrey',lat:32.75135,lon:-97.2162},{id:'mty',name:'Monterrey - Centro',lat:25.68828,lon:-100.3227}];
 const ranked=rankMexicanLocations(stops,c);assert.equal(ranked[0].id,'mty');assert.match(ranked[0].locationHint,/Monterrey/);assert.match(ranked[1].locationHint,/Ciudad de México/);assert.ok(!ranked.some(s=>s.id==='texas'));assert.ok(!ranked.some(s=>s.country==='MX'));
});

test('Actual Mexico City–Monterrey trips diagnose their other destination, and become valid only after explicit selection',()=>{
 const f=monterrey(),before=JSON.stringify(f.raw),p=parseTransitousJourneys(f.raw,f.from,f.to,f.departure);
 assert.equal(p.journeys.length,0);assert.deepEqual(p.diagnostics.rejected,{ENDPOINT_MISMATCH:3});assert.equal(p.diagnostics.received,3);assert.equal(p.endpointAlternatives.length,1);
 const a=p.endpointAlternatives[0];assert.equal(a.side,'to');assert.equal(a.distanceMeters,63);assert.equal(a.journeys,3);assert.equal(a.station.transitousId,'us-flixbus_4b311f84-fd0d-41eb-810d-91dee90ff513');
 const selected=parseTransitousJourneys(f.raw,f.from,a.station,f.departure);assert.equal(selected.journeys.length,3);assert.equal(selected.journeys[0].legs[0].line,'FlixBus MX200');assert.equal(selected.journeys[0].arrival,'2026-11-01T05:35:00.000Z');assert.equal(JSON.stringify(f.raw),before);
 const empty=parseTransitousJourneys({itineraries:[]},f.from,f.to,f.departure);assert.equal(empty.diagnostics.received,0);assert.deepEqual(empty.diagnostics.rejected,{});
});

test('Cancelled, mistimed and distant proposals cannot produce a nearby-stop recovery',()=>{
 const f=monterrey();for(const mutate of [d=>d.itineraries.forEach(j=>j.legs[0].cancelled=true),d=>d.itineraries.forEach(j=>j.legs[0].startTime=j.legs[0].endTime.replace('01T','02T')),d=>d.itineraries.forEach(j=>j.legs[0].to.lat+=.02)]){const raw=structuredClone(f.raw);mutate(raw);const p=parseTransitousJourneys(raw,f.from,f.to,f.departure);assert.equal(p.journeys.length,0);assert.equal(p.endpointAlternatives.length,0);}
});

test('Mexico rejects European-only explicit providers before any upstream request',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('unexpected request');});
 for(const r of [await handleApi(new Request('https://railatlas.test/api/stations?region=mexico&source=efa&q=CUN')),await handleApi(new Request('https://railatlas.test/api/journeys',{method:'POST',body:JSON.stringify({region:'mexico',source:'oebb'})}))]){assert.equal(r.status,400);assert.match((await r.json()).error,/automatische Auskunft/);}
 assert.equal(calls,0);
});

test('The common journey API distinguishes rejected trips from an empty source and retains actionable alternatives',async t=>{
 const f=monterrey();t.mock.method(Date,'now',()=>Date.parse('2026-10-29T12:00:00Z'));let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json(f.raw);});
 const send=(from,to)=>handleApi(new Request('https://railatlas.test/api/journeys',{method:'POST',headers:{Origin:'https://dunkelst.github.io'},body:JSON.stringify({from,to,departure:f.departure,region:'mexico'})}));
 const r=await send(f.from,f.to);assert.equal(r.status,422);const d=await r.json();assert.equal(d.code,'JOURNEY_REJECTED');assert.equal(d.diagnostics.received,3);assert.doesNotMatch(d.error,/europäisch/);assert.equal(d.endpointAlternatives.length,1);
 const result=await send(f.from,d.endpointAlternatives[0].station);assert.equal(result.status,200);assert.equal((await result.json()).journeys.length,3);assert.equal(calls,2);
 t.mock.method(globalThis,'fetch',async()=>Response.json({itineraries:[]}));const empty=await send({...f.from,id:'coord:21:-87',transitousId:undefined,locationType:'coordinate',lat:21,lon:-87},f.to);assert.equal(empty.status,422);const e=await empty.json();assert.equal(e.code,'NO_JOURNEY');assert.equal(e.diagnostics.received,0);assert.deepEqual(e.endpointAlternatives,[]);
});
