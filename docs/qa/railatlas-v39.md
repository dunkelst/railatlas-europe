# RailAtlas 39 – übersetzte Ortszusätze

Sites-Quellcommit `d5e810986f6bbfd85e55e5d104acc2bd788479dc`.
1.027 Quelldateien stimmen mit dem Herkunftsmanifest überein.

Beim abschließenden Sprachtest von Version 38 blieb der von RailAtlas erzeugte
Ortszusatz „bei Playa del Carmen“ in englischer/spanischer Darstellung deutsch.
Der gemeinsame Formatierungspfad übersetzt jetzt ausschließlich diesen Zusatz:
„Near Playa del Carmen“ / „Cerca de Playa del Carmen“. Die eigentlichen Namen,
Koordinaten, Datenquellen und bereits gelieferten Anbietertexte bleiben erhalten.
Vorschläge, übernommene Orte und nahegelegene Halte verwenden denselben Helfer.

146 Regressionen, TypeScript, Worker-, eigenständiger Client- und GitHub-Pages-
Build erfolgreich. Die bestehende Sprachregression enthält nun zusätzlich
alle drei Ortszusätze und den Erhalt nicht generierter Namen.

Öffentliche Sites-Version 39 im Browser geprüft:

- Spanische Playa-Suche zeigt „Cerca de Playa del Carmen“ in den Vorschlägen.
- Übernahme zeigt denselben Zusatz und unveränderte 20.6463, −87.0808.
- Die Startauswahl setzt weiter America/Cancun.
- Umschalten auf Englisch zeigt „Near Playa del Carmen“ und erhält den Ort.

Die Zeitzonenkorrektur und die echte Flughafen-Gegenprobe sind im
[Prüfbericht 38](railatlas-v38.md) dokumentiert. Die dort festgestellte fehlende
Transitous-Verbindung nach CUN und die fehlende interne ADO-Fahrplananbindung
werden durch diese Textkorrektur nicht behoben. Die Bus-/Colectivo-Kartenschalter
sind weiterhin unabhängig von der Fahrplansuche.
