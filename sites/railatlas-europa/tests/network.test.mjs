import test from 'node:test';
import assert from 'node:assert/strict';
import {NETWORK_MODES,defaultNetworkLayers,validateBounds,networkMode,networkQuery,geometrySegments,parseNetwork,fetchNetwork} from '../lib/network.mjs';
const bbox=[49.1,9.1,49.2,9.3];
const point=(id,name,tags={})=>({type:'node',id,lat:49.15,lon:9.2,tags:{name,...tags}});
const route=(id,route,ref,stop,extra={})=>({type:'relation',id,tags:{type:'route',route,ref,...extra},members:[{type:'node',ref:stop,role:'stop',lat:49.15,lon:9.2},{type:'way',ref:id+100,role:'',geometry:[{lat:49.14,lon:9.19},{lat:49.15,lon:9.2},null,{lat:49.16,lon:9.21},{lat:49.17,lon:9.22}]}]});

test('rail is enabled by default and all five overlays have independent lines/stops',()=>{
 const layers=defaultNetworkLayers();assert.equal(NETWORK_MODES.length,5);assert.deepEqual(layers.rail,{lines:true,stops:true});assert.deepEqual(layers.bus,{lines:false,stops:false});layers.bus.lines=true;assert.equal(layers.bus.stops,false);assert.equal(defaultNetworkLayers().bus.lines,false);
});
test('commuter railway and U-labelled light rail remain distinct from other trains/trams',()=>{
 assert.equal(networkMode({route:'train',ref:'S 5'}),'suburban');assert.equal(networkMode({route:'train',ref:'RE8'}),'rail');assert.equal(networkMode({route:'train',service:'commuter'}),'suburban');assert.equal(networkMode({route:'light_rail',ref:'U12'}),'subway');assert.equal(networkMode({route:'light_rail',ref:'12'}),'tram');assert.equal(networkMode({route:'trolleybus'}),'bus');assert.equal(networkMode({route:'ferry'}),null);
});
test('null geometry separates fragments instead of adding imaginary straight segments',()=>{
 assert.deepEqual(geometrySegments([{lat:49,lon:9},{lat:49.1,lon:9.1},null,{lat:50,lon:10},{lat:50.1,lon:10.1}]),[[[49,9],[49.1,9.1]],[[50,10],[50.1,10.1]]]);
});
test('a shared rail/S-Bahn station belongs to both overlays, not to bus or subway',()=>{
 const data=parseNetwork({elements:[point(1,'Gemeinsamer Bahnhof',{railway:'station'}),route(10,'train','S5',1)]},bbox,['rail','suburban','subway','bus']);
 assert.equal(data.layers.rail.stops[0].name,'Gemeinsamer Bahnhof');assert.equal(data.layers.suburban.stops[0].name,'Gemeinsamer Bahnhof');assert.deepEqual(data.layers.suburban.stops[0].lines,['S5']);assert.equal(data.layers.suburban.lines[0].segments.length,2);assert.equal(data.layers.bus.stops.length,0);assert.equal(data.layers.subway.stops.length,0);assert.equal(data.coverage,'partial');
});
test('subway and bus stops are typed by explicit tags or membership, outside and disused stops omitted',()=>{
 const data=parseNetwork({elements:[point(1,'U-Bahnhof',{railway:'station',station:'subway'}),point(2,'Bussteig',{highway:'bus_stop'}),{...point(3,'Außerhalb',{highway:'bus_stop'}),lat:50},point(4,'Stillgelegt',{highway:'bus_stop',disused:'yes'}),point(5,'S-Bahn'),route(10,'train','S1',5)]},bbox,['rail','suburban','subway','bus']);
 assert.deepEqual(data.layers.rail.stops,[]);assert.deepEqual(data.layers.bus.stops.map(s=>s.name),['Bussteig']);assert.deepEqual(data.layers.subway.stops.map(s=>s.name),['U-Bahnhof']);assert.equal(data.layers.suburban.stops[0].name,'S-Bahn');
});
test('bbox and mode validation reject continent queries and injected query strings',()=>{
 assert.throws(()=>validateBounds([30,-10,70,30]));assert.throws(()=>networkQuery([49,9,NaN,10],['bus']));assert.throws(()=>networkQuery(bbox,['bus];out;']));assert.throws(()=>networkQuery(bbox,[]));assert.doesNotThrow(()=>networkQuery(bbox,['rail']));
});
test('query crops output, includes relation platform members and limits time/size',()=>{
 const query=networkQuery(bbox,['suburban','subway','tram','bus']);assert.match(query,/out geom\(49.10000,9.10000,49.20000,9.30000\)/);assert.match(query,/node\(r.routes\)/);assert.match(query,/way\(r.routes:"platform"\)/);assert.match(query,/timeout:20/);assert.match(query,/maxsize:16777216/);
});
test('partial Overpass execution is an explicit error, not an empty completed network',()=>{
 assert.throws(()=>parseNetwork({elements:[],remark:'runtime error: Query timed out'},bbox,['bus']),/nicht vollständig/);assert.throws(()=>parseNetwork({},bbox,['bus']),/lesbaren/);assert.equal(parseNetwork({elements:[]},bbox,['bus']).layers.bus.stops.length,0);
});
test('an upstream rate limit pauses further requests instead of retrying on every map move',async t=>{
 const upstream=t.mock.method(globalThis,'fetch',async()=>new Response('busy',{status:429,headers:{'Retry-After':'60'}}));
 await assert.rejects(fetchNetwork(bbox,['bus']),/HTTP 429/);
 await assert.rejects(fetchNetwork(bbox,['subway']),/ausgelastet/);
 assert.equal(upstream.mock.callCount(),1);
});

test('queued requests are not cut off at 25 seconds; timeout is readable and pauses new calls',async t=>{
 const {fetchNetwork:request}=await import('../lib/network.mjs?timeout-regression');
 t.mock.timers.enable({apis:['setTimeout']});
 let signal;
 const upstream=t.mock.method(globalThis,'fetch',(_url,init)=>new Promise((_resolve,reject)=>{signal=init.signal;signal.addEventListener('abort',()=>reject(new DOMException('upstream aborted','AbortError')),{once:true});}));
 const result=assert.rejects(request(bbox,['subway']),/nicht rechtzeitig/);
 t.mock.timers.tick(25000);assert.equal(signal.aborted,false);
 t.mock.timers.tick(15000);await result;
 await assert.rejects(request(bbox,['bus']),/ausgelastet/);
 assert.equal(upstream.mock.callCount(),1);
});
test('user cancellation stays a cancellation and does not impose a provider cooldown',async t=>{
 const {fetchNetwork:request}=await import('../lib/network.mjs?cancel-regression');
 const controller=new AbortController();
 const upstream=t.mock.method(globalThis,'fetch',(_url,init)=>new Promise((_resolve,reject)=>{init.signal.addEventListener('abort',()=>reject(new DOMException('upstream aborted','AbortError')),{once:true});}));
 const first=assert.rejects(request(bbox,['subway'],controller.signal),{name:'AbortError'});controller.abort();await first;
 upstream.mock.mockImplementation(async()=>Response.json({elements:[]}));
 assert.equal((await request(bbox,['subway'])).layers.subway.lines.length,0);
 await assert.rejects(request(bbox,['subway'],controller.signal),{name:'AbortError'});
 assert.equal(upstream.mock.callCount(),2,'Already cancelled calls do not fetch, even with cached data');
});
