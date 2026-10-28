EFA regression samples were fetched on 24 October 2026 from the public planner
at https://www.efa.de/efa/ (rapidJSON version 11.0.6.72).

`efa-stockholm-stops.json.gz` is the complete, unmodified StopFinder response
for Stockholm from the same public endpoint, fetched 28 October 2026. It includes
the numeric Stockholm Central key 80012823 and Swedish `se:33001:nvbw_bus_*`
global stop IDs. A Germany-based service is not evidence of a German stop.
Gzip only compresses the recorded response; it is never used at runtime.

The three `efa-stops-*.json` files are actual StopFinder replies for Rohdental,
Hessisch Oldendorf Bahnhof and Heilbronn Finanzamt. Their provider IDs remain
separate from ÖBB EVA and VRR IDs.

The two `efa-*-trip.json.gz` files preserve actual trip replies for 26 October 2026, requested at 08:00
Europe/Berlin (07:00 UTC). The local Rohdental reply retains the first journey; the Heilbronn reply
retains all four alternatives for route comparison. Retained journeys, stop
sequences, notices and full route coordinates are unmodified. Gzip is only repository compression.

Queries used the actual StopFinder IDs:

- Rohdental (`de:03252:2320`) → Hessisch Oldendorf Bahnhof (`de:03252:2010`).
- Heilbronn Finanzamt (`de:08121:3033`) → Rohdental (`de:03252:2320`).

These are historical parser fixtures, never a runtime timetable or fallback.

On 26 October 2026, three independent map replies for the Welsede viewport
51.99572,9.3293,52.00299,9.35194 were recorded. These are not trip replies:

- `efa-map-welsede-stops.json`: XML_COORD_REQUEST using a WGS84 bounding box;
  actual stops Mitte (`de:03252:4450`) and Hanebülten (`de:03252:4440`).
- `efa-map-welsede-lines.json`: XML_SERVINGLINES_REQUEST with `type_sl=stopID`
  and Mitte's source ID; buses 40 and 45, both directions.
- `efa-map-welsede-geometry.json.gz`: XML_GEOOBJECT_REQUEST with the four
  returned line IDs as repeated `line` parameters and `filterDate=20261026`.
  All source coordinate sequences are preserved, including separate fragments.

GeoObject's generic product class zero is not the operating mode: the parser
joins the exact line ID to the authoritative ServingLines metadata. Fixtures
are complete source replies, gzip only compresses the geometry file. Tests
check that the map can load without any journey query and does not invent
coordinates or join geometry gaps. Source parameter documentation:
https://mobidata-bw.de/daten/portal/efa-json/EFA_JSON_API_Training_EN_2.9.pdf.

On 25 October 2026, two further complete rapidJSON replies were recorded for
26 October. `efa-rohdental-turmstrasse-walking.json.gz` uses coordinates
52.200076,9.249135 → 52.525547,13.3413274, requested from local midnight.
It retains all six returned proposals, including the impossible S51 proposal,
source status arrays, notices, stop sequences and pedestrian shapes.

`efa-first-mile-walking.json.gz` was queried from the source-confirmed Tannenweg
point 52.202257,9.247365 → 52.166577,9.244608, from 06:00 local. Its first walk
is 341 m / six minutes. Tests derive an earlier pedestrian start to provide two
minutes for boarding, preserving the original source times separately and
leaving all transit times unchanged. Query options explicitly select pedestrian
access (trITMOT=100), 30 minutes and nearby stops. A preceding probe from
52.2025,9.2465 was snapped about 65 m away and was rejected by our endpoint
validation; it is not the canonical first-mile fixture.

The additional reverse-route sample Rohdental → Heilbronn was fetched on
24 October 2026 for 26 October at 06:00 Europe/Berlin. Its first complete
journey is retained, including the actual EFA product class 97 (stay seated)
between buses 27 and 20. It tests through-services and transfer counts.
