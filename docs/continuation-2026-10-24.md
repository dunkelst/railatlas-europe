# RailAtlas Europa – aktueller Fortführungsstand

Aktualisiert am 26.10.2026. Projekt `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Verbindlicher Auftrag

Bestehendes Projekt und gemeinsame App-Basis fortführen. GitHub soll denselben
funktionsfähigen Quellstand enthalten und eigenständig betreibbar sein.
Öffentliche Testnutzung ist ausdrücklich erlaubt; die aktuelle Freigabe bleibt
erhalten. Keine zweite Anwendung, keine Weiterleitung als GitHub-Ersatz.

## Aktuell gesichert und veröffentlicht

Version **21**, Quelle `6e7635875f32a0dc037d1fd9038b0661f8ee289e`,
189 App-Dateien im Herkunftsmanifest. Nativ auf der bestehenden öffentlichen Site
veröffentlicht. 80 Tests, TypeScript und alle drei Builds bestanden.

Die allgemeinen Netzschalter arbeiten ab Zoom 12 unabhängig von einer geplanten
Reise. Die frühere Overpass-Abfrage hing 40 Sekunden ohne Quelldaten; die bereits
angebundene EFA-Auskunft liefert nun Kartenhalte, deren bedienende Linien und
Geometrien über ihre nativen Kartenmethoden, ohne Fahrtsuche. OSM bleibt als
weitere Quelle erhalten. Stabile Rasterausschnitte und begrenzte Caches vermeiden
ständige Neuabfragen. Geladene Daten bleiben beim Nachladen und Fehlern sichtbar.

Live im echten Node-HTTP-Pfad und auf der öffentlichen Version-21-API:
Bus 40/45, Welsede Mitte und Hanebülten;
im erweiterten Clientausschnitt zusätzlich Jägereiche. `/api/network` liefert
HTTP 200; eine folgende Nur-Halte-Abfrage nutzt die vorhandenen Daten.
Die EFA-Stop-IDs werden für Start, Ziel und Zwischenziel erhalten, nicht als OSM
oder EVA umetikettiert. Die Quelle und partielle Abdeckung bleiben sichtbar.
Höchstens vier repräsentative Halte und zwölf Linienvarianten je Ausschnitt;
begrenzte Auswahl ausdrücklich benennen. Source-Geometriefragmente nicht verbinden.

Alle Version-20-Funktionen bleiben erhalten: freiwillige Fußweg-Optionen mit
Budget (15/30/60 Min. und 3 km je Teilstrecke), rote gestrichelte Quellwege,
mehrere vollständige Alternativen und Neuplanung ab Reisehalt mit offenen
Zwischenzielen. Historische echte Version-20-Prüfungen beider API-Pfade:
Rohdental → Punkt nahe U Turmstraße am 26.10.2026, 06:53–12:49, und Tannenweg →
Punkt am Bahnhof Hessisch Oldendorf, 06:45–07:14, je drei Optionen.
Ein künstliches Testnetz bestätigt bessere Ankunft trotz anfänglicher Rückfahrt;
daraus keine bestätigte echte Ausweichfahrt ableiten.

## Nächste sachliche Schritte

1. Allgemeines Netz und Halteübernahme praktisch im Browser abnehmen, sobald die zulässige Vorschau
   funktioniert. Keine Sicherheitsgrenze umgehen.
2. Gezielte Ausweichsuche über verschiedene Umstiegspunkte und anfängliche Fahrten
   vom Ziel weg ausbauen, auf vollständigen echten Fahrplanantworten basierend.
   Die bisherige Zulassung solcher Routen ist keine umfassende eigene Suche.
3. Reguläre Fahrplanabdeckung für weitere europäische Bus-/ÖPNV-Halte erweitern,
   ohne einen OSM-Treffer als bestätigte Bedienung auszugeben. DB-403 im Worker
   nicht wiederholt testen oder umgehen; zulässige Quellen verwenden.
4. Für den neuen Pages-Rollout einen eigenen öffentlichen HTTPS-Auskunftsserver
   einrichten, wenn ein freigegebenes Ziel vorhanden ist. Bis dahin bleibt die
   bestehende Pages-Version 12 erhalten; keine kostenpflichtige Infrastruktur
   oder Zugangsanträge ohne entsprechenden Auftrag erzeugen.

## Prüf- und Produktgrenzen

Geometrien und Gehzeiten werden nicht erfunden. Früher berechnete Fußwegzeiten
behalten Quellgehzeit und -verlauf; Fahrzeugzeiten werden nicht verschoben.
Koordinaten-Endpunkte sind auf 30 m begrenzt. Ein um 65 m verschobener EFA-Punkt
wird verworfen. Der Nutzer muss bei Neuplanung tatsächlichen Halt und Zeit prüfen.
Kein GPS-Livenachweis oder neue visuelle Browserabnahme wird behauptet.
Störungs- und europäische Fahrplanabdeckung bleiben partiell.

Vor Änderungen neueste gesicherte Quelle lesen, keine parallelen Änderungen am
selben Projekt erzeugen und nur echten geprüften Fortschritt veröffentlichen. [Ausbauvertrag](routing-resilience.md).
