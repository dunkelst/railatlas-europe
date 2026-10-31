import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parseAdoJourneys,adoLocation} from '../lib/ado.mjs';
import {handleApi} from '../lib/api.mjs';
import {zonedInput} from '../lib/rail.mjs';
const fixture=()=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/ado-cancun-tulum.json.gz',import.meta.url))));
const selected=f=>{const p=parseAdoJourneys(f.raw,f.request.from,f.request.to,f.request.departure);return {from:p.endpointAlternatives.find(a=>a.station.adoStationCode==='MXCUNCIF').station,to:p.endpointAlternatives.find(a=>a.side==='to').station};};

test('Actual ADO departures require explicit terminal and destination adoption, preserving source coordinates',()=>{
 const f=fixture(),before=JSON.stringify(f),p=parseAdoJourneys(f.raw,f.request.from,f.request.to,f.request.departure);
 assert.equal(p.diagnostics.received,18);assert.equal(p.journeys.length,0);assert.deepEqual(p.diagnostics.rejected,{ENDPOINT_MISMATCH:18});
 assert.equal(p.endpointAlternatives.filter(a=>a.side==='from').length,3);assert.equal(p.endpointAlternatives[0].station.adoStationCode,'MXCUNCIF');assert.equal(p.endpointAlternatives[0].distanceMeters,147);
 const {from,to}=selected(f);assert.equal(from.lat,21.039512);assert.equal(from.lon,-86.873266);assert.equal(to.lat,20.210613);assert.equal(to.lon,-87.465025);assert.equal(from.timeZone,'America/Cancun');
 const trips=parseAdoJourneys(f.raw,from,to,f.request.departure).journeys;assert.equal(trips.length,6);
 assert.equal(zonedInput(trips[0].departure,'America/Cancun').slice(0,16),'2026-10-31T12:00');assert.equal(zonedInput(trips[0].arrival,'America/Cancun').slice(0,16),'2026-10-31T14:20');
 assert.ok(trips.every(j=>j.source==='ADO / Distribusion'&&j.routingStatus==='provider-checked'&&j.legs.every(l=>l.mode==='bus'&&!l.walking&&!l.realtime&&l.geometry.segments.length===0&&l.geometry.status==='missing')));
 assert.equal(JSON.stringify(f),before);
});

test('Unavailable or mistimed ADO services cannot create accepted trips or misleading endpoint proposals',()=>{
 const f=fixture(),{from,to}=selected(f);
 for(const change of [r=>r.data.forEach(c=>c.attributes.booked_out=true),r=>r.data.forEach(c=>c.attributes.total_seats_left=0),r=>r.included.filter(s=>s.type==='segments').forEach(s=>s.attributes.arrival_time='2026-10-31T00:01')]){
  const raw=structuredClone(f.raw);change(raw);const p=parseAdoJourneys(raw,from,to,f.request.departure);assert.equal(p.journeys.length,0);assert.equal(p.endpointAlternatives.length,0);
 }
 const moved={...from,lat:from.lat+.001};assert.equal(parseAdoJourneys(f.raw,moved,to,f.request.departure).journeys.length,0,'A matching source ID never overrides displaced coordinates');
 assert.equal(parseAdoJourneys(f.raw,from,to,'2026-11-01T14:00:00.000Z').journeys.length,0,'An earlier calendar day cannot become a current departure');
 assert.throws(()=>parseAdoJourneys({},from,to,f.request.departure));
});

test('ADO lookup respects native provider selections and bounded actual search areas',()=>{
 const f=fixture(),{from,to}=selected(f);assert.equal(adoLocation(f.request.from).code,'MXCUNCA');assert.equal(adoLocation(f.request.to).code,'MXTUL');assert.equal(adoLocation(from).type,'stations');assert.equal(adoLocation(to).code,'MXTULTAT');
 assert.equal(adoLocation({...f.request.to,lat:19.4326,lon:-99.1332}),null);assert.equal(adoLocation({...f.request.to,transitousId:'real-other-provider-stop'}),null);assert.equal(adoLocation({...f.request.to,lat:49.14,lon:9.2}),null);
});

test('Shared API compares dated ADO and Tren Maya sources and revalidates adopted endpoints',async t=>{
 const f=fixture();t.mock.method(Date,'now',()=>Date.parse('2026-10-30T12:00:00Z'));let calls=0;
 const train=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/tren-maya-timetables.json.gz',import.meta.url)))).cases[0];let trainCalls=0;
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);if(u.origin==='https://reservas.ventaboletostrenmaya.com.mx'){trainCalls++;return new Response(train.html);}calls++;assert.equal(u.origin,'https://book.api.distribusion.com');assert.equal(u.pathname,'/api/connections');assert.equal(u.searchParams.get('search_bounds[0][departure_date]'),'2026-10-31');assert.equal(u.searchParams.get('search_bounds[0][departure_start_time]'),'09:00');assert.equal(u.searchParams.get('retailer_partner_number'),'343401');return Response.json(f.raw);});
 const send=request=>handleApi(new Request('https://railatlas.test/api/journeys',{method:'POST',body:JSON.stringify(request)}));
 const first=await send(f.request);assert.equal(first.status,422);const d=await first.json();assert.equal(d.code,'JOURNEY_REJECTED');assert.equal(d.diagnostics.provider,'ADO / Tren Maya');assert.equal(trainCalls,1);assert.ok(d.endpointAlternatives.some(a=>a.station.trenMayaId==='22'));assert.ok(d.endpointAlternatives.some(a=>a.station.trenMayaId==='25'));assert.equal(calls,1);
 const again=await send({...f.request,from:{...f.request.from,lat:f.request.from.lat+.0001}});assert.equal(again.status,422);const changed=await again.json();assert.equal(calls,1);assert.notEqual(changed.endpointAlternatives[0].distanceMeters,d.endpointAlternatives[0].distanceMeters);
 const {from,to}=selected(f),accepted=await send({...f.request,from,to});assert.equal(accepted.status,200);const result=await accepted.json();assert.equal(result.journeys.length,6);assert.equal(result.journey.legs[0].from.adoStationCode,'MXCUNCIF');assert.equal(result.journey.legs[0].to.adoStationCode,'MXTULTAT');assert.equal(calls,2);
});

test('ADO source honours aborts and provider cooldown without copying credentials or retrying requests',async t=>{
 const f=fixture(),{getAdoJourneys}=await import('../lib/ado.mjs?cooldown');let now=Date.parse('2026-10-30T12:00:00Z'),calls=0;t.mock.method(Date,'now',()=>now);
 t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('busy',{status:429,headers:{'Retry-After':'120'}});});
 await assert.rejects(getAdoJourneys(f.request.from,f.request.to,f.request.departure),/nicht erreichbar/);assert.equal(calls,1);now+=119000;await assert.rejects(getAdoJourneys(f.request.from,f.request.to,f.request.departure),/pausiert/);assert.equal(calls,1);
 const c=new AbortController();c.abort();await assert.rejects(getAdoJourneys(f.request.from,f.request.to,f.request.departure,c.signal),{name:'AbortError'});assert.equal(calls,1);
});
