import assert from 'node:assert/strict';
import { regionContaining, graphRegionContaining, graphRegions, regionsForZoom } from '../src/region-loader.js';

const registry = {
  levels: [
    { id:'eu', min_zoom:4, max_zoom:6, bbox:[-25,34,45,72], graph:null },
    { id:'de', min_zoom:6, max_zoom:9, bbox:[5.5,47.0,15.5,55.2], graph:null },
    { id:'de-bw-north', min_zoom:8, max_zoom:12, bbox:[8.8,48.9,10.2,50.1], graph:'reference.json' }
  ],
  bundles: [
    { id:'eu-18-98', bbox:[9.0,49.0,9.5,49.5], graph:'graphs/eu-18-98.graph.json', neighbors:['eu-19-98'] },
    { id:'eu-19-98', bbox:[9.5,49.0,10.0,49.5], graph:'graphs/eu-19-98.graph.json', neighbors:['eu-18-98'] }
  ]
};

assert.equal(regionsForZoom(registry, 5).map(r => r.id).includes('eu'), true);
assert.equal(regionContaining(registry, 9.2, 49.14, 8)?.id, 'de-bw-north');
assert.equal(graphRegionContaining(registry, 9.2, 49.14, 8)?.id, 'eu-18-98');
assert.equal(graphRegions(registry).some(r => r.id === 'eu-19-98'), true);

assert.equal(regionContaining(registry, 13.405, 52.52, 8)?.id, 'de');
assert.equal(graphRegionContaining(registry, 13.405, 52.52, 8), null);
assert.equal(graphRegionContaining({ levels: registry.levels }, 9.2, 49.14, 8)?.id, 'de-bw-north');

console.log('region regression OK');
