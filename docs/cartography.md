# RailAtlas Europe – cartographic design

The visual target combines the information density of a printed railway atlas with interactive, zoom-dependent detail.

## Design principles

RailAtlas should not imitate fixed paper sheets. It should preserve the useful railway-atlas hierarchy while using continuous pan/zoom and progressive disclosure.

### Zoom hierarchy

- **Europe overview (z 4–6):** countries, major cities, principal railway corridors, high-speed/main lines, borders and water.
- **National network (z 6–8):** complete passenger/main network, major freight corridors, line references where space permits, important operational points.
- **Regional atlas (z 8–11):** all railway lines, branches, junctions, stations, line numbers, electrification and infrastructure attributes.
- **Local / node detail (z 11+):** individual tracks where data supports them, switches/junction topology, yards, depots, platforms, bridges, tunnels and signalling-related infrastructure.

## Visual hierarchy

The old printed atlas is valuable because rail infrastructure remains visually dominant over the geographic background. RailAtlas should keep that principle.

1. Railway topology
2. Operational points and junctions
3. Route/line references and infrastructure attributes
4. Settlements, boundaries and water
5. General road/background geography

The base map must remain subdued enough that railway data is legible.

## Railway styling

Railway colour must describe a selected infrastructure property rather than being decorative. The user should be able to switch the colouring mode.

Suggested modes:

- network class / usage
- electrification system
- maximum speed
- number of tracks
- operator / infrastructure manager
- gauge
- signalling / control system where data exists
- historical / disused status

Route highlighting is independent of infrastructure colouring and is always rendered above the atlas layer.

## Labels

Labels should be priority-driven and collision-aware.

Priority order:

1. selected route and selected operational point
2. major stations / junctions
3. line or route references
4. regional stations
5. infrastructure details

At high zoom, a selected segment can expose a compact data card instead of forcing every attribute onto the map.

## Printed-atlas concepts replaced digitally

- fixed pages → continuous map
- edge page references → seamless pan/zoom
- inset maps → automatic local detail level / focus mode
- static legend → active legend for the selected infrastructure layer
- printed index → search across canonical operational points and external identifiers
- fixed scale → scale-aware rendering

## Target UI

The map is primary. A compact information panel should show the selected object, current layer legend and route/timetable context. Mobile and tablet layouts should allow the panel to collapse so the atlas remains usable full-screen.
