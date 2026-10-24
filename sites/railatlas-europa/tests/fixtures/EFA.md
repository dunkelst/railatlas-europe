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

The additional reverse-route sample Rohdental → Heilbronn was fetched on
24 October 2026 for 26 October at 06:00 Europe/Berlin. Its first complete
journey is retained, including the actual EFA product class 97 (stay seated)
between buses 27 and 20. It tests through-services and transfer counts.
