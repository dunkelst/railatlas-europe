# RailAtlas Europa – Fortführung am 24.10.2026

Bestehendes Projekt: `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Verbindlicher Auftrag

Bestehendes Projekt fortführen. GitHub soll denselben funktionsfähigen Quellstand enthalten und eigenständig betrieben werden können. Öffentliche Testnutzung ist erlaubt. Eine notwendige ChatGPT-Site-Abhängigkeit genügt nicht.

## Aktueller Stand

Sites-Version **15**, Quellcommit `bcc597d12e51b92b3c50a416a6747a1befb43185`, 161 Dateien bytegleich auf GitHub. Unabhängige Kartenebenen für Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus; Linien und Halte separat schaltbar, Bahn voreingeschaltet. Der Node-Server nutzt dieselbe Oberfläche, denselben API-Handler und dieselben Anbieterparser. Der Pages-Build hat keine voreingestellte ChatGPT-API.

Neue Korrekturen: OSM-Kartennamen dürfen den Stadtpräfix der Fahrplanquelle und U-/S-Gruppen weglassen, jedoch nur bei passendem Namen und höchstens 250 Metern Entfernung. Andere Namenszusätze bleiben erhalten. Die übernommene Ebene wird für die Prüfung ausdrücklich anders gekennzeichneter Verkehrsmittel mitgeführt. Die aufgezeichnete VRR-Antwort mit „Heinrich-Heine-Allee U“ und Stations-/Bahnsteigabstand wird unterstützt.

Der Netzdatenabruf erlaubt 40 Sekunden für Warteschlange, Verarbeitung und Transfer. Zeitablauf erhält eine lesbare Meldung und 30 Sekunden Pause; Nutzerabbruch bleibt davon getrennt. Ohne messbare Kartenfläche wird kein ungültiger Ausschnitt abgefragt.

## Nachgewiesen

- 46 App-Regressionen, TypeScript, Sites-/Pages-/Standalone-Clientbuild bestanden.
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
