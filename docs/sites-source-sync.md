# Gemeinsamer RailAtlas-Quellstand

Sites-Version **24**, Quellcommit `202529ae7200ecd354bcbb7597e3f70c80932b48`.
**198** Dateien liegen bytegleich unter `sites/railatlas-europa`; das generierte
`tsconfig.tsbuildinfo` ist ausgenommen. Das Manifest enthält Git-Blobs, SHA-256
und Dateigrößen. Die Paritätsprüfung läuft vor der Installation in GitHub CI.

Der eigene Programmcode ist AGPL-3.0-only. Lizenztext, Umfang, Build- und
Startanleitung sowie die vollständigen entsprechenden Quellen sind öffentlich.
Die neue Oberfläche wird erst nach diesem GitHub-Abgleich veröffentlicht.

| Bestandteil | Sites | Eigenständiger Node-Server | GitHub Pages |
| --- | --- | --- | --- |
| Oberfläche und lokale Assets | gemeinsame React-Dateien | dieselben Dateien | dieselben Dateien mit Repository-Präfix |
| API und Anbieterparser | `lib/api.mjs` und gemeinsame Module | derselbe Handler | ausdrücklich eingerichteter eigener Server |
| Allgemeine Netze | Transitous-/EFA-/OSM-Pfad | derselbe API-Pfad | eigene API erforderlich |

## Ausführen

Node ab 22.13, pnpm 11.25.0. Im Repository:

```bash
npm run install:app
npm run test:app
npm run build:standalone
npm run start:standalone
```

Danach http://127.0.0.1:3000 öffnen. Der eigenständige Server benötigt keinen
ChatGPT-Dienst. Ausgehende Verbindungen zu den tatsächlichen Datenquellen bleiben
notwendig. Bei eigenem HTTPS-Reverse-Proxy `PUBLIC_ORIGIN` setzen;
`HOST=0.0.0.0` erlaubt Bindung im eigenen Container.

## Nachweise des neuen Quellstands

- 97 App-Regressionen, TypeScript, Worker-, Pages- und Standalone-Clientbuild.
- Echte gemeinsame Node-HTTP-API: Bus-/Fernbushalte in Heilbronn 7, London 12,
  Amsterdam 6 und Prag 10, jeweils HTTP 200 mit Attribution und Originalkennungen.
- Tatsächliche EFA-Linien 40/45 in Welsede bleiben erhalten. Vier gelieferte
  DELFI-/VBN-Einträge ergeben zwei Marker mit allen Kennungen.
- Quellenzusammenführung, Ausfälle beider Quellen, Größenbegrenzung, Retry-After,
  Abbruch und strikte Stationsübernahme für Start/Ziel/Zwischenziel sind geprüft.
- Keine öffentlichen Aufrufe der experimentellen Transitous-Linienkarte.
- Die Browser-Erweiterung ist verbunden; die interne Vorschau war darüber wegen
  ERR_NAME_NOT_RESOLVED unerreichbar. Prüfung der veröffentlichten Oberfläche
  und der öffentlichen API folgt nach Bereitstellung.

Frühere bestätigte Funktionen bleiben erhalten: Quellenvergleich, Aufenthalt,
rote freiwillige Fußweg-Notlösungen und Neuplanung mit offenen Zwischenzielen,
maßstabsabhängiger Cache, explizites Neuladen und sichtbereichsgleiche Zähler.
Historische Fahrplanprüfungen sind im App-QA-Protokoll datiert beschrieben.

## Veröffentlichungsgrenzen

Die bestehende Pages-Veröffentlichung bleibt Version 12, bis ein eigener
öffentlicher HTTPS-Auskunftsserver eingerichtet ist. Der Pages-Workflow bleibt
manuell. Keine voreingestellte ChatGPT-API und keine Weiterleitung als Ersatz.
DB-403 im Worker wird nicht umgangen. Europaweite Fahrplan-/Störungsabdeckung
und Liniengeometrien bleiben partiell. [Ausweichplanung](routing-resilience.md).
