import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseTransitousStation,fetchTransitousStops} from '../lib/transitous.mjs';
import {parseTransitousNetwork,parseEfaNetwork,mergeNetworkStops} from '../lib/network.mjs';
import {sameStation} from '../lib/journey.mjs';
import {getVrrJourney,parseVrrStation,sameVrrStation} from '../lib/vrr.mjs';
import {handleApi} from '../lib/api.mjs';
import {validateChain} from '../lib/rail.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/transitous-heilbronn-sample.json',import.meta.url))),bbox=[49.138,9.224,49.147,9.243];let step=0;
function clock(t){let now=Date.parse('2026-10-26T08:00:00Z')+(step++)*600000;t.mock.method(Date,'now',()=>now);return delta=>now+=delta;}

test('GTFS map stops retain canonical identities, product layers and attribution without inferred geometry or countries',()=>{
 const data=parseTransitousNetwork(sample.stops,bbox,['rail','suburban','subway','tram','bus']);assert.equal(data.layers.bus.stops.length,7);assert.equal(data.layers.rail.stops.length,1);
 assert.ok(Object.values(data.layers).every(l=>l.lines.length===0));assert.ok(data.attributions.some(a=>a.url==='https://transitous.org/sources/'));
 const s=data.layers.bus.stops.find(s=>s.name==='Heilbronn Karmeliterstraße').station;assert.equal(s.id,'transitous:de-DELFI_de:08121:99:0:0');assert.equal(s.transitousId,'de-DELFI_de:08121:99:0:0');assert.equal(s.dbId,'');assert.equal(s.efaId,undefined);assert.equal(s.country,'');
 assert.equal(parseTransitousStation({...sample.stops[0],name:'Amsterdam Centraal'}).country,'','A German feed may contain foreign stops');
 assert.equal(parseTransitousStation({...sample.stops[0],lat:NaN}),null);assert.equal(parseTransitousNetwork([...sample.stops,...sample.stops],bbox,['bus']).layers.bus.stops.length,7);
});

test('Common network API uses one stable stop query and needs no regional or journey request for stops-only',async t=>{
 clock(t);let calls=0;t.mock.method(globalThis,'fetch',async(url,init)=>{calls++;const u=new URL(url);assert.equal(u.origin,'https://api.transitous.org');assert.equal(u.pathname,'/api/v6/map/stops');assert.equal(u.searchParams.get('modes'),'BUS,COACH');assert.equal(u.searchParams.get('grouped'),'true');assert.match(init.headers['User-Agent'],/RailAtlas-Europa\/\d+.*github.com\/dunkelst\/railatlas-europe/);return Response.json(sample.stops);});
 const r=await handleApi(new Request('https://railatlas.example/api/network?'+new URLSearchParams({bbox:bbox.join(','),modes:'bus',detail:'stops'})));assert.equal(r.status,200);const d=await r.json();assert.equal(d.layers.bus.stops.length,7);assert.equal(calls,1);assert.match(d.source,/Transitous/);
});

test('Overlapping feeds share one physical marker without collapsing platforms from the same feed or losing source IDs',()=>{
 const first=sample.stops.find(s=>s.name==='Heilbronn Karmeliterstraße'),other={...first,stopId:'another-feed_local-stop',name:'Karmeliterstraße'},platform={...first,stopId:first.stopId+'-opposite',lat:first.lat+.0001};
 const d=parseTransitousNetwork([first,other,platform],bbox,['bus']);assert.equal(d.layers.bus.stops.length,2);assert.equal(d.layers.bus.stops[0].lat,first.lat);assert.deepEqual(d.layers.bus.stops[0].station.transitousIds,[first.stopId,other.stopId]);assert.equal(d.layers.bus.stops[1].station.transitousId,platform.stopId);
});

test('Regional line failure preserves international stops and never starts a slow OSM fallback',async t=>{
 clock(t);const module=await import('../lib/network.mjs?motis-partial');let calls=0;
 t.mock.method(globalThis,'fetch',async url=>{calls++;const u=new URL(url);if(u.hostname==='api.transitous.org')return Response.json(sample.stops);assert.equal(u.hostname,'www.efa.de');return new Response('busy',{status:503});});
 const d=await module.fetchNetwork(bbox,['bus']);assert.equal(d.layers.bus.stops.length,7);assert.equal(d.layers.bus.lines.length,0);assert.match(d.warning,/Linienauskunft/);assert.equal(calls,2);
});

test('Merging regional labels preserves primary coordinates and identities and retains genuinely different stops',()=>{
 const primary=parseTransitousNetwork(sample.stops,bbox,['bus']),raw=sample.stops.find(s=>s.name==='Heilbronn Karmeliterstraße'),stop={id:'de:08121:99',type:'stop',name:raw.name,coord:[raw.lat+.00001,raw.lon],productClasses:[5]},regional=parseEfaNetwork([stop,{...stop,id:'de:08121:999',name:'Anderer Halt'}],[],{},bbox,['bus']);
 regional.layers.bus.stops[0].lines=['Testlinie'];const before=JSON.stringify(primary),merged=mergeNetworkStops(primary,regional,['bus']);assert.equal(merged.layers.bus.stops.length,8);
 const combined=merged.layers.bus.stops.find(s=>s.station.transitousId===raw.stopId);assert.equal(combined.lat,raw.lat);assert.equal(combined.station.efaId,undefined);assert.deepEqual(combined.lines,['Testlinie']);assert.equal(JSON.stringify(primary),before);
});

test('An international source outage retains confirmed regional stops with a visible source warning',async t=>{
 clock(t);const module=await import('../lib/network.mjs?motis-regional-fallback'),raw=JSON.parse(fs.readFileSync(new URL('./fixtures/efa-map-welsede-stops.json',import.meta.url)));
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);if(u.hostname==='api.transitous.org')return new Response('busy',{status:503});assert.equal(u.hostname,'www.efa.de');return Response.json(raw);});
 const d=await module.fetchNetwork([51.99572,9.3293,52.00299,9.35194],['bus'],undefined,'stops');assert.equal(d.layers.bus.stops.length,2);assert.match(d.source,/EFA/);assert.equal(d.warningScope,'all');assert.match(d.warning,/europäische Haltestellenquelle/);assert.ok(d.layers.bus.stops.every(s=>s.station.efaId));
});

test('Rate limits respect Retry-After on the international stop source',async t=>{
 const advance=clock(t);let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return calls===1?new Response('limited',{status:429,headers:{'Retry-After':'120'}}):Response.json(sample.stops);});
 await assert.rejects(fetchTransitousStops(bbox,['bus']),/HTTP 429/);advance(119000);await assert.rejects(fetchTransitousStops(bbox,['bus']),/pausiert/);assert.equal(calls,1);advance(1000);assert.equal((await fetchTransitousStops(bbox,['bus'])).length,7);assert.equal(calls,2);
});

test('Oversized international responses are cancelled before JSON parsing',async t=>{
 clock(t);let cancelled=false;t.mock.method(globalThis,'fetch',async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(4*1024*1024+1));},cancel(){cancelled=true;}})));
 await assert.rejects(fetchTransitousStops(bbox,['bus']),/Zu viele Haltestellendaten/);assert.equal(cancelled,true);
});

test('Transitous map selections resolve through the existing timetable and intermediate-stop validation without forwarding GTFS IDs',async t=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/vrr-duesseldorf-live.json',import.meta.url))),leg=fixture.journeys[0].legs[0],from=parseVrrStation(leg.origin),to=parseVrrStation(leg.destination),map=(s,id)=>({...parseTransitousStation({stopId:id,name:s.name,lat:s.lat,lon:s.lon,modes:['SUBWAY']}),networkMode:'subway'}),a=map(from,'test-origin'),b=map(to,'test-destination'),requested='2026-10-22T07:00:00Z';
 assert.equal(sameStation(a,from),true);assert.equal(sameStation(a,{...from,name:'Köln Hbf',locality:'Köln'}),false);assert.equal(sameStation(b,to),true);assert.equal(sameVrrStation(b,{...to,lat:to.lat+.01}),false);assert.equal(sameStation(b,{...to,name:'Andere Station'}),false);
 const calls=[];t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);calls.push(u);assert.ok(!u.search.includes('test-origin')&&!u.search.includes('test-destination'));
  if(u.pathname.endsWith('XML_STOPFINDER_REQUEST')){const raw=u.searchParams.get('name_sf')===a.name?leg.origin:leg.destination;return Response.json({locations:[{...raw.parent,type:'stop',coord:raw.coord,productClasses:raw.parent.productClasses||raw.productClasses}]});}
  assert.equal(u.searchParams.get('name_origin'),from.vrrId);assert.equal(u.searchParams.get('name_destination'),to.vrrId);return Response.json(fixture);
 });
 const journey=await getVrrJourney(a,b,requested);assert.equal(journey.legs[0].line,'U77');assert.equal(calls.length,3);assert.equal(validateChain([journey],[a,b],[]),true);
});
