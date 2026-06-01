# PflegeMatch

Vermittlungsplattform für **Pfleger, die Gesellschafter sind und (noch) keine
Patienten haben**. Sie bringt freie Gesellschafter mit offenen
Patientenanfragen zusammen und schlägt anhand eines nachvollziehbaren
Matching-Scores die besten Paarungen vor.

## Idee

Gesellschafter ohne Patienten suchen aktiv Fälle. Angehörige stellen
Pflegebedarf ein (Ort, Pflegegrad, benötigte Qualifikation und Leistungen,
Stundenbedarf, Dringlichkeit). Die Matching-Engine bewertet jede Kombination
von 0–100 Punkten und erklärt jede Entscheidung. Per Klick wird vermittelt –
die Anfrage gilt dann als versorgt, der Pfleger als ausgelastet.

## Tech-Stack

- **Backend:** Node.js + Express, SQLite (`better-sqlite3`) – REST-API
- **Frontend:** React + Vite
- **Matching:** eigene, regelbasierte Engine (`server/src/matching.js`)

## Schnellstart

```bash
# 1. Abhängigkeiten installieren (Server + Client)
npm run install:all

# 2. Beispieldaten laden (4 Pfleger, 3 Anfragen)
npm run seed

# 3a. Produktion: Frontend bauen + Server starten (alles auf einem Port)
npm run build
npm start          # http://localhost:3001

# 3b. Entwicklung: zwei Terminals
npm run dev:server # API auf :3001
npm run dev:client # UI auf :5173 (proxyt /api -> :3001)
```

## Matching-Logik

Der Score (0–100) setzt sich zusammen aus:

| Kriterium        | Gewicht | Bewertung |
|------------------|---------|-----------|
| Region (PLZ)     | 35      | Nähe innerhalb des Einsatzradius des Pflegers |
| Qualifikation    | 30      | K.-o.-Kriterium; exakte Passung bevorzugt |
| Leistungen       | 20      | Anteil abgedeckter benötigter Leistungen |
| Kapazität        | 15      | freie Wochenstunden vs. Bedarf |
| Dringlichkeit    | +5      | Bonus bei hoher Dringlichkeit |

Ein Match gilt als **machbar**, wenn Qualifikation ausreicht *und* der Einsatzort
im Radius liegt. Nicht-machbare Vorschläge werden weiterhin angezeigt, aber
markiert – mit den jeweiligen Begründungen.

## API-Überblick

| Methode | Pfad | Zweck |
|---------|------|-------|
| GET  | `/api/health` | Kennzahlen |
| GET/POST/DELETE | `/api/caregivers` | Pfleger (Gesellschafter) verwalten |
| GET | `/api/caregivers/:id/matches` | passende offene Anfragen |
| GET/POST/DELETE | `/api/patients` | Patientenanfragen verwalten |
| GET | `/api/patients/:id/matches` | passende Gesellschafter (frei zuerst) |
| GET/POST/DELETE | `/api/vermittlungen` | Vermittlungen anlegen/lösen |

## Projektstruktur

```
server/   Express-API, SQLite-Schema, Matching-Engine, Seed
client/   React-Frontend (Dashboard, Vermittlung, Pfleger, Anfragen)
```

## Hinweis

Demo-/MVP-Stand. Vor Produktiveinsatz: Authentifizierung, Datenschutz (DSGVO,
echte Patientendaten!), Rollen/Rechte und Geocoding statt PLZ-Heuristik
ergänzen.
