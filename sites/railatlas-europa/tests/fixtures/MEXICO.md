# Mexican map sources, 28 October 2026

`osm-playa-colectivos.json.gz` is a subset of the original JSON returned by
`https://api.openstreetmap.org/api/0.6/map?bbox=-87.08,20.62,-87.065,20.635`.
It retains all 31 share_taxi relations in that response, their available member
ways and nodes, and explicit stop/platform members. Unrelated map objects were
removed; retained records and coordinates are unchanged. Missing members are
not fetched or joined by fabricated segments. Compression is gzip only.

Source: OpenStreetMap contributors, ODbL 1.0. Attribution and licence:
https://www.openstreetmap.org/copyright . This is a historical parser fixture,
not a timetable. No fares, intervals, schedules or current operation are inferred.

The runtime Mexico map snapshot is reproducibly built by
`scripts/build-mexico-map.py` from that same map extract and three source GTFS
files. URLs, source dates, source SHA256 and source-specific licences are retained
in `public/data/mexico-sources.json`; the original catalogue checksums are checked.
GTFS shapes and actual source stops are retained for mapping only. 497 explicitly
VIRTUAL-labelled points in Salina Cruz are excluded from the imported stop layer.
Ordinary buses and the STC Metro are not classified as Colectivos.

The country-wide OSM data comes from the public Geofabrik Mexico PBF, retrieved
28 October 2026, source timestamp 27 October 2026 21:23:59 UTC. The importer uses
the same build-only pyosmium dependency as the repository's railway importer.
`extract-mexico-transit.py` retains original public transport relations, member
ways and source nodes. `build-mexico-osm-tiles.mjs` reuses the application parser
and its clipping rules. Missing ways/nodes produce gaps. Original IDs, coordinates,
source dates, ODbL attribution and the original PBF SHA256 remain available in
`public/data/mexico-osm-source.json`. Its counts distinguish unique source IDs
from repeated cell fragments. No private OSM contributor metadata is imported.

`transitous-mexico-puebla.json.gz` preserves an actual v6 plan response for
Mexico City Buenavista (Fórum Buenavista) → Puebla (Explanada), requested
31 October 2026 at 15:00 UTC (09:00 America/Mexico_City). All three source
itineraries and exact inputs are retained. The first arrives 11:15 local.
This is a historical parser fixture, never a live timetable replacement.
