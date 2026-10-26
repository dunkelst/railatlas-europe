# RailAtlas Europa – aktueller Fortführungsstand

Aktualisiert am 26.10.2026. Projekt `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Auftrag und aktueller Quellstand

Bestehende Site und gemeinsame App-Basis fortführen. GitHub soll denselben
funktionsfähigen Quellstand enthalten und eigenständig betreibbar sein.
Öffentliche Testnutzung ist erlaubt. Der Eigentümer hat am 26.10.2026 ausdrücklich
AGPL für den eigenen Programmcode und die Nutzung der breiteren Haltequelle
freigegeben. AGPL-3.0-only ist umgesetzt; Fremddaten behalten ihre Bedingungen.
Keine zweite Anwendung und keine Weiterleitung als GitHub-Ersatz.

Version **24**, Quelle `202529ae7200ecd354bcbb7597e3f70c80932b48`,
198 App-Dateien im Herkunftsmanifest. 97 Tests, TypeScript und alle drei Builds
bestanden. Nach bytegleichem GitHub-Abgleich nativ veröffentlicht, beide CI-Läufe
erfolgreich. Öffentliche API und Chrome-Oberfläche geprüft; Publikum unverändert.

Der stabile Transitous-/MOTIS-Kartenhaltepfad ist im gemeinsamen Netzwerkmodell
angebunden. Eigene GTFS-IDs und Originalkoordinaten, keine aus Feednamen erfundenen
Länder. Der vorhandene Namens-/Standortresolver prüft Start, Ziel und Zwischenziel.
Ein Hbf-Kurzname nach Entfernen des bestätigten Stadtpräfixes wird jetzt korrekt
verglichen; fremde Orte und unpassende Produktklassen bleiben ausgeschlossen.

Node-HTTP-Nachweis: Heilbronn 7, London 12, Amsterdam 6 und Prag 10 Bus-/Fernbushalte,
jeweils HTTP 200. EFA ergänzt echte Linien und weitere Halte. In Welsede bleiben
40/45; vier DELFI-/VBN-Einträge werden als zwei Halte mit allen IDs dargestellt.
Plattformen innerhalb desselben Feeds werden nicht vereinigt. Quellenfehler
entfernen verfügbare Daten der anderen Quelle nicht. OSM-Fallback nur bei
fehlenden Daten beider Quellen. Vier-MiB-Grenze, Timeout und Retry-After gelten.
Die experimentelle Transitous-Linienkarte bleibt nur im manuellen Probeskript.

Version-20–23-Funktionen bleiben erhalten: freiwillige rote Fußweg-Notlösungen
mit Budget je Teilstrecke, Neuplanung mit offenen Zwischenzielen, Gegenrichtung
nicht geografisch ausgeschlossen, gemeinsame dunkle Formularfelder, allgemeines
Netz ohne Reise, sichtbereichsgleiche Zähler, Maßstabscache und echtes Neuladen.
Historische Fahrplanbelege stehen im App-QA-Protokoll.

## Nächste Schritte und Grenzen

1. Version 24 ist veröffentlicht und geprüft: API HTTP 200 in vier Ländern;
   Start, Zwischenziel und Ziel aus echten Busmarkern übernommen. Prager Probe
   nach Feed-Zusammenführung acht Marker; zehn Einträge vor Zusammenführung.
   [Prüfprotokoll](qa/railatlas-v24.md). Interne Vorschau blieb wegen DNS
   unerreichbar, keine Ersatzhosts verwendet.
2. Linienabdeckung mit Original-GTFS-Shapes bzw. OSM-Routen ausbauen. Berechnete
   Wege nicht als bestätigte Liniengeometrie ausgeben.
3. Eigene Ausweichsuche mit mehreren Umstiegspunkten und anfänglicher Rückfahrt
   auf Basis vollständiger echter Fahrplanantworten ausbauen.
4. Europäische Fahrplanabdeckung verbessern; ein Kartenhalt bestätigt keine
   verfügbare Verbindung. DB-403 nicht wiederholt testen oder umgehen.
5. Neuer Pages-Rollout erst mit freigegebenem eigenem öffentlichen HTTPS-Server.
   Bis dahin bleibt Pages Version 12. Keine bezahlte Infrastruktur beauftragen.

Geometrien und Gehzeiten werden nicht erfunden. Fahrzeugzeiten bleiben
unverändert; Koordinaten-Endpunkte auf 30 m begrenzt. Kein GPS-Livenachweis.
Europaweite Quellen-, Echtzeit- und Sperrungsabdeckung bleiben partiell.
Die frühere stündliche Automation ist deaktiviert/gelöscht und wird ohne neuen
Auftrag nicht eingeschaltet. Vor Änderungen neueste Quelle lesen und nur echten
geprüften Fortschritt veröffentlichen. [Ausbauvertrag](routing-resilience.md).
