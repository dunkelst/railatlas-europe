import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {adoSuggestionStations,parseAdoStation,findAdoStations,adoLocation} from '../lib/ado.mjs';
import {fetchNetwork,parseNetwork,networkRouteInfo,parseAhorroNetwork,mergeNetworkStops} from '../lib/network.mjs';
import {handleApi} from '../lib/api.mjs';
import {localZonedISO} from '../lib/rail.mjs';
const fixture=name=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/'+name+'.json.gz',import.meta.url))));

test('Actual national suggestions contain source identities; selected stations use hydrated coordinates',()=>{
 const f=fixture('ado-national-locations'),locations=adoSuggestionStations(f.suggestions);assert.deepEqual(locations.map(l=>l.code),['MXMCIMCT','MXMCICIU']);
 assert.ok(locations.every(l=>l.countryCode==='MX'&&l.type==='station'));const station=parseAdoStation(f.station);assert.equal(station.adoStationCode,'MXMCIMCT');assert.equal(station.lat,19.43004);assert.equal(station.lon,-99.1139);assert.equal(station.timeZone,'America/Mexico_City');assert.equal(adoLocation(station).type,'stations');
 const foreign=structuredClone(f.suggestions);foreign.locations.forEach(l=>{l.countryCode='US';l.childrenLocations=[];});assert.deepEqual(adoSuggestionStations(foreign),[]);
 const bad=structuredClone(f.station);bad.data.attributes.latitude=49;assert.throws(()=>parseAdoStation(bad));
 const proxy=structuredClone(f.station);proxy.data.attributes.time_zone='America/Guatemala';assert.equal(parseAdoStation(proxy).timeZone,'America/Mexico_City');assert.equal(localZonedISO('2026-11-01T09:00','America/Guatemala'),localZonedISO('2026-11-01T09:00','America/Mexico_City'));
});

test('National lookup uses the exact public retailer/language parameters and survives a single failed station',async t=>{
 const f=fixture('ado-national-locations'),calls=[];t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);calls.push(u);if(u.pathname.endsWith('/locations')){assert.equal(u.searchParams.get('rpn'),'343401');assert.equal(u.searchParams.get('locale'),'es');assert.equal(u.searchParams.get('limitTopLevel'),'6');return Response.json(f.suggestions);}if(u.pathname.endsWith('/MXMCIMCT')){assert.equal(u.searchParams.get('retailer_partner_number'),'343401');return Response.json(f.station);}if(u.pathname.endsWith('/MXMCICIU'))return new Response('unavailable',{status:503});if(u.hostname==='photon.komoot.io')return Response.json({features:[]});return Response.json([]);});
 const stations=await findAdoStations('Mexico');assert.equal(stations.length,1);assert.equal(stations[0].adoStationCode,'MXMCIMCT');assert.equal(calls.length,3);
 const before=calls.length;assert.equal((await findAdoStations('Mexico')).length,1);assert.equal(calls.length,before);
 const response=await handleApi(new Request('https://railatlas.test/api/stations?region=mexico&q=TAPO'));assert.equal(response.status,200);assert.ok((await response.json()).stations.some(s=>s.adoStationCode==='MXMCIMCT'));
 const aborted=new AbortController();aborted.abort();await assert.rejects(findAdoStations('Mexico',aborted.signal),{name:'AbortError'});
});

test('Mapped CL identifiers retain opposite directions and exact source memberships at central stops',async()=>{
 const metadata=fixture('osm-playa-route-metadata'),routes=metadata.elements.filter(r=>r.tags.ref==='CL05').map(networkRouteInfo);assert.equal(routes.length,2);assert.notEqual(routes[0].id,routes[1].id);assert.deepEqual(new Set(routes.map(r=>r.to)),new Set(['Centro 30','Cristo Rey']));
 const data=await fetchNetwork([19.9,-88,21.5,-86.3],['colectivo','bus'],undefined,'overview',false,'mexico');assert.equal(data.layers.colectivo.lines.length,39);assert.equal(new Set(data.layers.colectivo.lines.map(l=>l.ref)).size,23);
 const hub=data.layers.colectivo.stops.find(s=>s.id==='node/13479430519');assert.ok(hub.servingRoutes.some(r=>r.ref==='CL05'&&r.to));assert.ok(hub.servingRoutes.every(r=>r.mode==='colectivo'&&r.operator&&r.sourceUrl));assert.equal(new Set(hub.servingRoutes.map(r=>r.id)).size,hub.servingRoutes.length);
 for(const route of hub.servingRoutes){const relation=metadata.elements.find(r=>'relation/'+r.id===route.id);assert.ok(relation.members.some(m=>m.type+'/'+m.ref===hub.id&&/^(stop|platform)(_|$)/.test(m.role)));}
 const busHub=data.layers.bus.stops.find(s=>s.id===hub.id);assert.ok(!busHub?.lines.some(ref=>/^CL/.test(ref)),'A generic bus-stop tag cannot mislabel collective memberships as ordinary bus lines');
});

test('Shared OSM parser preserves route metadata and combines entry/exit roles of a repeated source stop',()=>{
 const f=fixture('osm-playa-colectivos'),relation=f.elements.find(e=>e.type==='relation'&&e.tags.ref==='CL05'),member=relation.members.find(m=>m.type==='node'&&/^(stop|platform)/.test(m.role||'')),node=f.elements.find(e=>e.type==='node'&&e.id===member.ref);assert.ok(node);
 const copy=structuredClone(relation);copy.members=[{type:'node',ref:node.id,role:'stop_entry_only'},{type:'node',ref:node.id,role:'stop_exit_only'}];const data=parseNetwork({elements:[node,copy]},[20.62,-87.08,20.635,-87.065],['colectivo']);const stop=data.layers.colectivo.stops[0];assert.ok(stop);assert.equal(stop.servingRoutes.length,1);assert.equal(stop.servingRoutes[0].boardingAllowed,true);assert.equal(stop.servingRoutes[0].alightingAllowed,true);
});

test('Actual Oriente maps retain supplied geometry, five physical stops and separate outward/return references',()=>{
 const f=fixture('ahorrobus-riviera');const outward=parseAhorroNetwork(f.cases[0].raw,'608','2026-10-31'),back=parseAhorroNetwork(f.cases[1].raw,'609','2026-10-31'),a=outward.layers.bus.lines[0],b=back.layers.bus.lines[0];assert.equal(a.segments.flat().length,1086);assert.equal(b.segments.flat().length,1103);assert.equal(a.operator,'ORIENTE');assert.equal(a.from,b.to);assert.equal(a.to,b.from);
 const merged=mergeNetworkStops(outward,back,['bus']);assert.equal(merged.layers.bus.lines.length,2);assert.equal(merged.layers.bus.stops.length,5);const playa=merged.layers.bus.stops.find(s=>s.name==='PLAYA DEL CARMEN');assert.deepEqual(new Set(playa.servingRoutes.map(r=>r.ref)),new Set(['608','609']));assert.equal(playa.lat,20.62274544014493);assert.ok(playa.station.timetableStatus==='unverified');assert.ok(!('departure' in a));
 assert.throws(()=>parseAhorroNetwork(f.cases[0].raw,'609','2026-10-31'));const bad=structuredClone(f.cases[0].raw),detail=JSON.parse(bad.detalleLineaResponse);detail.outTrip.features[0].geometry.coordinates[0][0]=[9,49];bad.detalleLineaResponse=JSON.stringify(detail);assert.throws(()=>parseAhorroNetwork(bad,'608','2026-10-31'));
});
