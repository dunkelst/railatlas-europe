import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {parseDbStation,parseDbJourneys,getDbJourneys} from '../lib/db.mjs';
import {sameNearbyStation} from '../lib/journey.mjs';
import {findEfaStations} from '../lib/vrr.mjs';
import {getTimetableJourneys,relevantStations} from '../lib/timetable.mjs';
const read=(name,gz=false)=>JSON.parse(gz?gunzipSync(fs.readFileSync(new URL('./fixtures/'+name+'.json.gz',import.meta.url))):fs.readFileSync(new URL('./fixtures/'+name+'.json',import.meta.url)));
const from={id:'efa:de:03252:2320',efaId:'de:03252:2320',name:'Rohdenthal, Rohdental',aliases:'Rohdental Hessisch Oldendorf',country:'DE',lat:52.200076,lon:9.249135,dbId:''};
const to={id:'osm:node/3961281940',name:'U Turmstraße',locality:'Berlin',networkMode:'bus',country:'DE',lat:52.525547,lon:13.3413274,dbId:''};
const origin=()=>parseDbStation(read('db-rohdental-nearby')[0],from),destination=()=>parseDbStation(read('db-turmstrasse-nearby')[0],to),requested='2026-10-24T21:17:00Z';
test('Actual EFA no-match and ambiguity replies are station results, not an outage',async t=>{
 t.mock.method(globalThis,'fetch',async url=>Response.json(read(new URL(url).searchParams.get('name_sf')==='test-empty-turm'?'efa-empty-stopfinder':'efa-ambiguous-stopfinder')));
 assert.deepEqual(await findEfaStations('test-empty-turm'),[]);assert.ok((await findEfaStations('test-ambiguous-turm')).length>0);
 assert.equal(relevantStations([{name:'Bellach, Turmstrasse',main:false},{name:'U Turmstraße',main:false}],'U Turmstraße').length,1);
});
test('Source street abbreviations and shared bus/metro hubs map only within the same close location',()=>{
 assert.equal(sameNearbyStation(from,origin()),true);assert.equal(sameNearbyStation(to,destination()),true);
 assert.equal(destination().dbId,'');assert.equal(destination().dbStopId,'730740');
 assert.equal(sameNearbyStation(to,{...destination(),lat:52.53}),false);
 assert.equal(sameNearbyStation(to,{...destination(),networkModes:['subway']}),false);
 assert.equal(sameNearbyStation(to,{...destination(),name:'Turmstr. (Oper), Berlin'}),false);
 assert.equal(sameNearbyStation({id:'osm:test',name:'Altstadt, Rathaus',locality:'Altstadt',lat:52,lon:9},{name:'Altstadt, Kreuzung',locality:'Altstadt',lat:52,lon:9}),false);
 assert.equal(sameNearbyStation({name:'Altstadt, Rathaus',lat:52,lon:9},{name:'Altstadt, Kreuzung',lat:52,lon:9}),false);
});
test('Actual national trip reply excludes the cancelled S51 and preserves complete bus/rail alternatives',()=>{
 const journeys=parseDbJourneys(read('db-rohdental-turmstrasse',true),origin(),destination(),requested);assert.equal(journeys.length,5);
 const j=journeys[0];assert.equal(j.departure,'2026-10-26T05:53:00.000Z');assert.equal(j.arrival,'2026-10-26T11:34:00.000Z');
 assert.deepEqual(j.legs.map(l=>l.mode),['bus','bus','walk','suburban','train','walk','bus']);assert.equal(j.legs.at(-1).line,'Bus 245');assert.equal(j.transfers,4);
 assert.ok(!journeys.some(j=>j.legs.some(l=>l.line==='S51')));assert.ok(j.notices.some(n=>n.kind==='cancellation'&&n.scope.startsWith('Verworfener DB-Vorschlag')));
 const detailed=parseDbJourneys({verbindungen:[read('db-turmstrasse-geometry',true)]},origin(),destination(),requested)[0];
 assert.ok(detailed.legs.filter(l=>!l.walking).every(l=>l.geometry.status==='complete'));assert.ok(detailed.legs.filter(l=>l.walking).every(l=>l.geometry.status==='missing'));assert.ok(detailed.legs.every(l=>l.from.dbId===''&&l.from.id.startsWith('db:')));
 for(const mutate of [t=>t.risNotizen=[{key:'text.realtime.connection.cancelled',value:'Verbindung fällt aus'}],t=>t.verbindungsAbschnitte[0].originCancelled=true,t=>t.verbindungsAbschnitte.at(-1).halte.at(-1).name='Falscher Halt']){const d=read('db-rohdental-turmstrasse',true);d.verbindungen=[d.verbindungen[1]];mutate(d.verbindungen[0]);assert.equal(parseDbJourneys(d,origin(),destination(),requested).length,0);}
});
test('Automatic fallback crosses the empty weekend and DST change using a bounded calendar search',async t=>{
 const dates=[];let allEmpty=false;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  const u=new URL(url);
  if(u.hostname==='fahrplan.oebb.at')return Response.json({err:'OK',svcResL:[{err:'OK',res:{locL:[]}}]});
  if(u.hostname==='www.efa.de')return Response.json(read('efa-empty-stopfinder'));
  assert.equal(u.hostname,'int.bahn.de');
  if(u.pathname.endsWith('/nearby'))return Response.json(read(Number(u.searchParams.get('lat'))>52.4?'db-turmstrasse-nearby':'db-rohdental-nearby'));
  const body=JSON.parse(init.body);
  if(u.pathname.endsWith('/verbindung'))return Response.json(read('db-turmstrasse-geometry',true));
  dates.push(body.anfrageZeitpunkt);assert.match(body.abfahrtsHalt,/@L=265209@/);assert.match(body.ankunftsHalt,/@L=730740@/);
  return Response.json(allEmpty||dates.length<3?{verbindungen:[]}:read('db-rohdental-turmstrasse',true));
 });
 const journeys=await getTimetableJourneys(from,to,requested);assert.equal(journeys[0].source,'DB / bahn.de');assert.equal(journeys[0].legs.at(-1).line,'Bus 245');
 assert.deepEqual(dates,['2026-10-24T23:17:00','2026-10-25T00:00:00','2026-10-26T00:00:00']);
 allEmpty=true;await assert.rejects(getDbJourneys(from,to,requested),/nächsten drei Kalendertage/);assert.equal(dates.length,6);
 const controller=new AbortController();controller.abort();await assert.rejects(getDbJourneys(from,to,requested,controller.signal),{name:'AbortError'});
});
test('A refreshed cancellation cannot be replaced by the old proposed journey',async t=>{
 t.mock.method(globalThis,'fetch',async(url)=>{if(new URL(url).pathname.endsWith('/verbindung')){const data=read('db-turmstrasse-geometry',true);data.risNotizen=[{key:'text.realtime.connection.cancelled',value:'Verbindung fällt aus'}];return Response.json(data);}return Response.json(read('db-rohdental-turmstrasse',true));});
 await assert.rejects(getDbJourneys(from,to,requested),/erneuten Prüfung nicht bestätigt/);
});
