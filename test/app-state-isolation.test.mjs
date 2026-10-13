import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function functionBody(start, end) {
  const a = app.indexOf(start);
  const b = app.indexOf(end, a + start.length);
  assert.notEqual(a, -1, `missing function: ${start}`);
  assert.notEqual(b, -1, `missing boundary: ${end}`);
  return app.slice(a, b);
}

const atlasRefresh = functionBody('async function ensureGraphForCurrentView()', 'function drawComputedRoute(');
assert.match(atlasRefresh, /atlasGraph\s*=\s*null/);
assert.doesNotMatch(atlasRefresh, /journeyGraph\s*=\s*null/);
assert.doesNotMatch(atlasRefresh, /activeRoute\s*=\s*null/);
assert.doesNotMatch(atlasRefresh, /activeStops\s*=\s*\[\]/);
assert.doesNotMatch(atlasRefresh, /routeLayer\.clearLayers\(/);
assert.match(app, /const result = dijkstra\(journeyGraph,/);
assert.match(app, /function nodeById\(id, source = atlasGraph\)/);
assert.match(app, /nodeById\(op\.node_id,journeyGraph\)/);

console.log('atlas / journey state isolation tests passed');
