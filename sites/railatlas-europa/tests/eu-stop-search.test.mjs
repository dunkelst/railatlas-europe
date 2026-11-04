import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleApi} from '../lib/api.mjs';

// Transitous geocoder responses captured on 2026-11-04, with unused fields removed.
const recorded = JSON.parse(readFileSync(new URL('./fixtures/transitous-eu-stop-search.json', import.meta.url)));

test('EU search retains native local stop IDs, city qualifiers and main-station aliases', async t => {
  const requestedPlans = [];
  t.mock.method(globalThis, 'fetch', async url => {
    const endpoint = new URL(url);
    if (endpoint.origin !== 'https://api.transitous.org') throw Error('Other provider unavailable');
    if (endpoint.pathname === '/api/v1/geocode') {
      const query = endpoint.searchParams.get('text');
      assert.ok(Object.hasOwn(recorded, query), query);
      return Response.json(recorded[query]);
    }
    assert.equal(endpoint.pathname, '/api/v6/plan');
    requestedPlans.push(endpoint.searchParams);
    return Response.json({itineraries: []});
  });
  const selected = [];
  for (const [query, [expected]] of Object.entries(recorded)) {
    const request = new Request('https://railatlas.test/api/stations?' + new URLSearchParams({q: query, region: 'europe'}));
    const result = await handleApi(request);
    assert.equal(result.status, 200, query);
    const {stations} = await result.json();
    const [stop] = stations;
    assert.equal(stop?.transitousId, expected.id, query);
    if(query==='Paris Bastille')assert.equal(stations.length, 1, 'Exclude the unrelated Paris-Est suggestion');
    assert.equal(stop.id, 'transitous:' + expected.id);
    assert.deepEqual([stop.name, stop.lat, stop.lon, stop.country], [expected.name, expected.lat, expected.lon, expected.country]);
    selected.push(stop);
  }
  const [from, to] = selected;
  const departure = new Date(Date.now() + 3_600_000).toISOString();
  await handleApi(new Request('https://railatlas.test/api/journeys', {
    method: 'POST',
    body: JSON.stringify({from, to, departure, region: 'europe'}),
  }));
  assert.equal(requestedPlans.length, 1);
  assert.equal(requestedPlans[0].get('fromPlace'), from.transitousId);
  assert.equal(requestedPlans[0].get('toPlace'), to.transitousId);
});
