import assert from 'node:assert/strict';
import { createLocationCatalog } from '../src/location-catalog.js';

const manifest = {
  schema: 'railatlas.location-catalog/1',
  scope: 'Europe',
  shards: [
    { id: 'ch', country: 'CH', path: 'locations/ch.json', count: 1 },
    { id: 'nl', country: 'NL', path: 'locations/nl.json', count: 1 },
    { id: 'de', country: 'DE', path: 'locations/de.json', count: 1 }
  ],
  prefixes: { be: ['ch', 'de'], am: ['nl'] }
};

const data = {
  'http://test/data/locations/ch.json': { schema: 'railatlas.locations/1', locations: [{ id:'bern', name:'Bern', aliases:['Bern Hauptbahnhof'], type:'station', country:'CH' }] },
  'http://test/data/locations/nl.json': { schema: 'railatlas.locations/1', locations: [{ id:'ams', name:'Amsterdam Centraal', aliases:['Amsterdam'], type:'station', country:'NL' }] },
  'http://test/data/locations/de.json': { schema: 'railatlas.locations/1', locations: [{ id:'ber', name:'Berlin Hbf', aliases:['Berlin Hauptbahnhof'], type:'station', country:'DE' }] }
};
const requested = [];
const fetchImpl = async url => {
  const key = String(url);
  requested.push(key);
  return { ok: Boolean(data[key]), status: data[key] ? 200 : 404, json: async () => data[key] };
};

const catalog = createLocationCatalog(manifest, new URL('http://test/data/location-catalog.json'), fetchImpl);
const amsterdam = await catalog.search('Amsterdam');
assert.equal(amsterdam[0].id, 'ams');
assert.deepEqual(catalog.loadedShardIds(), ['nl']);

const bern = await catalog.search('Bern');
assert.equal(bern[0].id, 'bern');
assert.ok(catalog.loadedShardIds().includes('ch'));
assert.ok(catalog.loadedShardIds().includes('de'));
assert.equal(requested.filter(url => url.endsWith('/locations/nl.json')).length, 1);
console.log('location-catalog regression: ok');
