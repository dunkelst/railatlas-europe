# RailAtlas Europe – data architecture

RailAtlas keeps four concerns separate so national data sources can be replaced without changing the routing core.

## 1. Topology
Canonical railway graph used for path finding.

- `nodes`: junctions, endpoints and snapped operational points
- `edges`: directed traversable railway segments with geometry and length
- source: primarily OpenStreetMap-derived build artifacts
- browser consumes versioned, compressed regional graph bundles rather than querying Overpass for each route

## 2. Infrastructure
Attributes attached to graph entities, independent of timetable service.

Examples: railway type, usage, tracks, gauge, electrification, voltage, frequency, max speed, operator, infrastructure references, signalling and country.

OSM provides baseline attributes. ERA/RINF and national sources can enrich them.

## 3. Operational points and identifiers
A physical station or operational point is a canonical RailAtlas entity with multiple external identifiers.

Suggested object:

```json
{
  "id": "ra:op:de:heilbronn-hbf",
  "name": "Heilbronn Hbf",
  "country": "DE",
  "location": [9.2081, 49.1421],
  "identifiers": {
    "osm": [],
    "rinf": [],
    "uic": [],
    "national": [],
    "gtfs_stop_id": []
  }
}
```

Do not use coordinates or names as primary identity.

## 4. Timetable and realtime
Timetable journeys reference canonical operational points and graph paths. Scheduled and realtime data must not alter the infrastructure graph.

Adapters can ingest GTFS, NeTEx and national feeds and map their stop identifiers onto RailAtlas operational points.

## Regional bundle contract

A regional graph bundle should contain:

```json
{
  "schema": "railatlas.graph/1",
  "region": "de-bw-north-franconia",
  "generated_at": "...",
  "nodes": [],
  "edges": [],
  "operational_points": [],
  "source_metadata": {}
}
```

Edges should at minimum expose `id`, `from`, `to`, `geometry`, `length_m`, `railway`, `service`, `usage`, `tracks`, `gauge_mm`, `electrified`, `voltage_v`, `frequency_hz`, `maxspeed_kmh`, `operator`, `ref`, and `country`.

## v0.2 acceptance test

1. Load a real regional graph bundle covering Heilbronn–Würzburg.
2. Resolve Heilbronn Hbf and Würzburg Hbf to canonical operational points.
3. Snap both points to graph nodes.
4. A* computes the route without a hard-coded station sequence.
5. UI draws edge geometry and derives distance from graph edges.
6. Selecting an edge exposes known infrastructure attributes and explicitly marks unknown values.
7. No timetable data is required for routing to work.

Only after this test passes should DELFI/GTFS/NeTEx timetable mapping become the next milestone.
