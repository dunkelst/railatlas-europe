import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {trenMayaStations,findTrenMayaStations,trenMayaLocation,parseTrenMayaTimetable,getTrenMayaJourneys} from '../lib/tren-maya.mjs';
import {findMexicanAirports} from '../lib/location-search.mjs';
import {adoLocation} from '../lib/ado.mjs';
import {zonedInput} from '../lib/rail.mjs';
import {handleApi} from '../lib/api.mjs';
import {fetchNetwork} from '../lib/network.mjs';
import {getTimetableJourneys} from '../lib/timetable.mjs';
const fixtures=()=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/tren-maya-timetables.json.gz',import.meta.url))));
const station=code=>({...trenMayaStations.find(s=>s.trenMayaId===code)});
const early='2026-10-31T05:00:00Z';
const city={id:'city:tulum',name:'Tulum',lat:20.2112,lon:-87.4628,country:'MX',dbId:'',main:false,locationType:'coordinate',placeType:'city'};

test('Real dated Tren Maya tables cover forward, reverse and time-zone crossing services',()=>{
 const f=fixtures(),before=JSON.stringify(f);
 for(const [index,number,dep,arr,minutes] of [[0,'601','09:00','10:33',93],[1,'402','07:01','08:38',97],[2,'306','08:00','10:28',208]]){
  const c=f.cases[index],from=station(c.from),to=station(c.to),p=parseTrenMayaTimetable(c.html,from,to,early),first=p.journeys[0];
  assert.equal(p.journeys.length,index===2?6:5);assert.equal(first.legs[0].line,'Tren Maya '+number);
  assert.equal(zonedInput(first.departure,from.timeZone).slice(11,16),dep);assert.equal(zonedInput(first.arrival,to.timeZone).slice(11,16),arr);assert.equal((Date.parse(first.arrival)-Date.parse(first.departure))/60000,minutes);
  assert.ok(first.legs[0].stopovers.every(s=>s.scheduledTime&&s.arrival===null&&s.departure===null),'A displayed intermediate stop time does not invent separate arrival/departure times');
  assert.ok(p.journeys.every(j=>j.source==='Tren Maya'&&j.disruptionCheck==='unavailable'&&j.legs.every(l=>l.mode==='train'&&!l.walking&&!l.realtime&&!l.geometry.segments.length)));
 }
 assert.equal(JSON.stringify(f),before);
});

test('Tren Maya proposes actual stations and never silently moves airport, city or displaced source points',()=>{
 const c=fixtures().cases[0],from=findMexicanAirports('CUN')[0],p=parseTrenMayaTimetable(c.html,from,city,early);
 assert.equal(p.journeys.length,0);assert.deepEqual(p.diagnostics.rejected,{ENDPOINT_MISMATCH:5});assert.deepEqual(p.endpointAlternatives.map(a=>a.station.trenMayaId),['22','25']);
 assert.ok(p.endpointAlternatives[0].distanceMeters>1000);assert.ok(p.endpointAlternatives[1].distanceMeters>3500);
 assert.equal(p.endpointAlternatives[0].station.lat,21.0283652);assert.equal(p.endpointAlternatives[1].station.lon,-87.4535575);
 assert.equal(parseTrenMayaTimetable(c.html,station('22'),station('25'),early).journeys.length,5);
 assert.equal(parseTrenMayaTimetable(c.html,{...station('22'),lat:21.0294},station('25'),early).journeys.length,0);
 assert.equal(trenMayaLocation({...station('22'),id:'tren-maya:25'}),null);assert.equal(trenMayaLocation({...from,lat:49,lon:9}),null);
 assert.equal(trenMayaLocation({...station('22'),adoStationCode:'MXCUNCIF'}),null);assert.equal(adoLocation(station('22')),null);
 assert.equal(trenMayaLocation({...station('22'),trenMayaId:undefined,id:'osm:way/1231436198'}).trenMayaId,'22');
});

test('Wrong dates, station echoes, durations, cancelled trains and past departures cannot become journeys',()=>{
 const c=fixtures().cases[0],from=station('22'),to=station('25');
 assert.throws(()=>parseTrenMayaTimetable(c.html.replaceAll('31/10/2026','30/10/2026'),from,to,early),{code:'SOURCE_RESPONSE_INVALID'});
 assert.throws(()=>parseTrenMayaTimetable(c.html.replace('idToStation").val("25")','idToStation").val("24")'),from,to,early),{code:'SOURCE_RESPONSE_INVALID'});
 assert.throws(()=>parseTrenMayaTimetable('<html>service unavailable</html>',from,to,early),{code:'SOURCE_RESPONSE_INVALID'});
 const changed=c.html.replaceAll('10:33','10:32'),p=parseTrenMayaTimetable(changed,from,to,early);assert.equal(p.journeys.length,4);assert.equal(p.diagnostics.rejected.TIME_CONFLICT,1);
 const cancelled=c.html.replaceAll('train-short-retail ','train-short-retail cancelled ');const rejected=parseTrenMayaTimetable(cancelled,from,to,early);assert.equal(rejected.journeys.length,0);assert.equal(rejected.endpointAlternatives.length,0);
 const late=parseTrenMayaTimetable(c.html,from,to,'2026-11-01T04:00:00Z');assert.equal(late.journeys.length,0);assert.equal(late.diagnostics.rejected.TOO_EARLY,5);
});

test('All provider station identities use real mapped stations; IATA search keeps the airport distinct',async t=>{
 assert.equal(trenMayaStations.length,34);assert.equal(new Set(trenMayaStations.map(s=>s.id)).size,34);
 assert.equal(findTrenMayaStations('Tulum').length,2);assert.equal(findTrenMayaStations('Mérida')[0].trenMayaId,'15');
 assert.equal(findTrenMayaStations('CUN')[0].trenMayaId,'22');
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('offline');});
 const r=await handleApi(new Request('https://railatlas.test/api/stations?region=mexico&q=CUN'));assert.equal(r.status,200);const d=await r.json();assert.equal(d.stations.length,2);assert.equal(d.stations[0].iata,'CUN');assert.equal(d.stations[1].trenMayaId,'22');assert.equal(calls,0);
 const network=await fetchNetwork([19.9,-88,21.5,-86.3],['rail'],undefined,'overview',false,'mexico');
 for(const code of ['22','23','24','25'])assert.ok(network.layers.rail.stops.some(s=>s.station?.trenMayaId===code));assert.equal(calls,0);
});

test('Shared API queries the anonymous dated source, caches raw data and revalidates every endpoint',async t=>{
 const c=fixtures().cases[0];t.mock.method(Date,'now',()=>Date.parse('2026-10-30T12:00:00Z'));let calls=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{calls++;const u=new URL(url);assert.equal(u.origin,'https://reservas.ventaboletostrenmaya.com.mx');assert.equal(init.method,undefined);assert.equal(u.searchParams.get('_TmFlatTimetables_idFromStation'),'22');assert.equal(u.searchParams.get('_TmFlatTimetables_idToStation'),'25');assert.equal(u.searchParams.get('_TmFlatTimetables_departureDate'),'31/10/2026');assert.ok(!/auth|cookie|token/i.test(JSON.stringify(init.headers)));assert.ok(!u.searchParams.has('p_auth'));return new Response(c.html);});
 const send=from=>handleApi(new Request('https://railatlas.test/api/journeys',{method:'POST',body:JSON.stringify({from,to:station('25'),departure:early,region:'mexico'})}));
 const r=await send(station('22'));assert.equal(r.status,200);assert.equal((await r.json()).journeys.length,5);assert.equal(calls,1);
 const displaced=await send({...station('22'),lat:21.0294});assert.equal(displaced.status,422);assert.equal((await displaced.json()).endpointAlternatives[0].station.trenMayaId,'22');assert.equal(calls,1);
});

test('ADO failure cannot erase confirmed Tren Maya journeys in the shared comparison',async t=>{
 const c=fixtures().cases[0];t.mock.method(Date,'now',()=>Date.parse('2026-10-30T12:00:00Z'));
 t.mock.method(globalThis,'fetch',async url=>new URL(url).host==='book.api.distribusion.com'?new Response('unavailable',{status:503}):new Response(c.html));
 const asArea=(s,placeType)=>({...s,id:'coord:'+s.trenMayaId,trenMayaId:undefined,networkMode:'location',locationType:'coordinate',placeType});
 const result=await getTimetableJourneys(asArea(station('22'),'airport'),asArea(station('25'),'city'),early,'auto',undefined,'arrival',0,'mexico');
 assert.equal(result.length,5);assert.ok(result[0].sourceWarning.includes('nur einen Teil'));
});

test('Tren Maya requests honour aborts, Retry-After and bounded response bodies',async t=>{
 const {getTrenMayaJourneys:get}=await import('../lib/tren-maya.mjs?cooldown');let calls=0,now=Date.parse('2026-10-30T12:00:00Z');t.mock.method(Date,'now',()=>now);
 t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('busy',{status:429,headers:{'Retry-After':'120'}});});
 await assert.rejects(get(station('22'),station('25'),early),/nicht erreichbar/);now+=119000;await assert.rejects(get(station('22'),station('25'),early),/pausiert/);assert.equal(calls,1);
 const c=new AbortController();c.abort();await assert.rejects(get(station('22'),station('25'),early,c.signal),{name:'AbortError'});assert.equal(calls,1);
 now+=2000;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('x'.repeat(2*1024*1024+1));});await assert.rejects(get(station('22'),station('25'),early),e=>e.code==='SOURCE_RESPONSE_INVALID');assert.equal(calls,2);
});
