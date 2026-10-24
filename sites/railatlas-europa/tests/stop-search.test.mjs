import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parseBusStops,findBusStops} from '../lib/stop-search.mjs';
import {rankJourneys,getTimetableJourneys} from '../lib/timetable.mjs';
import {parseVrrJourneys,parseVrrStations,EFA_PROVIDER} from '../lib/vrr.mjs';
import {walkingMinutes} from '../lib/rail.mjs';
const samples=JSON.parse(fs.readFileSync(new URL('./fixtures/photon-bus-stops.json',import.meta.url)));
test('Actual OSM bus stops are searchable across Europe with correct countries and provider-independent IDs',()=>{
 for(const [key,query,country] of [['Aldwych-London','Aldwych London','GB'],['Buikslotermeerplein-Amsterdam','Buikslotermeerplein Amsterdam','NL'],['Carl-Berners-plass-Oslo','Carl Berners plass Oslo','NO'],['Vychovatelna-Praha','Vychovatelna Praha','CZ'],['Cibeles-Madrid','Cibeles Madrid','ES'],['Place-d-Italie-Paris','Place d’Italie Paris','FR'],['Milchbuck-Zu-rich','Milchbuck Zürich','CH']]){
  const stops=parseBusStops(samples[key],query);assert.ok(stops.length,query);assert.ok(stops.every(s=>s.country===country&&s.networkMode==='bus'&&s.dbId===''&&!s.efaId&&!s.vrrId&&s.id.startsWith('osm:node/')));
  assert.equal(stops[0].lat,samples[key].features[0].geometry.coordinates[1]);assert.equal(stops[0].timetableStatus,'unverified');
 }
 const rohdental=parseBusStops(samples.Rohdental,'Rohdental');assert.equal(rohdental.length,1);assert.equal(rohdental[0].id,'osm:node/12288988464');
});
test('General bus search excludes malformed coordinates, generic POIs and non-European countries',()=>{
 const feature=samples.Rohdental.features[0];
 for(const mutate of [f=>f.geometry.coordinates=[200,95],f=>f.properties.osm_value='restaurant',f=>f.properties.countrycode='US',f=>f.properties.osm_id='invalid']){
  const bad=structuredClone(feature);mutate(bad);assert.deepEqual(parseBusStops({features:[bad]},'Rohdental'),[]);
 }
});
test('Stop search is bounded, cached, cancellable and pauses after an upstream failure',async t=>{
 let calls=0,clock=Date.now();t.mock.method(Date,'now',()=>clock);
 t.mock.method(globalThis,'fetch',async url=>{calls++;const u=new URL(url);assert.equal(u.hostname,'photon.komoot.io');assert.deepEqual(u.searchParams.getAll('osm_tag'),['highway:bus_stop','amenity:bus_station']);assert.equal(u.searchParams.get('limit'),'12');if(calls===2)return new Response('',{status:429});return Response.json(samples.Rohdental);});
 assert.equal((await findBusStops('Rohdental'))[0].name,'Rohdental');await findBusStops('Rohdental');assert.equal(calls,1);
 const controller=new AbortController();controller.abort();await assert.rejects(findBusStops('Rohdental',controller.signal),{name:'AbortError'});
 clock+=1100;await assert.rejects(findBusStops('unknown-12345'),/429/);clock+=1100;await assert.rejects(findBusStops('unknown-98765'),/pausiert/);assert.equal(calls,2);
});
test('Real source alternatives retain full multimodal chains; preferences rank complete journeys',()=>{
 const read=n=>JSON.parse(fs.readFileSync(new URL('./fixtures/efa-stops-'+n+'.json',import.meta.url)));
 const from=parseVrrStations(read('heilbronn-finanzamt'),EFA_PROVIDER)[0],to=parseVrrStations(read('rohdental'),EFA_PROVIDER)[0];
 const data=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/efa-heilbronn-rohdental-trip.json.gz',import.meta.url))));
 const journeys=parseVrrJourneys(data,from,to,'2026-10-26T07:00:00Z',EFA_PROVIDER);assert.equal(journeys.length,4);
 for(const preference of ['arrival','transfers','walking']){const sorted=rankJourneys(journeys,preference);assert.equal(sorted.length,4);assert.ok(sorted.every(j=>j.legs.at(-1).mode==='bus'&&j.legs.at(-1).to.efaId===to.efaId));}
 const earliest=rankJourneys(journeys)[0];assert.equal(Date.parse(earliest.arrival),Math.min(...journeys.map(j=>Date.parse(j.arrival))));
 const fewer=rankJourneys(journeys,'transfers')[0];assert.equal(fewer.transfers,Math.min(...journeys.map(j=>j.transfers)));
 const lessWalk=rankJourneys(journeys,'walking')[0];assert.equal(walkingMinutes(lessWalk),Math.min(...journeys.map(j=>walkingMinutes(j)??Infinity)));
 assert.equal(rankJourneys([journeys[0],structuredClone(journeys[0])]).length,1);
 const unknownWalk=structuredClone(journeys[0]);const walk=unknownWalk.legs.find(l=>l.walking);walk.arrival=walk.departure;assert.equal(walkingMinutes(unknownWalk),null);assert.notEqual(rankJourneys([unknownWalk,journeys[1]],'walking')[0],unknownWalk);
});
test('Automatic comparison reports total failure and never returns a fabricated connection',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw Error('offline');});
 const station={id:'test',name:'missing test stop',lat:52,lon:9,dbId:''};
 await assert.rejects(getTimetableJourneys(station,{...station,lon:9.1},'2026-10-26T07:00:00Z'),/keine nutzbare Verbindung/);
});

test('Actual EFA stay-seated instruction preserves the bus through-service without an invented transfer',()=>{
 const data=JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/efa-rohdental-heilbronn-trip.json.gz',import.meta.url))));
 const first=data.journeys[0].legs[0],last=data.journeys[0].legs.at(-1),from=parseVrrStations({locations:[first.origin.parent]},EFA_PROVIDER)[0],to=parseVrrStations({locations:[last.destination.parent]},EFA_PROVIDER)[0];
 const journey=parseVrrJourneys(data,from,to,'2026-10-26T05:00:00Z',EFA_PROVIDER)[0];
 assert.ok(journey);assert.equal(journey.legs.length,7);assert.equal(journey.transfers,4);assert.equal(journey.legs[0].line,'27');assert.equal(journey.legs[1].line,'20');assert.equal(journey.legs[1].throughService,true);assert.ok(!journey.legs.some(l=>l.mode==='stay-on-board'));
 const bad=structuredClone(data);bad.journeys[0].legs[1].origin.parent.id='de:03252:9999';assert.equal(parseVrrJourneys(bad,from,to,'2026-10-26T05:00:00Z',EFA_PROVIDER).length,0);
});
