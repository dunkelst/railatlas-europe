import assert from 'node:assert/strict';
import { nearestRailAccess } from '../src/rail-access.js';

const registry = { levels: [
  { id: 'hn', graph: 'hn.json', bbox: [8.8, 48.9, 10.2, 50.1] },
  { id: 'nl', graph: 'nl.json', bbox: [4, 52, 5, 53] }
] };
const graph = {
  nodes: [{ id: 'n-hn', lon: 9.2081, lat: 49.1421 }, { id: 'n-bfh', lon: 9.2198, lat: 49.2308 }],
  edges: [{ id: 'e1', from: 'n-hn', to: 'n-bfh', length_m: 10000 }],
  operational_points: [{ id: 'op:hn', name: 'Heilbronn Hbf', node_id: 'n-hn' }, { id: 'op:bfh', name: 'Bad Friedrichshall Hbf', node_id: 'n-bfh' }]
};
const loaded = [];
const result = await nearestRailAccess(registry, { id: 'geo:test', type: 'position', lat: 49.143, lon: 9.21, location: [9.21, 49.143] }, new Map(), {
  maxDistanceMeters: 30000,
  loadGraph: async region => { loaded.push(region.id); return region.id === 'hn' ? graph : null; }
});
assert.equal(result.status, 'routable');
assert.equal(result.operationalPoint.id, 'op:hn');
assert.equal(result.location.node_id, 'n-hn');
assert.deepEqual(result.location.bundle_ids, ['hn']);
assert.ok(result.distanceMeters < 500);
assert.deepEqual(loaded, ['hn']);

const tooFar = await nearestRailAccess(registry, { lat: 47, lon: 7, location: [7, 47] }, new Map(), { loadGraph: async () => graph });
assert.equal(tooFar.status, 'no_access');
console.log('rail access tests passed');
