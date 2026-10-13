import assert from 'node:assert/strict';
import { resolveLocationToGraph } from '../src/location-graph-resolver.js';

const registry = { levels: [
  { id: 'hn', graph: 'hn.json', bbox: [8.8, 48.9, 10.2, 50.1] },
  { id: 'nl', graph: 'nl.json', bbox: [4, 52, 5, 53] }
] };
const graph = {
  nodes: [{ id: 'n-hn', lon: 9.2081, lat: 49.1421 }, { id: 'n-bfh', lon: 9.2198, lat: 49.2308 }],
  edges: [{ id: 'e1', from: 'n-hn', to: 'n-bfh', length_m: 10000 }],
  operational_points: [{ id: 'op:hn', name: 'Heilbronn Hbf', node_id: 'n-hn' }, { id: 'op:bfh', name: 'Bad Friedrichshall Hbf', node_id: 'n-bfh' }]
};
const cache = new Map();
const loaded = [];
const loadGraph = async region => { loaded.push(region.id); return region.id === 'hn' ? graph : null; };
const station = await resolveLocationToGraph(registry, { id: 'catalog:hn', name: 'Heilbronn Hbf', location: [9.2082, 49.1422], identifiers: {} }, cache, { loadGraph });
assert.equal(station.status, 'routable');
assert.equal(station.location.node_id, 'n-hn');
assert.deepEqual(station.location.bundle_ids, ['hn']);
assert.equal(station.matchMethod, 'name+distance');

const amsterdam = await resolveLocationToGraph(registry, { id: 'catalog:ams', name: 'Amsterdam Centraal', location: [4.9, 52.37], identifiers: {} }, cache, { loadGraph });
assert.equal(amsterdam.status, 'catalog_only');
assert.equal(amsterdam.reason, 'no-operational-point-match');
assert.ok(loaded.includes('nl'));
assert.ok(!loaded.includes('other'));

const text = await resolveLocationToGraph(registry, 'HN', cache, { loadGraph });
assert.equal(text.status, 'text');
console.log('location graph resolver tests passed');
