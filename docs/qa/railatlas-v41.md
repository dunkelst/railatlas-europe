# RailAtlas 41 – lesbare Verbindungskennungen

Sites-Quellcommit `df776cc2d57c3ef9eb6daadf1fadbbe827f1e61e`.
1.030 Quelldateien stimmen mit dem Herkunftsmanifest überein.

Die echte GitHub-Browserprüfung von Version 40 bestätigte sechs ADO-Reisen von
Terminal 2 nach ADO Tulum am 31.10.2026, einschließlich 12:00–14:20 America/Cancun.
Im Prüffoto waren die Buskennungen auf den hellen Auswahlkarten zu blass.

Die Korrektur begrenzt Textfarben auf `.journey-option .mini-line`: dunkles Braun
für Bus, dunkles Blau für U-Bahn/Tram, dunkles Grün für Fußwege und die Standard-
Kennungen. Die Farben im dunklen Reiseverlauf werden nicht überschrieben.

155 Regressionen und alle drei Produktionsbuilds erfolgreich. Der TypeScript-Code
ist seit der erfolgreichen Prüfung von Version 40 unverändert; GitHub CI prüft ihn
weiterhin. Die ADO-Daten und Grenzen sind im [Prüfbericht 40](railatlas-v40.md)
belegt. Für den Tren Maya ist noch kein RailAtlas-Fahrplanadapter implementiert.
