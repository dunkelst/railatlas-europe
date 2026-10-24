# RailAtlas Europa – Fortführung am 24.10.2026

Bestehendes Projekt: `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Verbindlicher Auftrag

Bestehendes Projekt fortführen. GitHub soll denselben funktionsfähigen Quellstand enthalten und eigenständig betrieben werden können. Öffentliche Testnutzung ist erlaubt. Eine notwendige ChatGPT-Site-Abhängigkeit genügt nicht.

## Aktueller Stand

Sites-Version **16**, Quellcommit `9831ceba1cced650f08df8db40f6d5b137fa5eda`, 169 Dateien bytegleich auf GitHub. Unabhängige Kartenebenen für Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus; Linien und Halte separat schaltbar, Bahn voreingeschaltet. Der Node-Server nutzt dieselbe Oberfläche, denselben API-Handler und dieselben Anbieterparser. Der Pages-Build hat keine voreingestellte ChatGPT-API.

Neue Korrekturen: OSM-Kartennamen dürfen den Stadtpräfix der Fahrplanquelle und U-/S-Gruppen weglassen, jedoch nur bei passendem Namen und höchstens 250 Metern Entfernung. Andere Namenszusätze bleiben erhalten. Die übernommene Ebene wird für die Prüfung ausdrücklich anders gekennzeichneter Verkehrsmittel mitgeführt. Die aufgezeichnete VRR-Antwort mit „Heinrich-Heine-Allee U“ und Stations-/Bahnsteigabstand wird unterstützt.

Der Netzdatenabruf erlaubt 40 Sekunden für Warteschlange, Verarbeitung und Transfer. Zeitablauf erhält eine lesbare Meldung und 30 Sekunden Pause; Nutzerabbruch bleibt davon getrennt. Ohne messbare Kartenfläche wird kein ungültiger Ausschnitt abgefragt.

## Ergänzte regionale Haltestellensuche

Öffis und deren öffentliches EFA-Frontend wurden geprüft. Die dahinterliegende
Instanz https://www.efa.de/efa/ findet Rohdental mit de:03252:2320, während ÖBB
hier fremde Namensvorschläge liefert. Die Standardsuche verwendet beide Quellen
und das gemeinsame Katalogranking. EFA-Verbindungen nutzen denselben bestehenden
rapidJSON-Parser wie VRR, mit getrennten IDs und eigenem Quellenhinweis.

Für den 26.10.2026 ab 08:00 Europe/Berlin live nachgewiesen: Rohdental →
Hessisch Oldendorf Bahnhof, Bus 27, 08:18–08:32, und Heilbronn Finanzamt →
Rohdental, 09:25–15:17, mit S4, Zügen und Bus 27. Die komplette Kette wurde
auch durch den eigenständigen HTTP-API-Pfad geladen. Echte Quellantworten sind
als Regressionen konserviert, niemals als Laufzeitfahrplan.

## Nachgewiesen

- 52 App-Regressionen, TypeScript, Sites-/Pages-/Standalone-Clientbuild bestanden.
- Neuer Live-ÖBB-Test über den unabhängigen Node-Pfad: synthetische Kartenformate „Karlsplatz“ → „Stephansplatz“ mit live geladenen Quellkoordinaten liefern U1 am 24.10.2026, 19:57–19:59. Dies ist kein tatsächlicher OSM-Netzdownload.
- Tatsächlich gebaute Styles und Leaflet-Dateien über den eigenständigen HTTP-Server: HTTP 200, korrekte MIME-Typen und bytegleiche Inhalte.
- Veröffentlichung dieser Sites-Version nativ bestätigt.

## Noch offen

- Neue OSM-Netzdaten: die ausgewählte öffentliche Overpass-Instanz antwortete hier selbst auf eine winzige Diagnoseabfrage nicht rechtzeitig. Rate-Limit-/Fehlerpausen werden respektiert. Keine Daten oder Live-Nachweise erfinden.
- Vollständige visuelle Kartenabnahme: interne Vorschau war nicht erreichbar; externe CSS-Anfragen wurden mit Cloudflare 1010 blockiert. Sicherheitsregeln wurden nicht abgeschaltet, keine Umgehungs-URLs eingeführt.
- Direkter Klick auf einen tatsächlich geladenen OSM-Kartenhalt noch praktisch abnehmen. Die Parser-/Namens-/Routingtests ersetzen diesen visuellen Test nicht.
- Eigener öffentlicher HTTPS-Auskunftsserver für den neuen autarken Pages-Rollout fehlt. Der Quellstand ist startbar. Die bisherige Pages-Version 12 bleibt bis zum bewussten Rollout erhalten.
- Geräte-GPS nicht neu geprüft. Echtzeit-/Sperrungsabdeckung bleibt partiell.

Nächste Änderungen nur an diesem Projekt und an der gemeinsamen Source-Basis ausführen. Bei Fortsetzung aktuelle Source lesen; frühere Prüfstände nicht als neue Abnahme ausgeben.



Nach Veröffentlichung von Version 16 wurden die öffentlichen Endpunkte der Site
live geprüft: Suche nach Rohdental und Heilbronn Finanzamt sowie die automatische
Route mit gemischtem ÖBB-Start und EFA-Ziel lieferten HTTP 200. Ergebnis:
26.10.2026, 09:25–15:17 Europe/Berlin, sieben Abschnitte bis Bus 27,
vollständige Quellgeometrie und vier Betriebshinweise. Die Namenszuordnung des
ÖBB-Starts zum EFA-Halt erscheint im Ergebnis. Die Browserprüfung bleibt offen;
die verwaltete Vorschau ist nicht erreichbar und eine spätere Tab-Übergabe wurde
durch die Browser-Sicherheitsrichtlinie blockiert.
