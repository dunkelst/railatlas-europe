import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodePolyline,routeGeometry,transportProduct,parseNotices,noticeReferences,plainText,mergeNotices} from '../lib/transit.mjs';
import {parseHafasJourneys,parseHimSearchNotices,parseStation} from '../lib/journey.mjs';
import {unpack,distanceKm} from '../lib/rail.mjs';
const raw=JSON.parse(fs.readFileSync(new URL('./fixtures/oebb-geometry.json',import.meta.url)));
const catalogue=unpack(JSON.parse(fs.readFileSync(new URL('../public/data/stations.json',import.meta.url))));
const from=catalogue.find(s=>s.dbId==='8507000'),to=catalogue.find(s=>s.dbId==='8400058');
const parse=r=>parseHafasJourneys(r,from,to,'2026-10-21T06:00:00Z');

test('Recorded Bern–Amsterdam response supplies actual curved geometry, not station chords',()=>{
 const journey=parse(raw)[0];assert.ok(journey);
 const leg=journey.legs[0],segments=leg.geometry.segments;
 assert.equal(leg.geometry.status,'complete');assert.ok(segments.flat().length>500);
 assert.ok(distanceKm({lat:segments[0][0][0],lon:segments[0][0][1]},leg.from)<.15);
 const end=segments.at(-1).at(-1);assert.ok(distanceKm({lat:end[0],lon:end[1]},leg.to)<.15);
 assert.ok(journey.legs.filter(l=>!l.walking).every(l=>l.geometry.status==='complete'));
 const stationTransfer=journey.legs.find(l=>l.walking&&l.from.dbId===l.to.dbId);
 assert.equal(stationTransfer.geometry.status,'missing');assert.deepEqual(stationTransfer.geometry.segments,[]);
});
test('Missing geometry stays missing, partial fragments stay separate, malformed encoding is rejected',()=>{
 const r=structuredClone(raw),section=r.outConL[0].secL[0],common=r.common;
 const original=routeGeometry(section,common,from,to);assert.equal(original.segments.length,3);
 common.polyL[section.jny.polyG.polyXL[1]]=null;
 const partial=routeGeometry(section,common,from,to);assert.equal(partial.status,'partial');assert.equal(partial.segments.length,2);assert.ok(partial.segments.flat().length<10);
 delete section.jny.polyG;assert.deepEqual(routeGeometry(section,common,from,to).segments,[]);
 assert.deepEqual(decodePolyline('~~~~~~~'),[]);assert.deepEqual(decodePolyline(null),[]);
 const paris=r.outConL.flatMap(t=>t.secL).find(l=>l.type==='TRSF');
 const loc=i=>({lat:common.locL[i].crd.y/1e6,lon:common.locL[i].crd.x/1e6});
 assert.equal(routeGeometry(paris,common,loc(paris.dep.locX),loc(paris.arr.locX)).status,'missing','two-point transfer chord is not a routed footpath');
});
test('ÖBB decimal classes preserve bus, S-/U-Bahn, tram, SEV, ferry and rail identities',()=>{
 for(const [cls,mode] of [[1,'train'],[4,'train'],[16,'train'],[32,'suburban'],[64,'bus'],[128,'ferry'],[256,'subway'],[512,'tram'],[2048,'on-demand'],[4096,'train']])assert.equal(transportProduct({cls}).mode,mode);
 assert.equal(transportProduct({cls:64,name:'SEV 1'}).mode,'replacement-bus');
 assert.equal(transportProduct({cls:64,name:'Bus 40A'}).mode,'bus');
 assert.equal(transportProduct({},true).mode,'walk');assert.equal(transportProduct({name:'Unknown'}).mode,'unknown');
});
test('Temporary closures are shown only when validity and event windows overlap the travel time',()=>{
 const common={himL:[{hid:'closure',head:'Streckensperrung',text:'Strecke zwischen A und B gesperrt.',sDate:'20261021',sTime:'081000',eDate:'20261021',eTime:'083000'}]};
 const refs=[{type:'HIM',himX:0}];
 let n=parseNotices(refs,common,[],'2026-10-21T06:00:00Z','2026-10-21T07:00:00Z','A → B');
 assert.equal(n.length,1);assert.equal(n[0].kind,'closure');assert.equal(n[0].validFrom,'2026-10-21T06:10:00.000Z');assert.equal(n[0].validity,'dated');
 assert.equal(parseNotices(refs,common,[],'2026-10-21T07:00:00Z','2026-10-21T08:00:00Z','A → B').length,0);
 assert.equal(parseNotices(refs,common,[],'2026-10-21T05:00:00Z','2026-10-21T06:00:00Z','A → B').length,0);
 common.himL[0].eventRefL=[0];common.himMsgEventL=[{fDate:'20261021',fTime:'082000',tDate:'20261021',tTime:'082500'}];
 assert.equal(parseNotices(refs,common,[],'2026-10-21T06:10:00Z','2026-10-21T06:15:00Z','A → B').length,0);
 delete common.himL[0].sDate;delete common.himL[0].eDate;delete common.himL[0].eventRefL;
 assert.equal(parseNotices(refs,common,[],'2026-10-21T06:00:00Z','2026-10-21T07:00:00Z','A → B')[0].validity,'unspecified');
});
test('Trip, leg, endpoint and stop alerts survive parsing with source and scope; expired notices disappear',()=>{
 const r=structuredClone(raw);r.common.himL=[{hid:'temporary',head:'Sperrung zwischen Bern und Basel',text:'Ersatzverkehr gemäß Fahrplan',sDate:'20261021',sTime:'080000',eDate:'20261021',eTime:'100000'},{hid:'expired',head:'Streckensperrung',sDate:'20261019',eDate:'20261020'}];
 for(const t of r.outConL){t.msgL=[{type:'HIM',himX:0},{type:'HIM',himX:1}];t.secL[0].jny.stopL[1].msgL=[{type:'HIM',himX:0}];t.secL[0].dep.msgL=[{type:'HIM',himX:0}];}
 const j=parse(r)[0];assert.ok(j);const alerts=j.notices.filter(n=>n.kind==='closure');assert.ok(alerts.length>=2);assert.ok(alerts.every(n=>n.id.startsWith('temporary')));assert.ok(alerts.some(n=>n.scope===j.legs[0].stopovers[1].station.name));assert.equal(j.disruptionCoverage,'partial');
 const absent=parse(raw)[0];assert.equal(absent.disruptionCoverage,'partial','an empty message list is never an all-clear');
});
test('Station disruption feed keeps only alerts whose affected endpoints belong to the planned route',()=>{
 const station=(name,id,lat,lon)=>({name,extId:id,crd:{y:Math.round(lat*1e6),x:Math.round(lon*1e6)}}),common={locL:[station('Start','8000001',49,9),station('Ziel','8000002',49.1,9.1),station('Fremd','8000003',48,8)],himMsgEventL:[]};
 const result={common,msgL:[{hid:'real',head:'Bauarbeiten - Schienenersatzverkehr',text:'Dieser Zug kann nicht fahren.',fLocX:0,tLocX:1,sDate:'20261021',sTime:'060000',eDate:'20261021',eTime:'100000'},{hid:'other',head:'Streckensperrung',text:'Fremde Strecke gesperrt.',fLocX:0,tLocX:2,sDate:'20261021',sTime:'060000',eDate:'20261021',eTime:'100000'}]};
 const path=common.locL.slice(0,2).map(s=>parseStation(s));const notices=parseHimSearchNotices([result],path,'2026-10-21T06:00:00Z','2026-10-21T08:00:00Z');
 assert.equal(notices.length,1);assert.equal(notices[0].id.startsWith('real:'),true);assert.equal(notices[0].kind,'cancellation');assert.equal(notices[0].scope,'Start → Ziel');
});
test('Trip and station feeds deduplicate the same incident even with a line prefix',()=>{
 const base={kind:'notice',title:'Lift außer Betrieb',scope:'Wels Hbf',validFrom:'2026-10-21T00:00:00Z',validUntil:'2026-10-22T00:00:00Z'};
 const notices=mergeNotices([[{...base,id:'trip',text:'REX 50: Wegen Reparaturarbeiten ist der Lift außer Betrieb.'}],[{...base,id:'station',text:'Wegen Reparaturarbeiten ist der Lift außer Betrieb.'}]]);
 assert.equal(notices.length,1);assert.equal(notices[0].id,'trip');
});
test('Cancellation, unreachable services and prohibited boarding cannot become a usable connection',()=>{
 for(const mutate of [r=>r.outConL.forEach(t=>t.secL[0].dep.dCncl=true),r=>r.outConL.forEach(t=>t.secL[0].jny.isRchbl=false),r=>r.outConL.forEach(t=>t.secL[0].dep.dInS=false),r=>r.outConL.forEach(t=>t.secL.at(-1).arr.aOutS=false)]){const r=structuredClone(raw);mutate(r);assert.equal(parse(r).length,0);}
});
test('Non-stopping border points do not appear as boarding stops or route-blocking alerts',()=>{
 const j=parse(raw)[0];assert.ok(j.legs.every(l=>l.stopovers.every(s=>s.arrival||s.departure)));
 const border=j.notices.find(n=>n.scope==='Venlo Staatsgrenze');assert.equal(border.severity,'info');
 assert.deepEqual(noticeReferences([{locX:3,rRefL:[2]}]),[{fLocX:3,tLocX:3,passBy:false,type:'REM',remX:2}]);
 assert.equal(plainText('<b>Störung</b><br>Bis &amp; ab &#228;'),'Störung\nBis & ab ä');
});
