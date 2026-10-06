import assert from 'node:assert/strict';
import { resolveLocation, searchLocations, validateLocationIndex } from '../src/location-index.js';

const index = validateLocationIndex({
  schema: 'railatlas.locations/1',
  locations: [
    { id: 'hn', name: 'Heilbronn Hbf', aliases: ['Heilbronn Hauptbahnhof'], bundle_ids: ['hn'] },
    { id: 'stg', name: 'Stuttgart Hbf', aliases: ['Stuttgart Hauptbahnhof'], bundle_ids: ['stuttgart'] },
    { id: 'wue', name: 'Würzburg Hbf', aliases: ['Wuerzburg Hauptbahnhof'], bundle_ids: ['wuerzburg'] },
  ],
});

assert.equal(resolveLocation(index, 'Stuttgart Hbf')?.id, 'stg');
assert.equal(resolveLocation(index, 'stuttgart hauptbahnhof')?.id, 'stg');
assert.equal(searchLocations(index, 'stutt')[0]?.id, 'stg');
assert.equal(searchLocations(index, 'würz')[0]?.id, 'wue');
assert.equal(searchLocations(index, 'wurz')[0]?.id, 'wue');
assert.equal(resolveLocation(index, 'stutt'), null, 'prefixes are suggestions, not resolved endpoints');
assert.deepEqual(searchLocations(index, 'does not exist'), []);

console.log('location-index tests passed');
