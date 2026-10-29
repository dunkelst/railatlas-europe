# RailAtlas 34 – Abschluss der Mexiko-Nacharbeit

Sites-Version 34, Quellcommit `2a899e4c0b2897c3934b30cb29ef8fe2a9a8e465`,
öffentlich veröffentlicht am 29.10.2026. 1.023 App-Dateien werden bytegleich nach
GitHub gespiegelt. Funktionsumfang und alle Daten bleiben gegenüber Version 33
unverändert.

Version 34 ergänzt ausschließlich die explizite TypeScript-Angabe
`Station & {distance:number}` beim vorhandenen Nahbereichsabruf. Der strenge
GitHub-Typcheck hatte dort in Version 33 einen impliziten `any`-Parameter erkannt.
Der vorhandene Abstand wird durch `nearestStations` tatsächlich berechnet; die
Typangabe erzeugt weder neue Haltepunkte noch neue Fußwege.

Der explizite TypeScript-Prüfbefehl und Worker-, Standalone- und Pages-Build
sind erfolgreich. Die 140 Regressionen prüfen weiterhin die unveränderte
Verarbeitungslogik. Die eigentliche CI-Abnahme erfolgt mit den GitHub-Actions-
Läufen dieses Abschlusscommits.

[Funktionsnachweis, öffentliche API-Messwerte und Bildschirmfotos](railatlas-v33.md):
CUN/MEX und Terminalsuche; CUN als Start, MEX als Ziel, MTY als Zwischenziel;
43 erfolgreiche Stationsproben; unterschiedliche tatsächliche Monterrey-Zielhalte
mit 63 m Abstand und bewusster Übernahme; drei Busreisen im öffentlichen Browser.
Auch GitHub Pages hat CUN als Start und America/Cancun sichtbar bestätigt.
Europa-Regionswechsel und Bern–Amsterdam–Berlin-Zwischenziel bleiben im Browser
funktionsfähig. Der ursprüngliche Screenshot-Request ist nicht vollständig bekannt;
getestet sind die im Bericht genannten konkreten Eingaben.

ADO-Flughafenbusse sind weiterhin keine intern angebundene Fahrplanauskunft.
Die geprüfte CUN–ADO-Cancún-Anfrage bleibt eine transparente leere Antwort, mit
separatem Link zur offiziellen Anbieterauskunft. Keine flächendeckende mexikanische
Reiseplanung und keine aus Kartengeometrien erfundenen Abfahrtszeiten.
