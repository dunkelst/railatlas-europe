EFA regression samples were fetched on 24 October 2026 from the public planner
at https://www.efa.de/efa/ (rapidJSON version 11.0.6.72).

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
