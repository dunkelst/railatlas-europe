import assert from 'node:assert/strict';
import { mergeJourneyBundles } from '../src/bundle-graph.js';
import { shortestPath } from '../src/routing.js';

const bundleA = {
  region: 'a',
  nodes: [
    { id: 'a1', lat: 49.1, lon: 9.2, source_refs: { osm_node_id: 1 } },
    { id: 'a2', lat: 49.2, lon: 9.3, source_refs: { osm_node_id: 2 } },
  ],
  edges: [{ id: 'e1', from: 'a1', to: 'a2', length_m: 1000 }],
  operational_points: [{ id: 'from', name: 'From', node_id: 'a1' }],
};

const bundleB = {
  region: 'b',
  nodes: [
    { id: 'b2', lat: 49.2, lon: 9.3, source_refs: { osm_node_id: 2 } },
    { id: 'b3', lat: 49.3, lon: 9.4, source_refs: { osm_node_id: 3 } },
  ],
  edges: [{ id: 'e2', from: 'b2', to: 'b3', length_m: 2000 }],
  operational_points: [{ id: 'to', name: 'To', node_id: 'b3' }],
};

const graph = mergeJourneyBundles([bundleA, bundleB]);
assert.equal(graph.nodes.length, 3, 'shared OSM node must be stitched once');
assert.equal(graph.edges.length, 2);
assert.equal(graph.operational_points.length, 2);

const path = shortestPath(graph, 'a1', 'b3');
assert.ok(path, 'route must cross the stitched bundle boundary');
assert.equal(path.distance_m, 3000);
assert.deepEqual(path.node_ids, ['a1', 'a2', 'b3']);

console.log('bundle-graph tests passed');
