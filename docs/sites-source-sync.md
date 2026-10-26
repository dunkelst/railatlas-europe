# Gemeinsamer RailAtlas-Quellstand

Sites-Version **26**, Quellcommit `72f0ef86e9e6c89b9b90deb510ec6c0b26ecf917`.
**199** Dateien liegen bytegleich unter `sites/railatlas-europa`; das generierte
`tsconfig.tsbuildinfo` ist ausgenommen. Das Manifest enthält Git-Blobs, SHA-256
und Dateigrößen. Die Paritätsprüfung läuft vor der Installation in GitHub CI.

Der eigene Programmcode ist AGPL-3.0-only. Lizenztext, Umfang, Build- und
Startanleitung sowie die vollständigen entsprechenden Quellen sind öffentlich.
Version 26 ist gespeichert und lokal geprüft. Die native Veröffentlichung
erfolgt nach diesem GitHub-Abgleich. Version 24 bleibt als geprüfter historischer
Stand unten dokumentiert.

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

## Neuer Quellstand 26

103 Regressionen, TypeScript und alle drei Builds erfolgreich. Der gemeinsame
Node-HTTP-Server liefert für Friedhof → Römerstraße HTTP 200 mit drei echten
Transitous-Reisen, darunter Bus 11 → Quellfußweg → 32, 21:09–21:33 Europe/Berlin.
Die zusätzliche Fahrplanquelle wird erst nach erfolgloser ÖBB-/EFA-Abfrage und
vor DB verwendet. Erfolgreiche bestehende Quellen brauchen keinen Zusatzabruf.
Native Stop-IDs, Zeit-/Endpunktprüfung, Ausfälle, Attribution, begrenzte Abfrage
und offene unbestätigte Fahrzeuggeometrie bleiben im gemeinsamen App-Modell.

Die öffentliche Version-25-API hat den gemeldeten Fall und die Rückrichtung mit
HTTP 200 und je drei Optionen bestätigt. Die OSM-Auswahl über das veröffentlichte
Browserformular liefert ebenfalls drei Optionen. Der Abschlussstand 26 ersetzt
technische START/END-Labels durch die ausgewählten Namen und kennzeichnet
unbestätigte Geometrie zutreffend. Finale UI-Prüfung folgt nach Veröffentlichung.

## Historische Nachweise von Version 24

- 97 App-Regressionen, TypeScript, Worker-, Pages- und Standalone-Clientbuild.
- Echte gemeinsame Node-HTTP-API: Bus-/Fernbushalte in Heilbronn 7, London 12,
  Amsterdam 6 und Prag 10, jeweils HTTP 200 mit Attribution und Originalkennungen.
- Tatsächliche EFA-Linien 40/45 in Welsede bleiben erhalten. Vier gelieferte
  DELFI-/VBN-Einträge ergeben zwei Marker mit allen Kennungen.
- Quellenzusammenführung, Ausfälle beider Quellen, Größenbegrenzung, Retry-After,
  Abbruch und strikte Stationsübernahme für Start/Ziel/Zwischenziel sind geprüft.
- Keine öffentlichen Aufrufe der experimentellen Transitous-Linienkarte.
- Öffentliche Version-24-API: Heilbronn 7, London 12, Amsterdam 6 und Prag 8
  Halte, jeweils HTTP 200. Die ursprüngliche Node-Probe mit zehn Prager
  Einträgen erfolgte vor der Zusammenführung überlappender Feeds.
- Öffentliche Welsede-API: Linien 40/45 und zwei Halte mit vier Originalkennungen.
  Ausgelieferter AGPL-Text HTTP 200 und bytegleich mit LICENSE.
- Verbundener Chrome: Kartenhalte ohne Reise sichtbar; Übernahme als Start
  (HN Harmonie/Hafenmarktpass.), Zwischenziel (Berliner Platz Ost) und Ziel
  (Pfühlpark) geklickt und in den jeweiligen Feldern bestätigt.
  [Protokoll und Bildschirmfoto](qa/railatlas-v24.md).
- Die interne Vorschau blieb wegen DNS unerreichbar. Öffentliche Oberfläche
  wurde auf dem regulären Produktionshost geprüft; keine Ersatzhosts.

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
