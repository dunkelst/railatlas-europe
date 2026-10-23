# RailAtlas Europa

[**App auf GitHub Pages öffnen**](https://dunkelst.github.io/railatlas-europe/)

Die GitHub-Seite führt die vollständige RailAtlas-Oberfläche selbst aus: europäische Bahnhofssuche mit Eingabevorschlägen, 54.114 Katalogeinträge, Karten-/Standortauswahl, Zwischenziele mit Aufenthalt, Bahn und ÖPNV sowie verfügbare zeitbezogene Störungsmeldungen. Sie bleibt unter der GitHub-Adresse und leitet nicht zu einer anderen Website weiter.

## Ein gemeinsamer Quellstand

`sites/railatlas-europa/app/page.tsx`, die Komponenten, Styles und Daten werden sowohl für GitHub Pages als auch für [Sites](https://railatlas-europa.cocoaamber33.chatgpt.site) gebaut. Der vollständige Stand entspricht Sites-Version **12**, Quellcommit `4487d1c3111ef4a0678a48c92d224bfd99bf0e74`. Die [Dateiliste mit Prüfsummen](docs/sites-source-manifest.json) und `node tools/verify-sites-source.mjs` prüfen den Abgleich.

GitHub Pages liefert HTML, JavaScript und Daten aus diesem Repository. Die Oberfläche ruft für die Live-Auskunft die gemeinsame Sites-API (`/api/stations`, `/api/journeys`) auf. GitHub Pages kann keinen Worker ausführen; die angebundenen Anbieter erlauben keine direkten Browserabfragen. Die API ist für öffentliche Tests freigegeben und erlaubt Browseranfragen vom GitHub-Ursprung ohne Anmeldeinformationen. Es gibt keine versteckte Weiterleitung, fest eingebauten Beispielverbindungen oder erfundene Ersatzrouten.

## Ausführen und prüfen

Linux, Node.js ab 22.13 und pnpm 11.25.0/Corepack sind erforderlich.

```bash
npm run install:app
npm run dev          # vollständige App mit lokaler Serverauskunft
npm run test:app     # Fahrplan-/Stations-/Geometrie-/CORS-Regressionen
npm run build       # Sites-Worker und Client
npm run build:pages # dieselbe UI als statische GitHub-Seite
```

[Start-/Buildanleitung](docs/sites-source-sync.md), [bisherige Live-Prüfungen und Grenzen](sites/railatlas-europa/QA.md).

## Auskunft und Datenabdeckung

- ÖBB / Scotty: europäische Auskunft einschließlich gelieferter DB-Verbindungen und ÖPNV-Produkte. Keine gesonderte direkte DB-/VBB/Fahrinfo-Anbindung.
- VRR / EFA OpenService: auswählbarer Testzugang für ÖPNV-Verbindungen, ohne zugesicherte Produktivverfügbarkeit. EFA-BW und Trainline Partner Solutions sind nicht freigeschaltet.
- Verbindungen und Streckengeometrie kommen aus tatsächlichen Anbieterantworten. Fehlende Geometrie bleibt offen. Ausfälle und ausdrücklich nicht berücksichtigte Sperrungen führen zum Ausschluss des betreffenden Vorschlags; verfügbare Gründe bleiben sichtbar.
- Echtzeit- und Sperrungsabdeckung bleiben **partiell**. Eine leere Meldungsliste bestätigt keine störungsfreie Fahrt.
- Stationskatalog: Trainline EU / stations, ODbL 1.0; Lizenz unter `sites/railatlas-europa/public/data`.

Die öffentliche Testnutzung wurde vom Eigentümer freigegeben. Es gibt keine Nutzerkonten oder gespeicherten persönlichen Reiseprofile.

## Infrastruktur- und Graph-Werkzeuge

Die bestehende OSM-/Graph-Pipeline, Katalog-/Crosswalk-Logik, Daten unter `data/` und ihre Regressionen bleiben erhalten. `npm test` führt diese Node-/Python-Prüfungen aus; Python-Abhängigkeiten stehen in `requirements-builder.txt`. Die alten Root-Dateien des statischen Atlas werden nicht als aktuelle Pages-App veröffentlicht.

Der Pages-Workflow veröffentlicht ausschließlich `sites/railatlas-europa/dist-pages`. Ein früherer Service Worker wird ohne Navigation abgelöst; Live-Fahrpläne werden nicht als Offline-Ergebnisse gespeichert.
