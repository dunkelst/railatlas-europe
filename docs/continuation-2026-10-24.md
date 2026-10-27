# RailAtlas Europa – aktueller Fortführungsstand

Aktualisiert am 27.10.2026. Projekt `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Auftrag und aktueller Quellstand

Bestehende Site und gemeinsame App-Basis fortführen. GitHub soll denselben
funktionsfähigen Quellstand enthalten und eigenständig betreibbar sein.
Öffentliche Testnutzung ist erlaubt. Der Eigentümer hat am 26.10.2026 ausdrücklich
AGPL für den eigenen Programmcode und die Nutzung der breiteren Haltequelle
freigegeben. AGPL-3.0-only ist umgesetzt; Fremddaten behalten ihre Bedingungen.
Keine zweite Anwendung und keine Weiterleitung als GitHub-Ersatz.

Version **27**, Quelle `2ac3e41f0a72fdc25e28b8d1ea56f672a47e7952`,
200 App-Dateien im Herkunftsmanifest. 109 Tests, TypeScript und alle drei Builds
bestanden. Veröffentlicht; öffentliche API und Browserprüfung erfolgreich.
Beide GitHub-Prüfungen sind erfolgreich, 200 App-Dateien bytegleich. Publikum
unverändert. Vorige Version-24–26-Nachweise sind historisch.

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

## Aktueller Fix: Faro → Madrid

Die reale Quelle liefert drei Reisen; der ursprüngliche Katalogpunkt liegt aber
245 m neben dem gelieferten Zugangsweg. Eine exakte, länder- und lagegeprüfte
Zuordnung findet den nativen Flughafenhalt 523 m entfernt. Nur Katalogeinträge
ohne Anbieterkennung werden so aufgelöst; keine GPS-/Kartenpunktverschiebung.
Native Bahn-/U-Bahn-Stationszugänge bis 250 m und maximal Quellgehstrecke werden
als teilweise geliefert benannt, ohne Rohpunkte oder Zeiten zu verändern. Die
30-m-Prüfung bleibt bei Koordinaten, Bus und Tram. Konkrete Fehlermeldung bei
unbestätigten Wegen. Caches, Ausfallverhalten, Retry-After und Abbruch geprüft.
Node-HTTP 200, drei Reisen. 31.10.2026 ab 09:00 Berlin: erste 10:30–17:13 Berlin,
FlixBus 1794 / EA / AVE. Die Zeitbasis ist weiterhin ausdrücklich Europe/Berlin.

## Nächste Schritte und Grenzen

Version 27 ist abgenommen: Faro → Madrid und Heilbronn Friedhof → Neckargartach
Römerstraße jeweils HTTP 200 mit drei Reisen. Faro-Browserprüfung zeigt die
Alternativen, 523 m Katalogzuordnung und 62 m Stationszugang.
[Aktuelles Prüfprotokoll](qa/railatlas-v27.md). Historische Version 24: HTTP 200
in vier Ländern; Start, Zwischenziel und Ziel aus echten Busmarkern übernommen.
[Historischer Nachweis](qa/railatlas-v24.md).

1. Linienabdeckung mit Original-GTFS-Shapes bzw. OSM-Routen ausbauen. Berechnete
   Wege nicht als bestätigte Liniengeometrie ausgeben.
2. Eigene Ausweichsuche mit mehreren Umstiegspunkten und anfänglicher Rückfahrt
   auf Basis vollständiger echter Fahrplanantworten ausbauen.
3. Europäische Fahrplanabdeckung verbessern; ein Kartenhalt bestätigt keine
   verfügbare Verbindung. DB-403 nicht wiederholt testen oder umgehen.
4. Neuer Pages-Rollout erst mit freigegebenem eigenem öffentlichen HTTPS-Server.
   Bis dahin bleibt Pages Version 12. Keine bezahlte Infrastruktur beauftragen.

Geometrien und Gehzeiten werden nicht erfunden. Fahrzeugzeiten bleiben
unverändert; Koordinaten-Endpunkte auf 30 m begrenzt. Kein GPS-Livenachweis.
Europaweite Quellen-, Echtzeit- und Sperrungsabdeckung bleiben partiell.
Die frühere stündliche Automation ist deaktiviert/gelöscht und wird ohne neuen
Auftrag nicht eingeschaltet. Vor Änderungen neueste Quelle lesen und nur echten
geprüften Fortschritt veröffentlichen. [Ausbauvertrag](routing-resilience.md).
