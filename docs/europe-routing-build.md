# Europe routing build

RailAtlas routing coverage is built as a reproducible Europe-wide dataset, not as hand-authored routes.

## Pipeline

1. Download/update OpenStreetMap PBF extracts.
2. Keep routable railway infrastructure and relevant operational points.
3. Normalize topology and infrastructure attributes with `tools/osm_pbf_builder.py`.
4. Partition output into bounded routing bundles.
5. Emit stable cross-bundle portals.
6. Register bundles in `data/bundles.json`.
7. Run graph QA and cross-bundle routing tests.

## Bundle contract

Every production bundle must expose:

- `id`, `country`, `bbox`, `graph`, `version`, `built_at`
- `source.type`, `source.ref`, `source.timestamp`
- `neighbours[]`
- `portals[]` with stable `portal_id`, local `node_id`, neighbouring bundle and source identity
- coverage counts for nodes, edges and operational points

Portal identity must come from stable source/topology identity where possible. Coordinate proximity alone must not join bundles.

## Infrastructure preservation

Graph edges should preserve available railway metadata including railway/usage/service, tracks, gauge, electrification, voltage, frequency, maxspeed, operator/ref, tunnel and bridge. Missing attributes stay unknown; they are not fabricated.

## Scaling

The browser loads only endpoint bundles plus bundles on the bundle-metagraph corridor. Atlas viewport state must never determine or discard the active journey graph.

## Acceptance gates

Production routing is not considered Europe-capable until automated tests cover local, national and international journeys. Initial gates:

- Heilbronn -> Würzburg (local regression)
- Stuttgart Hbf -> Lemgo (multi-bundle Germany)
- Bern -> Amsterdam -> Berlin (cross-border/multi-bundle)
- Paris -> Wien (long cross-border corridor)

Tests must distinguish `location_not_found`, `graph_missing`, `graph_gap` and `no_path`.

## Timetable boundary

The physical RailGraph remains independent from timetable data. GTFS/NeTEx/national adapters join timetable stops to canonical operational points. Scheduled and realtime values remain separate. Timetable routing can later use RAPTOR/CSA while RailGraph supplies infrastructure geometry and attributes.
