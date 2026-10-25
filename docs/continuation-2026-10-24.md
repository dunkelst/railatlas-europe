# RailAtlas Europa – aktueller Fortführungsstand

Aktualisiert am 25.10.2026. Projekt `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Verbindlicher Auftrag

Bestehendes Projekt und gemeinsame App-Basis fortführen. GitHub soll denselben
funktionsfähigen Quellstand enthalten und eigenständig betreibbar sein.
Öffentliche Testnutzung ist ausdrücklich erlaubt; die aktuelle Freigabe bleibt
erhalten. Keine zweite Anwendung, keine Weiterleitung als GitHub-Ersatz.

## Aktuell gesichert und veröffentlicht

Version **20**, Quelle `9e4953340c2fb3a0afc23beac2275b2e597e6e50`,
185 App-Dateien im Herkunftsmanifest. Die Veröffentlichung wurde nativ bestätigt.
72 Tests, TypeScript und alle drei Builds sind erfolgreich. Zwei reale Fälle
wurden anschließend sowohl über die öffentliche API als auch über den eigenen
Node-HTTP-Server mit HTTP 200 und je drei Optionen geprüft:

- Rohdental → Punkt nahe U Turmstraße: 26.10.2026, 06:53–12:49, mit Gehweg über
  Bellevue, Bus 27/20, S5, ICE 553 und S7.
- Tannenweg → Punkt am Bahnhof Hessisch Oldendorf: 06:45–07:14, anfangs 341 m
  zu Fuß. Quellgehzeit sechs Minuten; zwei Minuten Reserve vor Bus 27 um 06:53.

Neue Funktionen: freiwillige Fußweg-Optionen mit Budget (15/30/60 Min. und 3 km
je Teilstrecke), rote gestrichelte Quellwege und Kennzeichnung, mehrere auswählbare
Reisen sowie Neuplanung ab gewähltem Reisehalt mit verbleibenden Zwischenzielen.
Ein künstliches Testnetz bestätigt bessere Ankunft trotz anfänglicher Rückfahrt.

Die jüngsten Änderungen mussten aus dem gespeicherten Stand rekonstruiert werden:
Ungesicherte Dateien des vorherigen Umgebungsausfalls waren verloren. Dieser neue
Stand wurde tatsächlich neu geprüft, gesichert und veröffentlicht.

## Nächste sachliche Schritte

1. Neue Oberfläche praktisch im Browser abnehmen, sobald die zulässige Vorschau
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

Der stündliche Dev Cycle ist wieder aktiviert. Vor Änderungen neueste gesicherte
Quelle lesen, keine parallelen Änderungen am selben Projekt erzeugen und nur
echten geprüften Fortschritt veröffentlichen. [Ausbauvertrag](routing-resilience.md).
