import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseVrrJourneys,parseVrrStation,parseVrrNotices,parseVrrStations,sameVrrStation,vrrProduct} from '../lib/vrr.mjs';
const fixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/vrr-duesseldorf-live.json',import.meta.url)));
const raw=fixture().journeys[0].legs[0],from=parseVrrStation(raw.origin),to=parseVrrStation(raw.destination),requested='2026-10-22T07:00:00Z';
test('Actual VRR response preserves U-Bahn, platform groups, source geometry and conservative realtime status',()=>{
 const results=parseVrrJourneys(fixture(),from,to,requested),j=results[0];
 assert.equal(j.legs[0].line,'U77');assert.equal(j.legs[0].mode,'subway');assert.equal(j.departure,'2026-10-22T07:02:30.000Z');
 assert.ok(j.legs[0].geometry.segments[0].length>50);assert.equal(j.legs[0].realtime,false);assert.equal(j.legs[0].platform,'3');
 assert.ok(results.find(j=>j.legs.every(l=>l.walking)),'Source-supplied footpath stays a walk');
 assert.ok(!results.some(j=>j.legs.some(l=>l.line==='U79')),'Unaccounted disruption prevents accepting U79');
 assert.ok(j.notices.every(n=>n.scope.startsWith('Verworfener Verbindungsvorschlag (U79)')),'Exclusion reasons remain visible and cannot be mistaken for the chosen leg');
});
test('Real EFA closure messages retain validity and explicit routing gaps; expired messages disappear',()=>{
 const infos=fixture().journeys[1].legs[0].infos;
 const notices=parseVrrNotices(infos,requested,'2026-10-22T08:00:00Z','U79');
 assert.equal(notices.length,2);assert.ok(notices.every(n=>n.routingUncertain&&n.validity==='dated'));
 assert.equal(notices[0].validUntil,'2026-10-26T01:00:00.000Z');
 assert.equal(parseVrrNotices([infos[0]],'2026-10-27T07:00:00Z','2026-10-27T08:00:00Z','U79').length,0);
});
test('VRR rejects cancelled, impossible, disconnected, reversed and wrong-endpoint journeys',()=>{
 for(const mutate of [t=>t.tripImpossible=true,t=>t.legs[0].realtimeStatus='TRIP_CANCELLED',t=>t.legs[0].origin.isCancelled=true,t=>t.legs[0].isRealTimeOnlyInformative=true,t=>t.legs[0].destination.arrivalTimeEstimated='2026-10-22T05:00:00Z',t=>t.legs[0].destination.parent.id='de:05111:99999']){
  const data=fixture();data.journeys=[data.journeys[2]];mutate(data.journeys[0]);assert.equal(parseVrrJourneys(data,from,to,requested).length,0);
 }
 const data=fixture();data.journeys=[data.journeys[2]];data.journeys[0].legs.push(structuredClone(data.journeys[0].legs[0]));assert.equal(parseVrrJourneys(data,from,to,requested).length,0);
});
test('VRR geometry never substitutes station chords, and source stop IDs cannot become DB IDs',()=>{
 const data=fixture();data.journeys=[data.journeys[2]];data.journeys[0].legs[0].coords=[raw.origin.coord,raw.destination.coord];
 const j=parseVrrJourneys(data,from,to,requested)[0];assert.equal(j.legs[0].geometry.status,'missing');assert.deepEqual(j.legs[0].geometry.segments,[]);assert.equal(j.legs[0].from.dbId,'');
 assert.equal(sameVrrStation(from,{...from,vrrId:'de:05111:99999'}),false);
});
test('VRR autocomplete ranks actual stop matches; product classes remain distinct',()=>{
 const locations=[{...raw.origin.parent,matchQuality:10},{...raw.destination.parent,matchQuality:950}];
 assert.equal(parseVrrStations({locations})[0].vrrId,to.vrrId);
 for(const [cls,mode] of [[0,'train'],[1,'suburban'],[2,'subway'],[4,'tram'],[5,'bus'],[100,'walk']])assert.equal(vrrProduct({product:{class:cls}}).mode,mode);
});
