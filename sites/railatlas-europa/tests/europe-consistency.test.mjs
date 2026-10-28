import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {normalize,unpack,searchStations} from '../lib/rail.mjs';
import {sameStation} from '../lib/journey.mjs';
import {sameVrrStation,parseVrrStations,EFA_PROVIDER} from '../lib/vrr.mjs';
import {mergeNotices,hafasTime} from '../lib/transit.mjs';
import {parseTransitousRoutes,parseTransitousNetwork,mergeNetworkStops} from '../lib/network.mjs';
import {handleApi} from '../lib/api.mjs';
import {parseTransitousJourneys} from '../lib/transitous.mjs';
import {cases,inspectStations} from '../scripts/audit-europe.mjs';

test('Every European audit input and catalogue station retains a valid searchable identity',()=>{
 const catalogue=unpack(JSON.parse(fs.readFileSync(new URL('../public/data/stations.json',import.meta.url))));
 assert.equal(cases.length,50);assert.equal(new Set(cases.map(c=>c.country)).size,50);
 assert.equal(new Set(catalogue.map(s=>s.id)).size,catalogue.length);
 assert.deepEqual(inspectStations(catalogue,'catalogue'),[]);
 for(const c of cases)assert.ok(normalize(c.query).length>=2,c.country);
 for(const country of new Set(catalogue.map(s=>s.country))){const s=catalogue.find(s=>s.country===country);assert.ok(searchStations(catalogue,s.name,100).some(t=>t.name===s.name),country);}
 for(const [native,ascii] of [['Łódź','Lodz'],['København','Kobenhavn'],['Reykjavík','Reykjavik'],['İstanbul','Istanbul']])assert.equal(normalize(native),normalize(ascii));
});

test('Greek, Cyrillic and Georgian station names remain distinct in search, matching and notice merging',()=>{
 for(const [a,b] of [['София','Сердика'],['Αθήνα','Πειραιάς'],['Київ','Бориспіль'],['თბილისი','ვარკეთილი']]){
  const stop=name=>({id:'local:'+name,name,dbId:'',lat:42.7,lon:23.32,search:normalize(name),key:normalize(name)}),x=stop(a),y=stop(b);
  assert.notEqual(normalize(a),normalize(b));assert.equal(sameStation(x,y),false);assert.equal(sameVrrStation(x,y),false);
  assert.equal(sameStation(x,{...x,id:'another-source'}),true);
  assert.equal(sameStation({...x,id:'osm:node/1'},y),false);
  assert.deepEqual(searchStations([x,y],a).map(s=>s.name),[a]);
  assert.equal(mergeNotices([[{id:'a',kind:'notice',title:a,text:a,scope:a},{id:'b',kind:'notice',title:b,text:b,scope:b}]]).length,2);
 }
 const empty=name=>({name,dbId:'',lat:42.7,lon:23.32});assert.equal(sameStation(empty('---'),empty('???')),false);assert.equal(sameVrrStation(empty('---'),empty('???')),false);
});

test('Actual Stockholm EFA reply retains Swedish global IDs and never labels opaque foreign IDs as German',()=>{
 const raw=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/efa-stockholm-stops.json.gz',import.meta.url)))),stops=parseVrrStations(raw,EFA_PROVIDER);
 const central=stops.find(s=>s.efaId==='80012823'),airport=stops.find(s=>s.efaId==='se:33001:nvbw_bus_9689');
 assert.ok(central);assert.equal(central.country,'');assert.equal(central.lat,59.330014);
 assert.ok(airport);assert.equal(airport.country,'SE');assert.equal(airport.dbId,'');assert.equal(airport.id,'efa:'+airport.efaId);
 assert.ok(stops.some(s=>s.country==='DE'),'German namesakes remain available');
});

test('Real Amsterdam map stop and provider station spelling resolve only within the existing small station area',()=>{
 const f=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/transitous-amsterdam-local.json.gz',import.meta.url))));
 const parsed=parseTransitousJourneys(f.plan,f.from,f.to,f.requested);assert.equal(parsed.journeys.length,4);assert.equal(parsed.journeys[0].legs[0].line,'21');
 assert.equal(sameStation(f.from,{...f.from,name:'Amsterdam, Centraal Station'}),true);
 for(const change of [{name:'Amsterdam, Zuid Station'},{name:'Amsterdam, Centraal Station',lat:f.from.lat+.01},{name:'Rotterdam, Centraal Station'}])assert.equal(sameStation(f.from,{...f.from,...change}),false);
});

test('A viewport response over the memory cap does not pause line requests for another city',async t=>{
 const module=await import('../lib/transitous.mjs?europe-size-scope');let calls=0,cancelled=false;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return calls===1?new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(8*1024*1024+1));},cancel(){cancelled=true;}})):Response.json({routes:[],polylines:[]});});
 await assert.rejects(module.fetchTransitousRoutes([47.3649,8.5237,47.3889,8.5597]),e=>e.responseTooLarge===true&&e.code==='SOURCE_RESPONSE_INVALID');
 assert.equal(cancelled,true);await module.fetchTransitousRoutes([52.51,13.38,52.53,13.42]);assert.equal(calls,2);
});

test('Oversized stop responses also leave other city requests available',async t=>{
 const module=await import('../lib/transitous.mjs?europe-stop-size-scope');let calls=0;
 t.mock.method(globalThis,'fetch',async()=>++calls===1?new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(4*1024*1024+1));}})):Response.json([]));
 await assert.rejects(module.fetchTransitousStops([47.36,8.52,47.39,8.56],['bus']),e=>e.responseTooLarge===true);
 await module.fetchTransitousStops([52.51,13.38,52.53,13.42],['bus']);assert.equal(calls,2);
});

test('Zoom limitations and source attribution survive the shared network merge',()=>{
 const bounds=[37.108,-7.69,37.145,-7.62],raw=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/transitous-tavira-routes.json.gz',import.meta.url))));raw.zoomFiltered=true;
 const lines=parseTransitousRoutes(raw,bounds,['bus']),primary=parseTransitousNetwork([],bounds,['bus']);primary.source='Regional source';delete primary.attributions;
 const result=mergeNetworkStops(primary,lines,['bus']);assert.match(result.warning,/Zoomstufe/);assert.equal(result.warningScope,'lines');assert.ok(result.attributions.some(a=>a.url==='https://transitous.org/sources/'));
});

test('Malformed network inputs return HTTP 400 with Pages CORS and make no upstream requests',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('unexpected upstream request');});
 for(const params of [{bbox:'52,13,51,14',modes:'bus'},{bbox:'52,13,52.01,13.01',modes:'unknown'},{bbox:'52,13,52.01,13.01',modes:'bus',detail:'unknown'}]){
  const r=await handleApi(new Request('https://railatlas.example/api/network?'+new URLSearchParams(params),{headers:{Origin:'https://dunkelst.github.io'}}));assert.equal(r.status,400);assert.equal(r.headers.get('access-control-allow-origin'),'https://dunkelst.github.io');assert.ok((await r.json()).error);
 }
 assert.equal(calls,0);
});

test('Provider time offsets preserve a common UTC instant across Western, Central and Eastern Europe',()=>{
 for(const [clock,offset] of [['080000',0],['090000',60],['100000',120],['110000',180]])assert.equal(hafasTime('20261031',clock,offset),'2026-10-31T08:00:00.000Z');
 assert.equal(hafasTime('20261031','01003000',0),'2026-11-01T00:30:00.000Z');
});
