import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = JSON.parse(fs.readFileSync(new URL('../schema/railatlas.graph.schema.json', import.meta.url), 'utf8'));
const edge = schema.properties.edges.items.properties;

for (const key of ['country','railway','infrastructure','source_refs']) {
  assert.ok(edge[key], `missing edge schema property: ${key}`);
}

const infra = edge.infrastructure.properties;
for (const key of [
  'usage','service','tracks','gauge_mm','electrified','voltage_v','frequency_hz',
  'maxspeed_kmh','operator','infrastructure_manager','line_ref','bridge','tunnel',
  'layer','signalling','traffic_mode'
]) {
  assert.ok(infra[key], `missing infrastructure schema property: ${key}`);
}

const refs = edge.source_refs.properties;
for (const key of ['osm_way_id','osm_relation_ids','rinf_id','national_ids']) {
  assert.ok(refs[key], `missing source_refs schema property: ${key}`);
}

console.log('infrastructure schema regression OK');
