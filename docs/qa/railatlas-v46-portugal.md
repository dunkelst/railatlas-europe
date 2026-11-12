# RailAtlas v46 – Portugal-Liveprüfung vom 12.11.2026

Sites: https://railatlas-europa.dunkelst.chatgpt.site
GitHub Pages: https://dunkelst.github.io/railatlas-europe/

Gemeinsame App-Quelle: `d4236c3150178e30a2cdcc198b3fdb30864bbf9a`.
GitHub-Implementierungscommit: `ac7b5f436caca7c47bea41368a4a50a96f42c0c3`.
Alle 1.047 Dateien des Herkunftsmanifests stimmen bytegenau überein.

## Bestätigt auf beiden veröffentlichten Oberflächen

- Marquês de Pombal erscheint in der Namenssuche als nativer GTFS-Halt
  `pt-Metro-Lisboa_MP`; die bisherige EU-Suche ließ diese Quelle aus.
- Übernahme als Start, Zielsuche Oriente und automatische Zeitzone Europe/Lisbon.
- Echte Metroreise über Saldanha: Sites 19:43–19:58, GitHub 19:49–20:05,
  jeweils am 12.11.2026 in Europe/Lisbon. Linien Am / Vm und gelieferter
  Stationsumstieg; auf beiden Seiten werden tatsächlich gelieferte Alternativen,
  Quelle, Fahrplanzeiten und unvollständige Störungsabdeckung angezeigt.
- Alle fünf europäischen Halteebenen sind voreingeschaltet. Im Lissabonner
  Ausschnitt erscheinen unter anderem Bahn-, Vorortbahn-, Metro- und Bushalte.

## Prüfungen und Grenzen

173/173 Node-Tests, TypeScript und Sites-/Pages-/Standalone-Build erfolgreich.
Die GitHub-Läufe für die Implementierung sind erfolgreich:

- https://github.com/dunkelst/railatlas-europe/actions/runs/43287637941 (Pages)
- https://github.com/dunkelst/railatlas-europe/actions/runs/43287637664 (App-Prüfung)
- https://github.com/dunkelst/railatlas-europe/actions/runs/43287637677 (CI)

Der Grundkatalog umfasst nur 47 portugiesische Einträge; die Online-Suche und
Netzkarte ergänzen ihn. Das ist keine vollständige Portugal-Abnahme.
Carris-Tramhalte fehlen in den geprüften zentralen Lissabonner GTFS-Ausschnitten;
die ergänzende OSM-Quelle war in separaten Proben nicht erreichbar. 15 in einem
größeren Ausschnitt gelieferte Tramhalte belegen nicht die Carris-Abdeckung.
Quelllücken werden nicht durch erfundene Halte oder Verbindungen ersetzt.

Die verwaltete Vorschau hatte externe Quellzugriffsfehler; die Live-Nachweise
oben stammen ausdrücklich aus den veröffentlichten Websites. Geräte-GPS wurde
nicht angefordert oder als live geprüft erklärt. Der bisherige Stand bleibt
gemäß [Freeze-Nachweis](../FREEZE_2026-11-12.md) separat erhalten.
