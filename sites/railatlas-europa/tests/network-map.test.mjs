import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {parseEfaNetwork,networkRequestBounds,containsBounds,networkCovers,networkInView,visibleNetworkSegments} from '../lib/network.mjs';
import {handleApi} from '../lib/api.mjs';
const bbox=[51.99572,9.3293,52.00299,9.35194],baseTime=Date.parse('2026-10-26T08:00:00Z');let step=0;
const read=(name,gzip=false)=>JSON.parse(gzip?gunzipSync(fs.readFileSync(new URL('./fixtures/'+name+'.json.gz',import.meta.url))):fs.readFileSync(new URL('./fixtures/'+name+'.json',import.meta.url)));
const stops=()=>read('efa-map-welsede-stops'),lines=()=>read('efa-map-welsede-lines'),geometry=()=>read('efa-map-welsede-geometry',true);
function clock(t){let now=baseTime+(step++)*600000;t.mock.method(Date,'now',()=>now);return delta=>now+=delta;}
function mockMap(t,override){const calls=[];t.mock.method(globalThis,'fetch',async(url,init)=>{const u=new URL(url);calls.push(u);if(override){const result=await override(u,init);if(result)return result;}
 if(u.hostname==='api.transitous.org')return Response.json([]);
 assert.equal(u.hostname,'www.efa.de');
 if(u.pathname.endsWith('XML_COORD_REQUEST'))return Response.json(stops());
 if(u.pathname.endsWith('XML_SERVINGLINES_REQUEST')){assert.equal(u.searchParams.get('type_sl'),'stopID');assert.ok(['de:03252:4450','de:03252:4440'].includes(u.searchParams.get('name_sl')));return Response.json(lines());}
 assert.ok(u.pathname.endsWith('XML_GEOOBJECT_REQUEST'));assert.deepEqual(u.searchParams.getAll('line'),lines().lines.map(l=>l.id));return Response.json(geometry());
 });return calls;}

test('Real Welsede map data produces general bus lines and selectable source stops without journey data',async t=>{
 clock(t);const calls=mockMap(t);
 const r=await handleApi(new Request('https://railatlas.example/api/network?'+new URLSearchParams({bbox:bbox.join(','),modes:'bus'})));assert.equal(r.status,200);const data=await r.json();
 assert.match(data.source,/EFA/);assert.deepEqual(data.layers.bus.lines.map(l=>l.ref).sort(),['40','45']);assert.equal(data.layers.bus.stops.length,2);assert.ok(data.layers.bus.lines.every(l=>l.segments.length>0));assert.ok(data.layers.rail.lines.length===0);
 const stop=data.layers.bus.stops.find(s=>s.station.efaId==='de:03252:4450');assert.ok(stop);assert.equal(stop.station.id,'efa:de:03252:4450');assert.equal(stop.station.dbId,'');assert.equal(stop.station.vrrId,undefined);assert.ok(!stop.id.startsWith('osm:'));
 assert.ok(calls.every(u=>!u.pathname.includes('TRIP')&&!u.pathname.includes('mgate')),'The independent network never computes a journey');assert.equal(calls.length,5);
});

test('Map geometry keeps source fragments and uses authoritative line metadata instead of generic GeoObject class zero',()=>{
 const g=geometry();assert.ok(g.transportations.every(t=>t.product.class===0));
 const data=parseEfaNetwork(stops().locations,lines().lines,g,bbox,['rail','suburban','subway','tram','bus']);assert.equal(data.layers.bus.lines.length,2);assert.equal(data.layers.rail.lines.length,0);assert.equal(data.layers.subway.lines.length,0);
 const originalPoints=new Set(g.transportations.flatMap(t=>t.coords).flatMap(seq=>seq).map(p=>JSON.stringify(p)));
 assert.ok(data.layers.bus.lines.flatMap(l=>l.segments).flat().every(p=>originalPoints.has(JSON.stringify(p))),'No points or station chords are invented');
 assert.equal(parseEfaNetwork(stops().locations,[],g,bbox,['bus']).layers.bus.lines.length,0,'Unmatched source IDs are not accepted');
 const broken=geometry();broken.transportations[0].coords='invalid';assert.doesNotThrow(()=>parseEfaNetwork(stops().locations,lines().lines,broken,bbox,['bus']));
});

test('Stable viewport cells contain the view, reuse covered data and reject missing modes',()=>{
 const b=networkRequestBounds(bbox);assert.ok(containsBounds(b,bbox));assert.deepEqual(networkRequestBounds(bbox.map(x=>x+0.000001)),b);
 const data={bounds:b,modes:['bus','tram']};assert.equal(networkCovers(data,bbox,['bus']),true);assert.equal(networkCovers(data,bbox,['subway']),false);assert.equal(networkCovers(data,[52.1,9.3,52.2,9.4],['bus']),false);
 assert.throws(()=>networkRequestBounds([30,-10,70,30]));
});

test('Visible network excludes cached off-screen objects while retaining canonical stops and source fragments',()=>{
 const data=parseEfaNetwork(stops().locations,lines().lines,geometry(),bbox,['bus']);
 const original=JSON.stringify(data),view=[51.997,9.339,51.999,9.342];
 const visible=networkInView(data,view);
 assert.equal(data.layers.bus.stops.length,2);assert.equal(visible.layers.bus.stops.length,1);
 assert.equal(visible.layers.bus.stops[0].station.efaId,'de:03252:4450');assert.equal(visible.layers.bus.stops[0],data.layers.bus.stops[0]);
 assert.equal(visible.layers.bus.lines.length,2);assert.equal(JSON.stringify(data),original,'Panning must not shrink the cached source data');
 const elsewhere=networkInView(data,[52.1,9.3,52.2,9.4]);assert.equal(elsewhere.layers.bus.lines.length,0);assert.equal(elsewhere.layers.bus.stops.length,0);
 const back=networkInView(data,bbox);assert.deepEqual(back.layers.bus,data.layers.bus);
});

test('Visibility requires an actual edge crossing and preserves separate source fragments without creating points',()=>{
 const view=[0,0,1,1];
 assert.deepEqual(visibleNetworkSegments([[[-1,.5],[.5,2]]],view),[],'Overlapping edge bounding boxes alone do not establish visibility');
 const fragments=[[[.25,-1],[.25,2]],[[.75,-1],[.75,2]]];assert.deepEqual(visibleNetworkSegments(fragments,view),fragments);
 assert.deepEqual(visibleNetworkSegments([[[0,-1],[0,2]]],view),[[[0,-1],[0,2]]],'Source edges on the boundary remain visible');
});

test('Stops-only activation avoids geometry calls and a cached containing area avoids new upstream requests',async t=>{
 clock(t);const module=await import('../lib/network.mjs?stops-cache'),calls=mockMap(t);
 const data=await module.fetchNetwork(bbox,['bus'],undefined,'stops');assert.equal(data.layers.bus.stops.length,2);assert.equal(data.layers.bus.lines.length,0);assert.equal(calls.length,2);
 await module.fetchNetwork([bbox[0]+.0001,bbox[1]+.0001,bbox[2]-.0001,bbox[3]-.0001],['bus'],undefined,'stops');assert.equal(calls.length,2);
 const full=await module.fetchNetwork(bbox,['bus']);assert.equal(full.layers.bus.lines.length,2);assert.ok(calls.length>1,'Enabling lines cannot reuse a stops-only result');
});

test('An EFA map outage can use the existing independent OSM source',async t=>{
 clock(t);const module=await import('../lib/network.mjs?source-fallback');let osm=0;
 t.mock.method(globalThis,'fetch',async url=>{if(['www.efa.de','api.transitous.org'].includes(new URL(url).hostname))return new Response('busy',{status:503});osm++;return Response.json({elements:[{type:'node',id:1,lat:51.998,lon:9.34,tags:{highway:'bus_stop',name:'OSM source stop'}}]});});
 const data=await module.fetchNetwork(bbox,['bus']);assert.match(data.source,/OpenStreetMap/);assert.equal(data.layers.bus.stops[0].name,'OSM source stop');assert.equal(osm,1);
});

test('Zooming into a partial overview fetches closer data while small pans still reuse it',async t=>{
 clock(t);const module=await import('../lib/network.mjs?zoom-cache'),calls=mockMap(t);
 const broad=[51.98,9.30,52.02,9.37];await module.fetchNetwork(broad,['bus'],undefined,'stops');assert.equal(calls.length,2);
 assert.equal(networkCovers({bounds:broad,modes:['bus']},bbox,['bus']),false);
 await module.fetchNetwork(bbox,['bus'],undefined,'stops');assert.equal(calls.length,4,'A closer query must not remain trapped in an incomplete large cache entry');
 await module.fetchNetwork([51.996,9.33,52.002,9.35],['bus'],undefined,'stops');assert.equal(calls.length,4);
});

test('Explicit map refresh passes through the common API and bypasses its data cache',async t=>{
 clock(t);const calls=mockMap(t),url='https://railatlas.example/api/network?'+new URLSearchParams({bbox:bbox.join(','),modes:'bus',detail:'stops'});
 assert.equal((await handleApi(new Request(url))).status,200);assert.equal(calls.length,2);
 assert.equal((await handleApi(new Request(url))).status,200);assert.equal(calls.length,2);
 assert.equal((await handleApi(new Request(url+'&refresh=1'))).status,200);assert.equal(calls.length,4);
});

test('Explicit refresh also bypasses the independent OSM cache',async t=>{
 clock(t);const module=await import('../lib/network.mjs?osm-refresh');let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({elements:[]});});
 await module.fetchOsmNetwork(bbox,['bus']);await module.fetchOsmNetwork(bbox,['bus']);assert.equal(calls,1);
 await module.fetchOsmNetwork(bbox,['bus'],undefined,true);assert.equal(calls,2);
});

test('A line-geometry outage preserves real stops with an explicit partial-data warning',async t=>{
 clock(t);const module=await import('../lib/network.mjs?geometry-failure');const calls=mockMap(t,u=>u.pathname.endsWith('XML_GEOOBJECT_REQUEST')||u.hostname===new URL(module.OVERPASS_URL).hostname?new Response('down',{status:503}):null);
 const data=await module.fetchNetwork(bbox,['bus']);assert.equal(data.layers.bus.stops.length,2);assert.equal(data.layers.bus.lines.length,0);assert.match(data.warning,/Halte bleiben sichtbar/);assert.match(data.warning,/OSM-Abfrage/);assert.ok(calls.some(u=>u.hostname===new URL(module.OVERPASS_URL).hostname));
});

test('User abort cancels map retrieval without falling through to another source',async t=>{
 clock(t);const module=await import('../lib/network.mjs?map-abort'),controller=new AbortController();let calls=0;
 t.mock.method(globalThis,'fetch',(_url,init)=>new Promise((_resolve,reject)=>{calls++;init.signal.addEventListener('abort',()=>reject(new DOMException('Abgebrochen','AbortError')),{once:true});}));
 const first=assert.rejects(module.fetchNetwork(bbox,['bus'],controller.signal),{name:'AbortError'});controller.abort();await first;assert.equal(calls,2);
});

test('Map rate-limit cooldown respects the provider Retry-After duration',async t=>{
 const advance=clock(t),module=await import('../lib/network.mjs?map-rate');let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return calls===1?new Response('limited',{status:429,headers:{'Retry-After':'120'}}):Response.json(stops());});
 await assert.rejects(module.fetchEfaNetwork(bbox,['bus'],undefined,'stops'),/HTTP 429/);
 advance(119000);await assert.rejects(module.fetchEfaNetwork(bbox,['bus'],undefined,'stops'),/pausiert/);assert.equal(calls,1);
 advance(1000);assert.equal((await module.fetchEfaNetwork(bbox,['bus'],undefined,'stops')).layers.bus.stops.length,2);assert.equal(calls,2);
});
