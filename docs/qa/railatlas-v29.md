# RailAtlas Version 29 – echte allgemeine Buslinien für Tavira

28.10.2026. Sites-Quelle `ef812d4fa5830f9717cc25547bdf9222141266ca`.
201 App-Dateien entsprechen dem Herkunftsmanifest. Öffentlich gespeichert
und veröffentlicht auf https://railatlas-europa.dunkelst.chatgpt.site .

## Gemeldeter Fehler und Korrektur

Der Nutzer sah bei aktiviertem Busnetz 107 Bushalte, aber keine Linien.
Version 28 korrigierte den vorzeitig beendeten Fallback und die verworfenen
Reisegeometrien. Die OSM-Quelle war im gemeldeten Gebiet nicht erreichbar.
Version 29 bindet deshalb die bereits geprüfte öffentliche MOTIS-Linienkarte
in die gemeinsame API ein. Ein funktionierender Diagnoseparser allein erfüllte
die Produktanforderung nicht; App und Diagnose teilen jetzt dieselbe Umsetzung.

## Tatsächlich ausgeführt

Begrenzter gemeinsamer API-Abruf für 37.108,-7.69,37.145,-7.62:
55 Haltestellen und 18 Linienverläufe in rund acht Sekunden, darunter Bus
42, 67, 66, 105, 121, 41, 40 und 49 sowie Fernbusse. Zehn Verläufe sind von
der Quelle als TIMETABLE, acht als ROUTED gekennzeichnet. Die unbearbeitete
Antwort liegt gzip-komprimiert als Regressionstestfixture vor.

114 Regressionen, Typprüfung und Worker-, Pages- sowie eigenständiger Build
erfolgreich. Neue Prüfungen sichern den tatsächlichen Tavira-Fall, Original-
punkte, vorhandene Halte, getrennte Herkunft, Quellenausfälle, Abbruch und
Retry-After. Keine Fixture ist ein Laufzeitersatz.

Der positive öffentliche Reisegeometrie-Nachweis aus Version 28 bleibt gültig:
drei Faro–Madrid-Reisen mit neun Fahrzeugverläufen und 19.811 Quellpunkten.
Die GitHub-Oberfläche wurde mit diesen sichtbaren Bus-/Bahnverläufen geprüft.

## Herkunft und verbleibende Grenzen

Berechnete Linien sind gestrichelt und mit Hinweis in Karte und Popup versehen.
NONE sowie fehlende Polylinien erzeugen keine Kartenlinien. Quellfragmente
bleiben getrennt; es werden keine eigenen Verbindungen zwischen Halten erzeugt.
Die zusätzliche API auf api.transitous.org ist offiziell dokumentiert, aber
experimentell und ohne Verfügbarkeitsgarantie. Vorhandene Daten bleiben bei
Ausfall erhalten. Keine vollständige europäische Netz- oder Fahrplanabdeckung.

## Öffentliche Abnahme auf beiden Websites

Die veröffentlichte API bestätigt HTTP 200 für denselben begrenzten Tavira-
Ausschnitt: 55 Bushalte und 18 Linienverläufe, zehn TIMETABLE und acht ROUTED.
Die Antwort benötigt rund sieben Sekunden und kennzeichnet berechnete Verläufe.

Auf https://railatlas-europa.dunkelst.chatgpt.site/ und direkt auf
https://dunkelst.github.io/railatlas-europe/ wurde Tavira aus den tatsächlichen
Startvorschlägen gewählt, das Ziel geleert und Bus-Linien/Bus-Halte aktiviert.
Ohne eine Reise zu berechnen zeigen beide Browseroberflächen **18 Buslinien-
verläufe und 104 Haltestellen** im sichtbaren Ausschnitt. Linien sind sichtbar,
berechnete Verläufe und der teilweise bestätigte Status sind ausdrücklich
gekennzeichnet. Die abweichende Haltezahl zur API-Probe folgt aus dem anderen
sichtbaren Browserausschnitt, nicht aus einem Wechsel der Haltequelle.

GitHub-Implementierungscommit `c4a40c9d0ed064c788491a2c6078c8fb1b9bb752`:

- [CI erfolgreich](https://github.com/dunkelst/railatlas-europe/actions/runs/40743799218)
- [Gemeinsame App-Prüfung erfolgreich](https://github.com/dunkelst/railatlas-europe/actions/runs/40743799577)
- [Pages-Veröffentlichung erfolgreich](https://github.com/dunkelst/railatlas-europe/actions/runs/40743799262)

Die GitHub-Seite liefert das neue Produktionsasset `index-DNqePPlS.js`.
Eine zusätzliche öffentliche Nachbarprobe in Berlin (52.51,13.38,52.53,13.42)
liefert HTTP 200: U-Bahn mit U5/U8 und 18 Halten, Tram mit M4/M5/M6/M8/M10 und
22 Halten sowie S-Bahn mit 29 Linienverläufen und sechs Halten. Die vorhandene
Warnung zur begrenzten Linienauswahl bleibt sichtbar. Das bestätigt diese
gelieferten Ebenen im Prüfausschnitt, keine vollständige Berliner Abdeckung.
Der Nachtrag ändert keine App-Dateien und löst keinen weiteren Rollout aus.
Einzelne OpenRailwayMap-Kacheln waren im Test nicht erreichbar; die separat
geladenen Buslinien und Halte waren trotzdem sichtbar. Kein neuer GPS-Test
und keine Garantie vollständiger europäischer Betriebs-/Geometrieabdeckung.
