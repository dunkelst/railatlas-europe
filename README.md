# RailAtlas Europe

Interaktiver Eisenbahnatlas für Europa – als moderne Weiterentwicklung der Idee eines klassischen Bahnatlas.

## MVP v0.1

- OpenStreetMap Basiskarte
- OpenRailwayMap Overlay
- iPad-taugliches responsives Layout
- Referenzroute Heilbronn Hbf → Würzburg Hbf
- Atlas-/Route-/Zeitplan-Tabs
- interaktive Zeitachse mit Positionsmarker
- PWA-Manifest und Service Worker
- automatisches Deployment über GitHub Pages

> Hinweis: Route und Uhrzeiten sind in v0.1 noch Demo-/UI-Daten. Sie sind kein Live-Fahrplan.

## Zielarchitektur

RailAtlas Europe soll Infrastrukturkarte, Streckenplanung und Fahrplan kombinieren. Geplant sind offene bzw. lizenzierbare Datenquellen wie OSM/OpenRailwayMap, ERA/RINF sowie GTFS/NeTEx-/nationale Fahrplandaten.

## Roadmap

1. echter Rail-Graph statt Demo-Geometrie
2. Betriebsstellen- und Infrastrukturdaten
3. DELFI/GTFS für Deutschland
4. ERA/RINF und Länderadapter für Europa
5. grenzüberschreitendes Routing
6. historische Strecken
7. Echtzeitdaten
8. Offline-/PWA-Ausbau

## GitHub Pages

Der Workflow `.github/workflows/pages.yml` veröffentlicht den Inhalt von `main` automatisch als GitHub Pages Site.
