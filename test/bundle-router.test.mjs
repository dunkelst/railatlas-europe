import assert from 'node:assert/strict';
import { resolveBundlePath, resolveBundlePathForLocations } from '../src/bundle-router.js';

const registry = { levels: [
  { id: 'a', graph: 'a.json', neighbors: ['b'] },
  { id: 'b', graph: 'b.json', neighbors: ['a', 'c'] },
  { id: 'c', graph: 'c.json', neighbors: ['b'] },
  { id: 'unused', graph: 'unused.json', neighbors: [] },
] };

assert.deepEqual(resolveBundlePath(registry, 'a', 'c').map(x => x.id), ['a', 'b', 'c']);
assert.deepEqual(resolveBundlePath(registry, 'a', 'a').map(x => x.id), ['a']);
assert.equal(resolveBundlePath(registry, 'a', 'unused'), null);
assert.equal(resolveBundlePath(registry, 'missing', 'c'), null);

const from = { bundle_ids: ['a'] };
const to = { bundle_ids: ['c'] };
assert.deepEqual(resolveBundlePathForLocations(registry, from, to).map(x => x.id), ['a', 'b', 'c']);

console.log('bundle-router tests passed');
