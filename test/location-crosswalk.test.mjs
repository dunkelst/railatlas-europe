import assert from 'node:assert/strict';
import { matchLocationToOperationalPoints, bindLocationToGraph } from '../src/location-crosswalk.js';

const bern = { id:'catalog:bern', name:'Bern', country:'CH', location:[7.4391,46.948], identifiers:{uic:['8507000']} };
const graph = { region:'ch-bern', operational_points:[
  { id:'op:bern', name:'Bern', location:[7.439,46.948], identifiers:{uic:['8507000']} },
  { id:'op:other', name:'Bern Wankdorf', location:[7.464,46.966], identifiers:{uic:['8507001']} }
]};
let result = matchLocationToOperationalPoints(bern, graph.operational_points);
assert.equal(result.status, 'routable');
assert.equal(result.method, 'uic');
assert.equal(result.matches[0].id, 'op:bern');

const fallback = { id:'catalog:x', name:'Bern', location:[7.4392,46.9481], identifiers:{} };
result = matchLocationToOperationalPoints(fallback, graph.operational_points);
assert.equal(result.status, 'routable');
assert.equal(result.method, 'name+distance');

const missing = matchLocationToOperationalPoints({ name:'Amsterdam Centraal', location:[4.9,52.37] }, graph.operational_points);
assert.equal(missing.status, 'catalog_only');

const bound = bindLocationToGraph(bern, graph);
assert.equal(bound.graph_status, 'routable');
assert.deepEqual(bound.graph_operational_point_ids, ['op:bern']);
assert.ok(bound.bundle_ids.includes('ch-bern'));
console.log('location crosswalk tests passed');
