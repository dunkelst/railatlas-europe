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

Öffentliche Netz- und Browserabnahme folgt nach dem GitHub-Rollout und wird
im Abschluss ergänzt.
