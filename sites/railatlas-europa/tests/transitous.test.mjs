import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseTransitousStation,fetchTransitousStops} from '../lib/transitous.mjs';
import {parseTransitousNetwork,parseEfaNetwork,mergeNetworkStops} from '../lib/network.mjs';
import {sameStation} from '../lib/journey.mjs';
import {getVrrJourney,parseVrrStation,sameVrrStation,EFA_PROVIDER} from '../lib/vrr.mjs';
import {handleApi} from '../lib/api.mjs';
import {validateChain} from '../lib/rail.mjs';
import {gunzipSync} from 'node:zlib';
import {parseTransitousJourneys} from '../lib/transitous.mjs';
import {getTimetableJourneys} from '../lib/timetable.mjs';
const plan=()=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/transitous-heilbronn-roemer-plan.json.gz',import.meta.url))));
const endpoints=()=>{const d=plan();return [d.from,d.to].map(s=>({...parseTransitousStation(s),networkMode:'bus'}));};
const requested='2026-10-26T19:51:00Z';
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

test('Actual Friedhof to Römerstraße plans retain three full journeys, Bus 11/32, source walking paths and realtime',()=>{
 const [a,b]=endpoints(),parsed=parseTransitousJourneys(plan(),a,b,requested);
 assert.equal(parsed.journeys.length,3);const j=parsed.journeys[1];assert.deepEqual(j.legs.map(l=>l.line),['11','Fußweg','32']);assert.equal(j.departure,'2026-10-26T20:09:00.000Z');assert.equal(j.arrival,'2026-10-26T20:33:00.000Z');assert.equal(j.transfers,1);assert.ok(j.legs.some(l=>l.realtime));
 assert.ok(j.legs.filter(l=>!l.walking).every(l=>l.geometry.status==='missing'&&!l.geometry.segments.length));assert.equal(j.legs[1].geometry.status,'complete');assert.ok(j.legs.at(-1).stopovers.length>5);assert.equal(validateChain([j],[a,b],[]),true);assert.ok(j.attributions.some(a=>a.url==='https://transitous.org/sources/'));
 assert.equal(parseTransitousJourneys(plan(),{...a,name:'Fremder Halt'},b,requested).journeys.length,0);assert.equal(parseTransitousJourneys(plan(),a,{...b,lat:b.lat+.01},requested).journeys.length,0);
});

test('Unusable MOTIS alternatives preserve exclusions and cannot bypass cancellations, times, geometry or dataset validity',()=>{
 const [a,b]=endpoints();
 for(const mutate of [j=>j.legs[1].cancelled=true,j=>j.legs[1].from.pickupType='NOT_ALLOWED',j=>j.legs[1].to.dropoffType='NOT_ALLOWED',j=>j.legs[1].startTime='2026-10-26T19:59:00Z',j=>j.legs[1].endTime='2026-10-26T19:59:00Z',j=>j.legs[1].from.lat+=.01,j=>j.legs[0].legGeometry.points='',j=>j.legs[0].endTime=j.legs[0].startTime,j=>j.legs[1].loopedCalendarSince='2026-10-01',j=>j.legs[1].mode='UNSUPPORTED']){
  const d=plan();d.itineraries=d.itineraries.slice(0,1);mutate(d.itineraries[0]);assert.equal(parseTransitousJourneys(d,a,b,requested).journeys.length,0);
 }
 const d=plan();d.itineraries=d.itineraries.slice(0,1);d.itineraries[0].legs[1].alerts=[{headerText:'Bus fällt aus',descriptionText:'Diese Fahrt entfällt.',effect:'NO_SERVICE',severityLevel:'SEVERE',impactPeriod:[{start:'2026-10-26T19:00:00Z',end:'2026-10-26T23:00:00Z'}]}];
 const result=parseTransitousJourneys(d,a,b,requested);assert.equal(result.journeys.length,0);assert.equal(result.notices[0].kind,'cancellation');
 d.itineraries[0].legs[1].alerts[0].impactPeriod[0].end='2026-10-26T19:01:00Z';assert.equal(parseTransitousJourneys(d,a,b,requested).journeys.length,1);
});

test('Coordinate access keeps the selected point within 30 metres for typed or intermediate stops',()=>{
 const [a,b]=endpoints(),d=plan();d.itineraries=d.itineraries.slice(0,1);const raw=d.itineraries[0].legs[0].from;delete raw.stopId;raw.vertexType='NORMAL';raw.name='Startpunkt';
 assert.equal(parseTransitousJourneys(d,a,b,requested).journeys.length,1);raw.lat+=.0005;assert.equal(parseTransitousJourneys(d,a,b,requested).journeys.length,0);
});

test('Automatic common API falls back to the existing GTFS identities after name resolvers fail, before DB',async t=>{
 const [a,b]=endpoints(),calls=[];t.mock.method(Date,'now',()=>Date.parse('2026-10-26T19:00:00Z'));
 t.mock.method(globalThis,'fetch',async(url,init)=>{const u=new URL(url);calls.push(u);if(u.hostname==='fahrplan.oebb.at')return Response.json({err:'OK',svcResL:[{err:'OK',res:{locL:[]}}]});if(u.hostname==='www.efa.de')return Response.json({locations:[]});
  assert.equal(u.hostname,'api.transitous.org');assert.equal(u.pathname,'/api/v6/plan');assert.equal(u.searchParams.get('fromPlace'),a.transitousId);assert.equal(u.searchParams.get('toPlace'),b.transitousId);assert.equal(u.searchParams.get('time'),requested);assert.equal(u.searchParams.get('directModes'),'');assert.equal(u.searchParams.has('radius'),false);assert.match(init.headers['User-Agent'],/RailAtlas-Europa\/25/);return Response.json(plan());
 });
 const response=await handleApi(new Request('https://railatlas.example/api/journeys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:a,to:b,departure:requested,source:'auto'})}));
 assert.equal(response.status,200);const d=await response.json();assert.equal(d.journeys.length,3);assert.deepEqual(d.journeys[1].legs.map(l=>l.line),['11','Fußweg','32']);assert.equal(calls.filter(u=>u.hostname==='api.transitous.org').length,1);assert.equal(calls.some(u=>u.hostname==='int.bahn.de'),false);
});

test('A successful existing source needs no extra European journey query',async t=>{
 const d=JSON.parse(fs.readFileSync(new URL('./fixtures/vrr-duesseldorf-live.json',import.meta.url))),raw=d.journeys[0].legs[0],[a,b]=[raw.origin,raw.destination].map(s=>parseVrrStation(s,EFA_PROVIDER)),calls=[];
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);calls.push(u.hostname);if(u.hostname==='fahrplan.oebb.at')return Response.json({err:'OK',svcResL:[{err:'OK',res:{locL:[]}}]});assert.equal(u.hostname,'www.efa.de');return Response.json(d);});
 const j=await getTimetableJourneys(a,b,'2026-10-22T07:00:00Z');assert.equal(j[0].legs[0].line,'U77');assert.equal(calls.includes('api.transitous.org'),false);
});

test('European journey cache rechecks endpoints; source rate limits pause calls and caller abort remains an abort',async t=>{
 const module=await import('../lib/transitous.mjs?journey-cache'),[a,b]=endpoints();let now=Date.parse('2026-10-26T19:00:00Z'),calls=0;t.mock.method(Date,'now',()=>now);
 t.mock.method(globalThis,'fetch',async()=>{calls++;return calls===1?Response.json(plan()):new Response('limited',{status:429,headers:{'Retry-After':'120'}});});
 assert.equal((await module.getTransitousJourneys(a,b,requested)).length,3);await assert.rejects(module.getTransitousJourneys({...a,name:'Anderer Halt'},b,requested),e=>e.code==='NO_JOURNEY');assert.equal(calls,1);
 now+=31000;await assert.rejects(module.getTransitousJourneys(a,b,requested),/HTTP 429/);now+=119000;await assert.rejects(module.getTransitousJourneys(a,b,requested),/pausiert/);assert.equal(calls,2);
 const controller=new AbortController();controller.abort();await assert.rejects(module.getTransitousJourneys(a,b,requested,controller.signal),{name:'AbortError'});assert.equal(calls,2);
});
