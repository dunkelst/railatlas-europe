import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {decodePolyline} from '../lib/transit.mjs';
import {prototypeStops,prototypeRoutes} from '../scripts/probe-transitous.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./fixtures/transitous-heilbronn-sample.json',import.meta.url))),bounds=[49.138,9.224,49.147,9.243];

test('Actual international stop API sample retains bus modes and original source identities',()=>{
 const stops=prototypeStops(sample.stops,bounds);assert.equal(stops.length,7);
 assert.ok(stops.some(s=>s.name==='Heilbronn Karmeliterstraße'&&s.id==='de-DELFI_de:08121:99:0:0'));
 assert.ok(stops.some(s=>s.modes.includes('REGIONAL_RAIL')&&s.modes.includes('BUS')));
 assert.equal(prototypeStops(sample.stops,[50,9,51,10]).length,0);
 assert.throws(()=>prototypeStops({},bounds));
});

test('MOTIS native polyline precision is explicit while the existing HAFAS default stays unchanged',()=>{
 const source=sample.sourcePolyline,points=decodePolyline(source.points,source.precision);
 assert.equal(points.length,source.length);assert.ok(points.length>2);assert.ok(points.every(p=>p[0]>=-90&&p[0]<=90&&p[1]>=-180&&p[1]<=180));
 assert.equal(decodePolyline(source.points).length,0,'Precision six cannot be interpreted as the HAFAS precision five');
 assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'),[[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]);
 assert.deepEqual(decodePolyline(source.points,-1),[]);assert.deepEqual(decodePolyline(source.points,99),[]);
});

test('Experimental calculated paths stay explicitly calculated and absent geometry is never turned into station chords',()=>{
 const raw={routes:[{mode:'BUS',routeIdx:1,pathSource:'ROUTED',transitRoutes:[{id:'test-route',shortName:'test'}],segments:[{polyline:0}]}],polylines:[{polyline:sample.sourcePolyline}]};
 const lines=prototypeRoutes(raw,bounds);assert.equal(lines.length,1);assert.equal(lines[0].calculated,true);assert.equal(lines[0].pathSource,'ROUTED');
 const sourcePoints=new Set(decodePolyline(sample.sourcePolyline.points,6).map(p=>JSON.stringify(p)));assert.ok(lines[0].segments.flat().every(p=>sourcePoints.has(JSON.stringify(p))));
 raw.routes[0].pathSource='NONE';assert.deepEqual(prototypeRoutes(raw,bounds),[]);
 raw.routes[0].pathSource='TIMETABLE';assert.equal(prototypeRoutes(raw,bounds)[0].calculated,false);
 raw.polylines=[];assert.deepEqual(prototypeRoutes(raw,bounds),[]);assert.throws(()=>prototypeRoutes({},bounds));
});
