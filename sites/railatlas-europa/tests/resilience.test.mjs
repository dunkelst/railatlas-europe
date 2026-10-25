import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {getEfaWalkingJourneys,parseVrrJourneys,EFA_PROVIDER} from '../lib/vrr.mjs';
import {getTimetableJourneys} from '../lib/timetable.mjs';
import {remainingJourneyPoints,berlinSearchDays,walkingMinutes,rankJourneys,distanceKm} from '../lib/rail.mjs';
import {sameStation} from '../lib/journey.mjs';import {handleApi} from '../lib/api.mjs';
const read=(name='efa-rohdental-turmstrasse-walking')=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/'+name+'.json.gz',import.meta.url))));
const from={id:'efa:de:03252:2320',efaId:'de:03252:2320',name:'Rohdenthal, Rohdental',lat:52.200076,lon:9.249135,dbId:''};
const to={id:'osm:node/3961281940',name:'U Turmstraße',locality:'Berlin',networkMode:'bus',lat:52.525547,lon:13.3413274,dbId:''},requested='2026-10-24T21:17:00Z';

test('Actual coordinate reply preserves three pedestrian alternatives, source paths, endpoints and exclusion notices',async t=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json(read()));
 const js=await getEfaWalkingJourneys(from,to,requested,undefined,30);assert.equal(js.length,3);const j=js[0];
 assert.equal(j.departure,'2026-10-26T05:53:00.000Z');assert.equal(j.arrival,'2026-10-26T11:49:00.000Z');assert.equal(walkingMinutes(j),29);assert.equal(j.transfers,3);
 const last=j.legs.at(-1);assert.equal(last.distanceMeters,1179);assert.equal(last.geometry.segments[0].length,88);assert.equal(last.walkingFallback,true);assert.equal(last.to.locationType,'coordinate');assert.equal(last.to.efaId,undefined);assert.equal(last.to.dbId,'');assert.ok(distanceKm(last.to,to)<.01);assert.ok(j.walkingDistanceMeters<1300);
 assert.ok(j.legs.filter(l=>l.walking).every(l=>l.geometry.status==='complete'));assert.ok(j.notices.some(n=>n.scope.startsWith('Verworfener')&&n.title.includes('S51')));assert.ok(!js.some(j=>j.legs.some(l=>l.line==='S51')));
 await assert.rejects(getEfaWalkingJourneys(from,to,requested,undefined,15),/Gehbudgets/);
});

test('Walking options reject missing/chord paths, excessive distance, wrong endpoints, missed connections and cancellations',async t=>{
 let mutate=()=>{};t.mock.method(globalThis,'fetch',async()=>{const d=read();d.journeys=d.journeys.slice(0,1);mutate(d.journeys[0]);return Response.json(d);});
 for(const change of [j=>j.legs.at(-1).coords=[],j=>j.legs.at(-1).coords=[j.legs.at(-1).origin.coord,j.legs.at(-1).destination.coord],j=>j.legs.at(-1).distance=3001,j=>j.legs.at(-1).destination.coord=[52.535,13.341],j=>j.legs.find(l=>l.transportation.product.class===1).origin.departureTimeEstimated='2026-10-26T05:00:00Z',j=>j.tripImpossible=true,j=>j.legs.at(-1).origin.isCancelled=true,j=>j.legs.at(-1).coords[0]=[52.523,13.345]]){mutate=change;await assert.rejects(getEfaWalkingJourneys(from,to,requested,undefined,60),{code:'NO_JOURNEY'});}
 const controller=new AbortController();controller.abort();await assert.rejects(getEfaWalkingJourneys(from,to,requested,controller.signal,30),{name:'AbortError'});
});

test('Only truly empty replies advance the bounded walking search over the DST weekend',async t=>{
 const dates=[];let empty=false,malformed=false;
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);dates.push([u.searchParams.get('itdDate'),u.searchParams.get('itdTime')]);assert.equal(u.searchParams.get('type_origin'),'coord');assert.equal(u.searchParams.get('type_destination'),'coord');assert.equal(u.searchParams.get('trITMOT'),'100');assert.equal(u.searchParams.get('trITMOTvalue'),'30');return Response.json(malformed?{}:empty||dates.length<3?{journeys:[]}:read());});
 await getEfaWalkingJourneys(from,to,requested,undefined,30);assert.deepEqual(dates,[['20261024','2317'],['20261025','0000'],['20261026','0000']]);
 empty=true;await assert.rejects(getEfaWalkingJourneys(from,to,requested,undefined,30),{code:'NO_JOURNEY'});assert.equal(dates.length,6);
 malformed=true;await assert.rejects(getEfaWalkingJourneys(from,to,requested,undefined,30),{code:'SOURCE_RESPONSE_INVALID'});assert.equal(dates.length,7);
 assert.deepEqual(berlinSearchDays(requested),['2026-10-24T23:17:00','2026-10-25T00:00:00','2026-10-26T00:00:00']);
});

test('Automatic comparison requests extra walking only when enabled',async t=>{
 let coordinateCalls=0;
 t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);if(u.hostname==='fahrplan.oebb.at')return Response.json({err:'OK',svcResL:[{err:'OK',res:{locL:[]}}]});if(u.hostname==='int.bahn.de')return Response.json([]);if(u.searchParams.get('type_origin')==='coord'){coordinateCalls++;return Response.json(read());}return Response.json({locations:[]});});
 await assert.rejects(getTimetableJourneys(from,to,requested));assert.equal(coordinateCalls,0);
 const js=await getTimetableJourneys(from,to,requested,'auto',undefined,'arrival',30);assert.equal(js.length,3);assert.equal(js[0].alternativeKind,'walking');assert.equal(coordinateCalls,1);
});

test('Synthetic network: a westbound first ride beats waiting for a direct eastbound train',()=>{
 // Artificial regression network, never a runtime timetable.
 const stop=(id,lon)=>({id:'de:99999:'+id,name:'Test '+id,type:'stop',coord:[52,lon]}),a=stop(10001,9),x=stop(10002,8.9),b=stop(10003,10);
 const leg=(a,b,dep,arr)=>({origin:{...a,departureTimePlanned:'2026-10-26T'+dep+':00Z'},destination:{...b,arrivalTimePlanned:'2026-10-26T'+arr+':00Z'},transportation:{name:'Testzug',product:{class:0}}});
 const data={journeys:[{legs:[leg(a,b,'08:30','09:10')]},{legs:[leg(a,x,'08:00','08:10'),leg(x,b,'08:12','08:40')]}]},station=s=>({name:s.name,efaId:s.id,lat:s.coord[0],lon:s.coord[1]});
 const js=parseVrrJourneys(data,station(a),station(b),'2026-10-26T08:00:00Z',EFA_PROVIDER);assert.equal(js.length,2);const best=rankJourneys(js)[0];assert.equal(best.arrival,'2026-10-26T08:40:00.000Z');assert.equal(best.legs[0].to.efaId,x.id);assert.ok(distanceKm(best.legs[0].to,station(b))>distanceKm(station(a),station(b)));
 data.journeys[1].legs[0].isCancelled=true;assert.equal(parseVrrJourneys(data,station(a),station(b),'2026-10-26T08:00:00Z',EFA_PROVIDER)[0].arrival,'2026-10-26T09:10:00.000Z');
});

test('Replanning keeps remaining vias and dwell, drops completed parts and prevents restarting at the final destination',()=>{
 const point=(id,dwell=20)=>({key:id,text:id,station:{id,dbId:id,name:id,lat:52,lon:9},dwell}),points=[point('8000001'),point('8000002',60),point('8000003',120),point('8000004')],current={id:'8000005',dbId:'8000005',name:'Unterwegs',lat:52,lon:9};
 const next=remainingJourneyPoints(points,1,current,sameStation);assert.deepEqual(next.map(p=>p.station.id),['8000005','8000003','8000004']);assert.equal(next[1].dwell,120);assert.equal(next[0].key,'start');assert.equal(next.at(-1).key,'end');assert.equal(points.length,4);
 assert.deepEqual(remainingJourneyPoints(points,1,points[2].station,sameStation).map(p=>p.station.id),['8000003','8000004']);assert.throws(()=>remainingJourneyPoints(points,2,points[3].station,sameStation),/Reiseziel/);
});

test('The shared API rejects invalid walking budgets before provider access',async()=>{
 for(const input of [{walkingBudget:120},{walkingBudget:'30'},{walkingBudget:30,source:'vrr'}]){const r=await handleApi(new Request('https://railatlas.example/api/journeys',{method:'POST',body:JSON.stringify({from,to,departure:'2026-10-26T00:00:00Z',...input})}));assert.equal(r.status,400);}
});

test('Actual EFA cancellation lists and informative-only flags cannot become usable trains',()=>{
 const all=read(),trip=all.journeys.find(j=>j.legs.some(l=>l.transportation?.number==='S51'));assert.ok(trip);assert.ok(trip.legs.find(l=>l.transportation?.number==='S51').realtimeStatus.includes('TRIP_CANCELLED'));
 delete trip.tripImpossible;delete trip.isRealtimeOnlyInformative;
 assert.equal(parseVrrJourneys({journeys:[trip]},from,to,requested,EFA_PROVIDER,true).length,0,'The status list alone is sufficient');
 for(const mutate of [j=>j.realtimeStatus=['TRIP_CANCELLED','MONITORED'],j=>j.isRealtimeOnlyInformative=true,j=>j.legs[0].origin.realtimeStatus=['TRIP_CANCELLED']]){const d=read();d.journeys=d.journeys.slice(0,1);mutate(d.journeys[0]);assert.equal(parseVrrJourneys(d,from,to,requested,EFA_PROVIDER,true).length,0);}
});

test('Actual first-mile footpath retains its duration/path and calculates an earlier start for boarding reserve',async t=>{
 const d=read('efa-first-mile-walking'),a={id:'osm:test-access',name:'Tannenweg',lat:52.202257,lon:9.247365,dbId:''},b={name:'Hessisch Oldendorf Bahnhof',lat:52.166577,lon:9.244608,dbId:''};
 t.mock.method(globalThis,'fetch',async()=>Response.json(d));
 const js=await getEfaWalkingJourneys(a,b,'2026-10-26T05:00:00Z',undefined,30);assert.ok(js.length>=2);const j=js[0],walk=j.legs[0],bus=j.legs[1];
 assert.equal(walk.distanceMeters,341);assert.equal(walk.geometry.segments[0].length,17);assert.equal(walk.walkingTiming,'calculated');assert.equal(walk.departure,'2026-10-26T05:45:00.000Z');assert.equal(walk.arrival,'2026-10-26T05:51:00.000Z');assert.equal(walk.sourceDeparture,'2026-10-26T05:47:00.000Z');assert.equal(Date.parse(walk.arrival)-Date.parse(walk.departure),360000);assert.equal(Date.parse(bus.departure)-Date.parse(walk.arrival),120000);assert.equal(bus.departure,'2026-10-26T05:53:00.000Z');
 const later=await getEfaWalkingJourneys(a,b,'2026-10-26T05:47:00Z',undefined,30);assert.ok(later.every(j=>Date.parse(j.departure)>=Date.parse('2026-10-26T05:47:00Z')),'The buffer may never move departure before the requested start');
 await assert.rejects(getEfaWalkingJourneys({...a,lat:52.2025,lon:9.2465},b,'2026-10-26T05:00:00Z',undefined,30),{code:'NO_JOURNEY'},'A provider address 65 m from the selected point must not become the requested origin');
});
