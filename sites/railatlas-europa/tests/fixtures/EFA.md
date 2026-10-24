EFA regression samples were fetched on 24 October 2026 from the public planner
at https://www.efa.de/efa/ (rapidJSON version 11.0.6.72).

The three `efa-stops-*.json` files are actual StopFinder replies for Rohdental,
Hessisch Oldendorf Bahnhof and Heilbronn Finanzamt. Their provider IDs remain
separate from ÖBB EVA and VRR IDs.

The two `efa-*-trip.json.gz` files preserve the first journey and the top-level
metadata of actual trip replies for 26 October 2026, requested at 08:00
Europe/Berlin (07:00 UTC). Additional alternatives were omitted to keep these
regression files small; the retained journey, stop sequence, notices and full
route coordinates are unmodified. Gzip is only repository compression.

Queries used the actual StopFinder IDs:

- Rohdental (`de:03252:2320`) → Hessisch Oldendorf Bahnhof (`de:03252:2010`).
- Heilbronn Finanzamt (`de:08121:3033`) → Rohdental (`de:03252:2320`).

These are historical parser fixtures, never a runtime timetable or fallback.
