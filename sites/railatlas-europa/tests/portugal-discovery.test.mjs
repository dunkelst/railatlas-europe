import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findTimetableStations} from '../lib/timetable.mjs';
import {parseTransitousStation} from '../lib/transitous.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/portugal-lisboa-geocode.json',import.meta.url)));
const metro=fixture.stations[0];

test('European autocomplete includes the real Lisbon Metro identity when the other searches are unavailable',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async url=>{
  const u=new URL(url);calls.push(u);
  if(u.hostname==='api.transitous.org'){
   assert.equal(u.pathname,'/api/v1/geocode');assert.equal(u.searchParams.get('text'),'Marquês de Pombal');
   assert.equal(u.searchParams.get('place'),'38.725,-9.15');return Response.json(fixture.stations);
  }
  return new Response('provider unavailable',{status:503});
 });
 const stations=await findTimetableStations('Marquês de Pombal','auto',undefined,'europe',[38.725,-9.15]);
 const selected=stations.find(s=>s.transitousId===metro.id);
 assert.ok(selected);assert.equal(selected.timeZone,'Europe/Lisbon');
 assert.equal(selected.lat,metro.lat);assert.equal(selected.lon,metro.lon);
 assert.equal(selected.id,parseTransitousStation({...metro,stopId:metro.id}).id);
 assert.ok(calls.some(u=>u.hostname==='api.transitous.org'));
});

test('Existing bus and metro stops cannot conceal a missing tram layer',async t=>{
 const {fetchNetwork,OVERPASS_URL}=await import('../lib/network.mjs?portugal-missing-mode');
 const bounds=[38.72,-9.16,38.73,-9.14],sourceStop={...metro,stopId:metro.id},calls=[];
 // The OSM object below is a controlled parser fixture, not a live service claim.
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  const u=new URL(url);calls.push(u);
  if(u.hostname==='api.transitous.org')return Response.json([sourceStop]);
  assert.equal(u.origin,new URL(OVERPASS_URL).origin);
  assert.match(init.body.get('data'),/tram_stop/);
  assert.doesNotMatch(init.body.get('data'),/highway=bus_stop/,'Already supplied modes are not re-requested');
  return Response.json({elements:[{type:'node',id:123,lat:38.725,lon:-9.15,tags:{railway:'tram_stop',name:'Controlled tram fixture'}}]});
 });
 const data=await fetchNetwork(bounds,['subway','tram','bus'],undefined,'stops');
 assert.equal(data.layers.tram.stops.length,1);
 assert.equal(data.layers.subway.stops[0].station.transitousId,metro.id);
 assert.equal(data.layers.bus.stops[0].station.transitousId,metro.id);
 assert.equal(data.layers.subway.stops[0].lat,metro.lat);
 assert.equal(calls.length,2);
});

test('An unavailable missing-mode supplement preserves native Lisbon stops and makes the gap visible',async t=>{
 const {fetchNetwork}=await import('../lib/network.mjs?portugal-missing-mode-outage');
 t.mock.method(globalThis,'fetch',async url=>new URL(url).hostname==='api.transitous.org'?Response.json([{...metro,stopId:metro.id}]):new Response('temporarily unavailable',{status:503}));
 const data=await fetchNetwork([38.72,-9.16,38.73,-9.14],['subway','tram','bus'],undefined,'stops');
 assert.equal(data.layers.subway.stops[0].station.transitousId,metro.id);
 assert.equal(data.layers.tram.stops.length,0);assert.equal(data.warningScope,'all');
 assert.match(data.warning,/Ein Teil der Halte fehlt/);
});
