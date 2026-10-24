# RailAtlas Europa – Fortführung am 24.10.2026

Bestehendes Projekt: `appgprj_6ad7024dce688191b17cca024104c456`.
Site: https://railatlas-europa.cocoaamber33.chatgpt.site
Repository: https://github.com/dunkelst/railatlas-europe

## Verbindlicher Auftrag

Am vorhandenen Projekt weiterarbeiten. GitHub soll denselben funktionsfähigen Quellstand enthalten und eigenständig betrieben werden können; eine Weiterleitung oder notwendige ChatGPT-Site-Abhängigkeit genügt nicht. Öffentliche Testnutzung ist erlaubt.

## Umgesetzter Stand

Version 14 / `31171b052fd0f815f6eddf40f3014cb8f7ca6219`: getrennte Netzebenen mit separaten Linien-/Halteschaltern für Bahn, S-Bahn, U-Bahn, Tram/Stadtbahn und Bus. Bahn voreingeschaltet. Kleine OSM-Ausschnitte ab Zoom 12; eigene Reisegeometrie bleibt unabhängig. OSM-Halte können in den vorhandenen Planungsfluss übernommen werden. Leere/fehlerhafte/abgebrochene Anbieterantworten erzeugen keine erfundenen Netze.

Ein standardmäßiger Node-Server liefert denselben Client und denselben API-Handler mit denselben ÖBB-/VRR-Modulen. Build- und Startskripte sind vorhanden. Kein fester ChatGPT-API-Ursprung im neuen Pages-Build.

## Nachgewiesen

42 App-Tests, TypeScript und drei Produktionsbuilds bestanden. Lokaler echter HTTP-Server geprüft. Sites-Veröffentlichung nativ bestätigt. Im veröffentlichten Formular U1 Wien Karlsplatz → Stephansplatz am 24.10., 18:27–18:29, einschließlich eines Anbieter-Bauhinweises.

## Noch offen

- Vollständige visuelle Kartenabnahme: interne Vorschau nicht erreichbar, Stylesheets im externen Prüfbrowser HTTP 403 / Cloudflare 1010. Dateien sind im Bereitstellungspaket vorhanden; kein Umgehungscode eingebaut.
- Tatsächliche OSM-Netzdaten: Hauptinstanz HTTP 521, Entwicklungsabruf der dokumentierten globalen private.coffee-Instanz HTTP 429; neue veröffentlichte Anfrage noch ohne bestätigtes Datenergebnis. Rate-Limit-/Serverfehler werden mit Abfragepause behandelt.
- Direkte Übernahme eines angezeigten OSM-Halts und die räumliche Zeichnung aller fünf Modi im Browser noch praktisch abnehmen.
- Eigener öffentlicher HTTPS-Auskunftsserver für eine neue autarke Pages-Veröffentlichung. Der Quellstand ist startbar; hier wurde kein externes Hostingkonto eingerichtet. Die bisherige Pages-Version 12 bleibt bis zum bewussten Rollout bestehen.
- Geräte-GPS nicht neu geprüft; Echtzeit-/Sperrungsabdeckung bleibt partiell.

Nicht anhand alter Prüftexte behaupten, neue Live-Nachweise seien bestanden. Nächste Änderungen nur an diesem Projekt und auf dieser gemeinsamen Source-Basis ausführen.
