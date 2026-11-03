import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fetchNetwork,networkInView,networkLineExtent,selectNetworkRoute,mergeNetworkStops,parseAhorroNetwork,networkCovers} from '../lib/network.mjs';
import {trenMayaStations} from '../lib/tren-maya.mjs';
import {stationAccess} from '../lib/station-access.mjs';
import {translate} from '../lib/i18n.mjs';

test('An actual operator route keeps its full saved extent after viewport clipping and isolates both road layers',async()=>{
 const f=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/ahorrobus-riviera.json.gz',import.meta.url))));
 const original=parseAhorroNetwork(f.cases[0].raw,'608','2026-10-31'),line=original.layers.bus.lines[0],extent=networkLineExtent(line),view=[20.60,-87.10,20.66,-87.04];
 const cropped=networkInView(original,view),again=networkInView(cropped,view);assert.deepEqual(again.layers.bus.lines[0].extent,extent);assert.ok(again.layers.bus.lines[0].segments.flat().length<line.segments.flat().length);assert.ok(extent[1]<-88.2);
 const complete=await fetchNetwork([extent[0]-.01,extent[1]-.01,extent[2]+.01,extent[3]+.01],['bus','colectivo'],undefined,'overview',false,'mexico');
 const selected=selectNetworkRoute(complete,{id:line.id,mode:'bus'});assert.equal(selected.layers.bus.lines.length,1);assert.equal(selected.layers.bus.stops.length,5);assert.equal(selected.layers.colectivo.lines.length,0);assert.equal(selected.layers.colectivo.stops.length,0);assert.equal(selected.layers.rail,complete.layers.rail);assert.ok(complete.layers.colectivo.lines.length);
 const cl=complete.layers.colectivo.lines.find(l=>l.ref==='CL05'),collective=selectNetworkRoute(complete,{...cl,mode:'colectivo'});assert.equal(collective.layers.colectivo.lines.length,1);assert.equal(collective.layers.bus.lines.length,0);assert.ok(collective.layers.colectivo.stops.every(s=>s.servingRoutes.some(r=>r.id===cl.id)));assert.equal(selectNetworkRoute(complete,null),complete);
 const merged=mergeNetworkStops(cropped,original,['bus']);assert.deepEqual(merged.layers.bus.lines[0].extent,extent);
});

test('Changing active layers cannot reuse a warning from the disabled Metro layer',async t=>{
 const {fetchNetwork:request}=await import('../lib/network.mjs?layer-warning-regression');let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json([]);});
 const bounds=[20.62,-87.08,20.635,-87.065],all=await request(bounds,['subway','bus','colectivo'],undefined,'all',false,'mexico');assert.match(all.warning,/U-Bahn/);assert.equal(networkCovers(all,bounds,['colectivo']),false);
 const previous=calls,colectivo=await request(bounds,['colectivo'],undefined,'all',false,'mexico');assert.equal(calls,previous);assert.ok(!colectivo.warning.includes('U-Bahn'));assert.deepEqual(colectivo.modes,['colectivo']);assert.ok(colectivo.layers.colectivo.lines.length);assert.equal(networkCovers(colectivo,bounds,['colectivo']),true);
 assert.equal(networkCovers({...all,warning:''},bounds,['colectivo']),true,'Geometry without scoped warnings remains reusable');
});

test('Station access guidance uses exact source stations, remains untimed and is translated in DE/EN/ES',()=>{
 const teya=trenMayaStations.find(s=>s.trenMayaId==='15'),cancun=trenMayaStations.find(s=>s.trenMayaId==='22');
 for(const [station,route] of [[teya,'R901'],[cancun,'Conecta']]){const guide=stationAccess(station);assert.ok(guide.title.includes(route));assert.ok(guide.url.startsWith('https://'));for(const key of ['departure','arrival','duration','geometry','legs'])assert.ok(!(key in guide));for(const language of ['en','es'])assert.notEqual(translate(language,guide.text),guide.text);}
 assert.ok(stationAccess({country:'MX',iata:'CUN',lat:21.04,lon:-86.87}));assert.equal(stationAccess({...teya,lat:0}),null);assert.equal(stationAccess({...cancun,country:'US'}),null);assert.equal(stationAccess({...cancun,id:'ado:MXMID',relatedAirport:'MID'}),null);assert.equal(stationAccess({country:'MX',iata:'CUN',lat:23,lon:-100}),null);
 assert.equal(stationAccess(trenMayaStations.find(s=>s.trenMayaId==='21')),null);
});
