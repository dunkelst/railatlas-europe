import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parseVrrJourneys, parseVrrStations, sameVrrStation, EFA_PROVIDER, EFA_SOURCE} from '../lib/vrr.mjs';
import {findTimetableStations, getTimetableJourney, relevantStations} from '../lib/timetable.mjs';
import {handleApi} from '../lib/api.mjs';
import {validateChain} from '../lib/rail.mjs';
const fixture=name=>JSON.parse(fs.readFileSync(new URL('./fixtures/'+name+'.json',import.meta.url)));
const trip=name=>JSON.parse(gunzipSync(fs.readFileSync(new URL('./fixtures/efa-'+name+'-trip.json.gz',import.meta.url))));
const stop=name=>parseVrrStations(fixture('efa-stops-'+name),EFA_PROVIDER)[0];
const from=stop('heilbronn-finanzamt'),rohdental=stop('rohdental'),bahnhof=stop('hessisch-oldendorf-bahnhof'),departure='2026-10-26T07:00:00Z';

test('Real EFA regional stop retains its own namespace, locality alias and source coordinates',()=>{
 assert.equal(rohdental.efaId,'de:03252:2320');assert.equal(rohdental.id,'efa:de:03252:2320');
 assert.equal(rohdental.dbId,'');assert.equal(rohdental.vrrId,undefined);assert.equal(rohdental.lat,52.200076);
 assert.equal(relevantStations([rohdental], 'Hessisch Oldendorf Rohdental')[0].efaId,rohdental.efaId);
 assert.equal(sameVrrStation(rohdental,{...rohdental,efaId:'de:03252:2010'},EFA_PROVIDER),false);
});
test('Actual regional EFA trip uses Bus 27 and source geometry; full Heilbronn route reaches Rohdental',()=>{
 const local=parseVrrJourneys(trip('rohdental-local'),rohdental,bahnhof,departure,EFA_PROVIDER)[0];
 assert.equal(local.departure,'2026-10-26T07:18:00.000Z');assert.equal(local.arrival,'2026-10-26T07:32:00.000Z');
 assert.equal(local.legs[0].line,'27');assert.equal(local.legs[0].mode,'bus');assert.equal(local.legs[0].geometry.status,'complete');assert.equal(local.legs[0].geometry.segments[0].length,232);
 const route=parseVrrJourneys(trip('heilbronn-rohdental'),from,rohdental,departure,EFA_PROVIDER)[0];
 assert.equal(route.source,EFA_SOURCE);assert.equal(route.departure,'2026-10-26T08:25:00.000Z');assert.equal(route.arrival,'2026-10-26T14:17:00.000Z');
 assert.deepEqual(route.legs.map(l=>l.line),['S4','Fußweg','RE 8','ICE 682','RE2','RB77','27']);
 assert.equal(route.legs.at(-1).to.efaId,rohdental.efaId);assert.ok(route.legs.every(l=>l.geometry.status==='complete'));assert.ok(route.notices.length>0);
 assert.equal(validateChain([route],[from,rohdental],[]),true);
});
test('Automatic API search ignores unrelated ÖBB suggestions and routes mixed endpoints through EFA',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async (url,init)=>{
  calls.push(String(url));
  if(String(url).includes('mgate.exe')){
   const method=JSON.parse(init.body).svcReqL[0].meth;assert.equal(method,'LocMatch');
   return Response.json({err:'OK',svcResL:[{err:'OK',res:{common:{locL:[{type:'S',name:'Rothenthurn',extId:'8100152',crd:{x:13400000,y:46800000}}]}}}]});
  }
  const u=new URL(url);assert.equal(u.origin,'https://www.efa.de');
  if(u.pathname.endsWith('XML_STOPFINDER_REQUEST'))return Response.json(fixture('efa-stops-'+(u.searchParams.get('name_sf')==='Heilbronn Finanzamt'?'heilbronn-finanzamt':'rohdental')));
  assert.equal(u.pathname,'/efa/XML_TRIP_REQUEST2');assert.equal(u.searchParams.get('name_origin'),from.efaId);assert.equal(u.searchParams.get('name_destination'),rohdental.efaId);
  assert.equal(u.searchParams.get('itdDate'),'20261026');assert.equal(u.searchParams.get('itdTime'),'0800');
  return Response.json(trip('heilbronn-rohdental'));
 });
 const response=await handleApi(new Request('https://railatlas.example/api/stations?q=Rohdental'));
 assert.equal(response.status,200);const stations=(await response.json()).stations;assert.equal(stations.length,1);assert.equal(stations[0].efaId,rohdental.efaId);
 const selectedOebb={...from,id:'oebb-finanzamt',name:'Heilbronn Finanzamt',dbId:'8002733'};delete selectedOebb.efaId;
 const journey=await getTimetableJourney(selectedOebb,stations[0],departure);
 assert.equal(journey.source,EFA_SOURCE);assert.equal(journey.legs.at(-1).line,'27');
 assert.equal(calls.filter(c=>c.includes('mgate.exe')).length,1,'The selected EFA stop never becomes an ÖBB route ID');
});
test('Provider outage remains an error; automatic routing preserves ÖBB failures and user aborts',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw Error('test outage');});
 await assert.rejects(findTimetableStations('missing-local-stop-123','auto'),/teilweise erreichbar/);
 const rail={...from,dbId:'8000157',efaId:undefined};
 await assert.rejects(getTimetableJourney(rail,{...rail,dbId:'8000260'},departure),/gerade nicht erreichbar/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(findTimetableStations('Rohdental','auto',controller.signal),{name:'AbortError'});
 await assert.rejects(getTimetableJourney(from,rohdental,departure,'auto',controller.signal),{name:'AbortError'});
});
test('EFA rejects wrong endpoint IDs, cancelled trips and backwards journeys with the shared validator',()=>{
 for(const mutate of [j=>j.tripImpossible=true,j=>j.legs[0].origin.isCancelled=true,j=>j.legs[0].destination.arrivalTimeEstimated='2026-10-26T06:00:00Z',j=>j.legs[0].destination.parent.id='de:03252:9999']){
  const data=trip('rohdental-local');data.journeys=data.journeys.slice(0,1);mutate(data.journeys[0]);assert.equal(parseVrrJourneys(data,rohdental,bahnhof,departure,EFA_PROVIDER).length,0);
 }
});
test('Unresolved OSM stops use EFA only after name and nearby coordinates agree',async t=>{
 const hosts=[];
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  const u=new URL(url);hosts.push(u.hostname);
  if(u.hostname==='fahrplan.oebb.at'){
   assert.equal(JSON.parse(init.body).svcReqL[0].meth,'LocGeoPos');
   return Response.json({err:'OK',svcResL:[{err:'OK',res:{locL:[]}}]});
  }
  assert.equal(u.hostname,'www.efa.de');
  if(u.pathname.endsWith('XML_STOPFINDER_REQUEST'))return Response.json(fixture('efa-stops-hessisch-oldendorf-bahnhof'));
  return Response.json(trip('rohdental-local'));
 });
 const map=(s,name)=>({...s,id:'osm:node/'+s.efaId,efaId:undefined,name,networkMode:'bus'});
 const journey=await getTimetableJourney(map(rohdental,'Rohdental'),map(bahnhof,'Hess. Oldendorf, Bahnhof'),departure);
 assert.equal(journey.source,EFA_SOURCE);assert.equal(journey.legs[0].line,'27');assert.ok(hosts.includes('fahrplan.oebb.at'));assert.ok(hosts.includes('www.efa.de'));
 await assert.rejects(getTimetableJourney(map(rohdental,'Rohdental'),map({...bahnhof,lat:bahnhof.lat+.1},'Hess. Oldendorf, Bahnhof'),departure),/nicht eindeutig zugeordnet/);
});
