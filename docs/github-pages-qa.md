# GitHub Pages – Prüfung vom 23.10.2026

## Build und Quellabgleich

- Sites-Version 11 wurde erfolgreich öffentlich als Test bereitgestellt.
- 153 Quelldateien entsprechen bytegenau dem veröffentlichten Sites-Commit `0da7f1aa0ad19afaf83f476a1a23435ef581e67b`; automatischer Herkunftscheck bestanden.
- 29 App-Regressionen sowie die bestehende Node-/Python-Graph-Regression bestanden.
- TypeScript, Worker-Produktionsbuild und statischer Pages-Build bestanden.
- Der Pages-Build enthält die echte React-Anwendung und lokale Daten/Kartenressourcen mit Repository-Präfix. Keine Weiterleitungsseite. OPTIONS und JSON-Fehler für den GitHub-Browserursprung sind automatisiert geprüft.

## Verbleibende praktische Prüfung

Der Actions-Build und die Bedienung der veröffentlichten GitHub-Seite werden nach dem Rollout geprüft. Live-Ergebnisse werden erst nach tatsächlich ausgeführten Abfragen ergänzt. Die bisherigen Anbieterprüfungen stehen im gemeinsamen `sites/railatlas-europa/QA.md`.
