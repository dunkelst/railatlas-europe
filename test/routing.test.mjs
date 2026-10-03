import assert from 'node:assert/strict';
import { dijkstra } from '../src/routing.js';

const graph = {
  nodes: [{id:'a'},{id:'b'},{id:'c'}],
  edges: [
    {id:'direct',from:'a',to:'c',length_m:50},
    {id:'ab',from:'a',to:'b',length_m:10},
    {id:'bc',from:'b',to:'c',length_m:20}
  ]
};

const result = dijkstra(graph, 'a', 'c');
assert.deepEqual(result.edgeIds, ['ab','bc']);
assert.equal(result.distanceM, 30);
console.log('routing regression OK');
