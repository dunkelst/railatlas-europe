import test from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl, apiUrl} from '../lib/urls.mjs';
import {apiJson, apiOptions, rejectOrigin, PAGES_ORIGIN} from '../lib/api-cors.mjs';

test('the same UI resolves assets under Pages and API calls at the server', () => {
  const pages = {basePath: '/railatlas-europe/', apiOrigin: 'https://railatlas-europa.cocoaamber33.chatgpt.site'};
  assert.equal(assetUrl('/data/stations.json', pages), '/railatlas-europe/data/stations.json');
  assert.equal(assetUrl('vendor/leaflet.js', pages), '/railatlas-europe/vendor/leaflet.js');
  assert.equal(apiUrl('/api/stations?q=Bern', pages), pages.apiOrigin + '/api/stations?q=Bern');
  assert.equal(apiUrl('/api/journeys'), '/api/journeys');
  assert.equal(assetUrl('/data/meta.json'), '/data/meta.json');
});

const request = (origin = PAGES_ORIGIN, method = 'POST', headers = 'content-type') => new Request('https://railatlas-europa.cocoaamber33.chatgpt.site/api/journeys', {method: 'OPTIONS', headers: {Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': headers}});

test('Pages can preflight JSON journey requests without credentials', () => {
  const response = apiOptions(request(), 'POST');
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), PAGES_ORIGIN);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
});

test('unapproved origins and methods cannot read cross-origin API responses', () => {
  const other = request('https://example.com');
  assert.equal(rejectOrigin(other).status, 403);
  assert.equal(apiOptions(other, 'POST').headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(apiOptions(request(PAGES_ORIGIN, 'DELETE'), 'POST').status, 400);
  assert.equal(apiOptions(request(PAGES_ORIGIN, 'POST', 'authorization'), 'POST').status, 400);
});

test('Pages receives validation errors as well as successful JSON; same-origin remains usable', async () => {
  const response = apiJson(request(), {error: 'Ungültiges Datum'}, {status: 400, headers: {'Cache-Control': 'no-store'}});
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), PAGES_ORIGIN);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Vary'), 'Origin');
  assert.deepEqual(await response.json(), {error: 'Ungültiges Datum'});
  assert.equal(rejectOrigin(new Request('https://railatlas-europa.cocoaamber33.chatgpt.site/api/stations')), undefined);
});
