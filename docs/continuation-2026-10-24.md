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

Version **26**, Quelle `72f0ef86e9e6c89b9b90deb510ec6c0b26ecf917`,
199 App-Dateien im Herkunftsmanifest. 103 Tests, TypeScript und alle drei Builds
bestanden. Nativ veröffentlicht, im Browser geprüft, Codecommit in beiden CI-Läufen
erfolgreich. Publikum unverändert. Vorige Version-24-Nachweise sind historisch.

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

## Aktueller Fehler behoben: fehlende Fahrplananbindung

Der Nutzer meldete Friedhof → Neckargartach Römerstraße als nicht suchbar.
ÖBB-/EFA-Namensauflösung verfehlt die lokalen Bushalte. EFA erkennt die DHIDs,
liefert aber keine Reise (BROKER -10015/-4000). Eine echte Transitous-Abfrage
liefert drei vollständige Reisen. Die automatische gemeinsame API bindet diese
Quelle nach erfolglosen bisherigen Auskünften ein, vor DB. Node-HTTP: 200 mit
Bus 11/Quellfußweg/32, 21:09–21:33 Europe/Berlin am 26.10.2026.
Nur nutzerangestoßen, eine begrenzte Anfrage je Teilstrecke, keine Folgetage.
Fahrzeuggeometrie ohne bestätigte Herkunft bleibt offen; Quellfußwege sind sichtbar.
Die gemeinsame UI enthält die Attribution auch im Reiseergebnis.

## Nächste Schritte und Grenzen

1. Version 26 ist veröffentlicht und die gemeldete Suche im Browser bestätigt.
   [Aktuelles Prüfprotokoll](qa/railatlas-v26.md). Historische Version 24: HTTP 200 in vier Ländern;
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
