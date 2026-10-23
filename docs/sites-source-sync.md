# Gemeinsame App für Sites und GitHub Pages

`sites/railatlas-europa` enthält den vollständigen Quellstand der Sites-Version 11, Commit `0da7f1aa0ad19afaf83f476a1a23435ef581e67b`. 153 Dateien sind bytegleich übernommen; ausschließlich das generierte `tsconfig.tsbuildinfo` ist ausgenommen. `sites-source-manifest.json` enthält Herkunft und SHA-256-Prüfsummen. `node tools/verify-sites-source.mjs` prüft sie in CI und vor jeder Pages-Veröffentlichung.

## Laufzeit

| Bestandteil | Sites | GitHub Pages |
| --- | --- | --- |
| React-Oberfläche | `app/page.tsx` und gemeinsame Komponenten | dieselben Dateien, über `github-pages/entry.tsx` eingebunden |
| Styles, Katalog, Leaflet | lokale öffentliche Dateien unter `/` | dieselben Dateien unter `/railatlas-europe/` |
| Bahnhofssuche und Routen | eigene `/api/stations` und `/api/journeys` | Aufruf derselben Sites-API, kein Seitenwechsel |
| Fahrplan und Sperrungslogik | `lib/journey.mjs`, `transit.mjs`, `vrr.mjs` | dieselbe Serverlogik über die API |

Die getrennten Builds sind nötig, weil GitHub Pages ausschließlich statische Dateien ausführt. Es gibt keine zweite UI- oder Routing-Implementierung. `lib/urls.mjs` berücksichtigt den jeweiligen Asset-Pfad und API-Ursprung. Die statische Build-Konfiguration enthält nur öffentliche URLs, keine Tokens. Die Sites-API liefert CORS-Header für `https://dunkelst.github.io`; Fehler und OPTIONS sind eingeschlossen. CORS ist eine Browserfreigabe, keine Anmeldung oder Zugangssicherung des öffentlichen Testservers.

## Starten und bauen

Voraussetzungen: Linux, Node.js ab 22.13, pnpm 11.25.0 oder Corepack, GNU timeout und flock. Das Lockfile und der pnpm-Stand sind verbindlich.

```bash
npm run install:app
npm run test:app
node tools/verify-sites-source.mjs
cd sites/railatlas-europa
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build:pages
npm run build
npm run dev
```

Ohne checkout-lokales Sites-Profil nutzen die Framework-Skripte den portablen Vinext-Modus. Die lokale Entwicklungsumgebung stellt keine Zugriffssicherung für Internetbetrieb dar. Der öffentliche Testbetrieb verwendet die vom Hosting bereitgestellte Worker-Laufzeit.

`npm run build:pages` erzeugt `sites/railatlas-europa/dist-pages`. Dieses Verzeichnis wird durch `.github/workflows/pages.yml` veröffentlicht. `npm run build` erzeugt den Sites-Worker und dessen Client. Die bestehende Graph-/OSM-Regression läuft unabhängig mit `npm test`.

## Abgleich bei Änderungen

1. Den ausgewählten Sites-Quellstand prüfen, bauen und veröffentlichen.
2. Alle getrackten Quelldateien desselben Commits in `sites/railatlas-europa` übernehmen; keine Laufzeitdaten, Zugangsdaten, installierten Pakete oder Buildausgaben kopieren.
3. Das Herkunftsmanifest auf die echte Sites-Version, den Quellcommit und die Dateiprüfsummen aktualisieren.
4. Paritätsprüfung, App-Regressionen, TypeScript und Pages-Build ausführen. Der Pages-Workflow veröffentlicht den gemeinsamen Stand von `main`.
5. Die GitHub-Seite mit echten Anbieteranfragen praktisch prüfen. Auskunftslücken offen dokumentieren.

## Quellen und Grenzen

Die Auskunft nutzt ÖBB / Scotty und auswählbar VRR / EFA OpenService. VRR ist ein Testzugang ohne garantierte Produktionsverfügbarkeit. Es gibt keine gesonderte direkte DB-/VBB-Anbindung; DB-Prüflinks öffnen deren externe Auskunft. EFA-BW, die konkrete efa.de-Instanz und Trainline Partner Solutions sind nicht freigeschaltet. Der Stationskatalog steht unter ODbL 1.0.

Fehlende Streckengeometrie wird nicht ergänzt und es werden keine Fahrten erfunden. Sperrungs- und Echtzeitabdeckung bleiben partiell. Historische konkrete Live-Prüfungen stehen im gemeinsamen `QA.md`; die Prüfung dieser GitHub-Veröffentlichung wird in `github-pages-qa.md` festgehalten.
