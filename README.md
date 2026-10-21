# RailAtlas Europe

Interaktiver Eisenbahnatlas für Europa – als moderne Weiterentwicklung der Idee eines klassischen Bahnatlas.

## Aktueller Sites-Stand

Die funktionierende, privat betriebene Website liegt unter [RailAtlas Europa](https://railatlas-europa.cocoaamber33.chatgpt.site). Ihr vollständiger Quellstand befindet sich unter [`sites/railatlas-europa`](sites/railatlas-europa), einschließlich auswählbarer ÖBB-/VRR-EFA-Serverauskunft, 54.114 Stations-/Haltestelleneinträgen, Zwischenzielen, echten gelieferten Streckenverläufen, ÖPNV-Produkten und zeitbezogenen Störungsmeldungen.

Der aktuelle Abgleich übernimmt Sites-Version **10** aus Quellcommit `8a33978826e2ff0379363acb471196a8777c8154`. Die [Dateiliste mit Prüfsummen](docs/sites-source-manifest.json) macht den Abgleich nachvollziehbar; generierte TypeScript-Zwischendaten, lokale Zugangsdaten, Buildausgaben und Arbeitsdateien gehören nicht zum Snapshot. [Prüfergebnisse und Datenlücken](sites/railatlas-europa/QA.md) sowie [Start-/Buildanleitung](docs/sites-source-sync.md) stehen im Repository.

Das GitHub-Repository behält seine bestehende Sichtbarkeit. Der hier abgelegte Quellcode ist unabhängig von der Eigentümeranmeldung der laufenden Sites-Website. Die Sites-Version wurde privat bereitgestellt; der Quellabgleich wird auf `main` übernommen. Die vorhandene Graph-/OSM-Pipeline und ihre Tests bleiben erhalten.

## Bisheriger statischer Atlas und Graph-Pipeline

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

Die Adresse [RailAtlas auf GitHub Pages](https://dunkelst.github.io/railatlas-europe/) führt automatisch zur aktuellen privaten Sites-App. GitHub Pages führt keinen Servercode aus und zeigt deshalb keinen zweiten Fahrplanplaner. Der Pages-Workflow veröffentlicht ausschließlich diesen Einstieg aus `.pages-dist`; Quellcode, Testdaten und interne Builddateien werden nicht als Website-Artefakt hochgeladen. Der bisherige statische Atlas und die Graph-Pipeline bleiben im Repository erhalten.

Die aktuelle App kann über `npm run install:app`, `npm run dev`, `npm run build` und `npm run test:app` vom Repository-Stamm aus bedient werden. Siehe [Startanleitung](docs/sites-source-sync.md).
