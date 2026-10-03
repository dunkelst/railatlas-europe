import assert from 'node:assert/strict';
import { regionContaining, graphRegionContaining, regionsForZoom } from '../src/region-loader.js';

const registry = {
  levels: [
    { id:'eu', min_zoom:4, max_zoom:6, bbox:[-25,34,45,72], graph:null },
    { id:'de', min_zoom:6, max_zoom:9, bbox:[5.5,47.0,15.5,55.2], graph:null },
    { id:'de-bw-north', min_zoom:8, max_zoom:12, bbox:[8.8,48.9,10.2,50.1], graph:'reference.json' }
  ]
};

assert.equal(regionsForZoom(registry, 5).map(r => r.id).includes('eu'), true);
assert.equal(regionContaining(registry, 9.2, 49.14, 8)?.id, 'de-bw-north');
assert.equal(graphRegionContaining(registry, 9.2, 49.14, 8)?.id, 'de-bw-north');

assert.equal(regionContaining(registry, 13.405, 52.52, 8)?.id, 'de');
assert.equal(graphRegionContaining(registry, 13.405, 52.52, 8), null);

assert.equal(graphRegionContaining(registry, 9.2, 49.14, 7), null);
console.log('region regression OK');
