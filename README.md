# Routinen

Eine ruhige, hochwertige Routinen-App im Apple-inspirierten Stil. Sie hilft dir,
Routinen zu erstellen, in deinen Tag einzuplanen und Schritt für Schritt
auszuführen – vollständig **offline** und **ohne Konto**.

Der zentrale Ablauf: App öffnen → heutigen Tagesablauf sehen → Routine starten →
Schritte nacheinander erledigen → abschließen → Fortschritt sofort sehen.

## Tech-Stack

| Bereich            | Technologie                                        |
| ------------------ | -------------------------------------------------- |
| Framework          | React Native (0.86) + Expo (SDK 57)                |
| Sprache            | TypeScript (Strict Mode)                           |
| Navigation         | Expo Router (Datei-basiert, Bottom-Tabs + Modale)  |
| State              | Zustand (+ Persist via AsyncStorage)               |
| Persistenz         | Expo SQLite (mit Migrationen) + AsyncStorage       |
| Animationen        | React Native Reanimated 4                          |
| Benachrichtigungen | Expo Notifications (lokal, datumsbasiert)          |
| Haptik             | Expo Haptics                                       |
| Icons              | Lucide React Native                                |
| Datum/Zeit         | date-fns                                           |
| Validierung        | Zod                                                |
| Tests              | Jest (jest-expo) + Testing Library + `node:sqlite` |

## Voraussetzungen

- **Node.js ≥ 22.13** (die Repository-Tests laufen gegen das eingebaute
  `node:sqlite`, damit echte SQL-Semantik wie Fremdschlüssel und UPSERTs
  getestet wird)
- **npm ≥ 10**
- Zum Ausführen auf einem Gerät: die **Expo Go**-App (iOS/Android), ein
  iOS-Simulator / Android-Emulator oder ein Development Build (EAS).

## Installation

```bash
npm install
```

## Starten

```bash
npm start          # Expo Dev-Server (QR-Code für Expo Go)
npm run ios        # iOS-Simulator
npm run android    # Android-Emulator
npm run web        # Web (siehe Hinweis unten)
```

**Web:** Expo SQLite läuft im Browser über WebAssembly und braucht eine
cross-origin-isolierte Seite. Der Dev-Server setzt die nötigen Header
(`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`) über
`metro.config.js`; ein Produktions-Host muss sie ebenfalls senden. Lokale
Benachrichtigungen und Haptik gibt es im Web nicht.

## Prüfen

```bash
npm run typecheck  # TypeScript (tsc --noEmit)
npm run lint       # ESLint (eslint-config-expo)
npm test           # Jest – Logik, Datenbank (echtes SQLite), Stores, Komponenten
npm run check      # alle drei nacheinander
```

Die CI (`.github/workflows/ci.yml`) führt dieselben Schritte plus
`expo-doctor` bei jedem Push und Pull Request aus.

## Veröffentlichen

`app.json` enthält Bundle-Identifier (`de.routinen.app`), Buildnummern, die
Benachrichtigungs- und Splash-Konfiguration; `eas.json` definiert die Profile
`development`, `preview` und `production`.

```bash
npx eas build --profile preview --platform all
npx eas build --profile production --platform all
```

Die Icons in `assets/` sind generierte Platzhalter in den richtigen Größen –
vor dem Store-Release durch das finale Branding ersetzen.

## Projektstruktur

```
app/                         # Expo-Router-Routen (dünne Wrapper um Screens)
  _layout.tsx                # Provider, Bootstrap-Gate, Fehleransicht, Tageswechsel
  (tabs)/                    # Bottom-Tabs: Heute, Routinen, Fortschritt, Einstellungen
  editor.tsx                 # Routine erstellen/bearbeiten (Modal)
  routine/[id].tsx           # Routine-Detail (Modal)
  run.tsx                    # Vollbild-Ausführung
  onboarding.tsx             # Onboarding (3 Seiten)
src/
  components/                # Wiederverwendbare UI
    common/                  #   Buttons, Chip, AppSwitch, Card, BottomSheet, Picker, Toast, …
    routine/                 #   RoutineCard, RoutineStepEditor, Icon-/ColorPicker
    timeline/                #   TimelineItem, NextRoutineCard
    progress/                #   ProgressRing, ProgressBar
  features/                  # Fachlogik + Screens je Bereich
    today/                   #   Tagesplan, Aktions-Sheets
    routines/                #   Liste, Detail, Editor (editor/), Draft + Validierung
    execution/               #   Ausführungslogik (pur) + Screen
    planner/                 #   Wiederholung, Tages-Overrides, Statuslogik, Erinnerungsplan
    statistics/              #   Serien, Wochenübersicht, Pro-Routine-Statistik
    settings/ onboarding/
  theme/                     # Design-System (Farben, Typografie, Spacing, Radien, Schatten)
  types/                     # Zentrale TypeScript-Datenmodelle
  database/                  # SQLite-Client, Migrationen, Repositories, Mapper (+ Validierung)
  store/                     # Zustand-Stores (app, execution, preferences)
  services/                  # Notifications, Haptics, Backup (Export/Import)
  hooks/                     # useToday, useStatistics, useAppBootstrap, useDayRollover, …
  utils/                     # Datum/Zeit, Formatierung, IDs, Logger
  constants/                 # Icons, Farben (inkl. Kontrastvarianten), Kategorien, Wochentage
  data/                      # Vorlagen, Startdaten (Seed), Zod-Schemas
  testing/                   # Test-Factories und der SQLite-Fake (nicht Teil der App)
```

## Datenbankstruktur

SQLite mit versionierten Migrationen (`PRAGMA user_version`, Schema und
Versionssprung in **einer** Transaktion). Referentielle Integrität und
Kaskaden-Löschungen über Fremdschlüssel; alle Schreibzugriffe sind UPSERTs
(`ON CONFLICT … DO UPDATE`), niemals `INSERT OR REPLACE`, weil das die
Kinddatensätze über die Kaskade löschen würde.

| Tabelle          | Zweck                                             | Besonderheiten                                  |
| ---------------- | ------------------------------------------------- | ----------------------------------------------- |
| `routines`       | Routinen inkl. Zeitplan & Erinnerung (Spalten)    | Wochentage/Zeitfenster als JSON                 |
| `routine_steps`  | Schritte einer Routine                            | FK → routines (ON DELETE CASCADE)               |
| `executions`     | Laufende/beendete Durchführungen                  | Timer aus Zeitstempeln, aktive Sekunden         |
| `completions`    | Abschlüsse pro Tag (Statistik)                    | **UNIQUE (routine_id, date)** – keine Duplikate |
| `plan_overrides` | Tages-Anpassungen (verschieben/überspringen/…)    | **UNIQUE (routine_id, date)**                   |
| `day_plans`      | Tages-Schnappschuss der fälligen Routinen         | Statistik liest Vergangenheit hieraus           |
| `meta`           | Schlüssel/Wert (z. B. „Beispiele schon angelegt“) | bleibt bei „Alle Daten löschen“ erhalten        |

Einstellungen liegen separat in AsyncStorage (Zustand Persist, versioniert).

## Wichtige Architekturentscheidungen

- **Reine Logik getrennt von UI.** Wiederholung, Tagesauswahl, Status,
  Fortschritt, Serien, Ausführung, Erinnerungsplanung und Validierung sind
  seiteneffektfreie Funktionen in `src/features/*` – vollständig testbar.
- **Tages-Overrides statt Duplikaten.** Wiederkehrende Routinen werden aus dem
  Zeitplan berechnet; einzelne Tage werden über `plan_overrides` angepasst.
  „Alle zukünftigen Tage“ ändert stattdessen den Zeitplan der Routine.
- **Geschichte bleibt Geschichte.** Jeder Tag friert seine fälligen Routinen
  in `day_plans` ein. Zeitplan-Änderungen, Deaktivieren oder Duplizieren
  schreiben die Vergangenheit (und damit Serien) nicht um.
- **Robuste Ausführung.** Der Zustand jeder Durchführung wird laufend
  gespeichert; Timer werden aus Zeitstempeln rekonstruiert. Aktionen laufen
  serialisiert, damit schnelles Tippen keinen inkonsistenten Zustand erzeugt.
  Eine Routine lässt sich verlassen („Später fortsetzen“), ein Schritt
  zurücknehmen und ein Abschluss rückgängig machen.
- **Tageswechsel wird verarbeitet.** Beim Zurückkehren in den Vordergrund und
  um Mitternacht wird der Tag neu geladen; über Nacht liegen gebliebene Läufe
  werden geschlossen.
- **Ehrliche Zählung.** Übersprungene Routinen zählen nicht gegen den Tag,
  heute noch nicht fällige nicht gegen die Woche, Pausen nicht in die Dauer;
  „Überfällig“ und „Abgebrochen“ sind eigene Zustände.
- **Erinnerungen folgen dem Plan.** Statt starrer Wochen-Trigger werden
  konkrete Termine für eine rollierende Woche geplant und bei jeder
  Planänderung neu gesetzt (unter dem iOS-Limit von 64 Benachrichtigungen).
- **Lokale Zeit statt UTC.** Tagesgrenzen, Wochentage und Uhrzeiten arbeiten in
  der Gerätezeit; die Tests laufen deshalb in `Europe/Berlin`.
- **Design-Tokens überall.** Farben, Abstände, Kontrastvarianten für helle
  Routinenfarben und Textskalierung kommen aus dem Theme (Light & Dark).

## Barrierefreiheit

Alle Bedienelemente haben deutsche Namen und Rollen (Radio, Checkbox,
Schalter), Auswahlzustände werden angesagt, Toasts werden vorgelesen,
Tippflächen sind mindestens 44 pt, Schriftskalierung wird unterstützt und
„Reduzierte Bewegungen“ gilt für alle Animationen.

## Datensicherung

Unter *Einstellungen → Daten* lassen sich alle Routinen, Planungen und
Verläufe als JSON exportieren (System-Teilen-Dialog) und aus einer solchen
Datei wiederherstellen. Importe werden mit den Zod-Schemas geprüft und in
einer Transaktion eingespielt.

## Bekannte Einschränkungen

- Keine Töne bei Timer-Ende (haptisches Feedback und eine lokale
  Benachrichtigung im Hintergrund). Eine Audio-Option braucht eine Sounddatei
  und `expo-audio`.
- Schritte werden per Auf/Ab-Steuerung sortiert; echtes Drag-and-drop ist
  bewusst noch nicht integriert.
- Die Web-Version dient der Entwicklung und Vorschau; Zielplattformen sind
  iOS und Android.

## Tests

```bash
npm test
```

Abgedeckt sind u. a.: Wiederholung und Tagesauswahl, Statuslogik (inkl.
Überfällig/Abgebrochen), Fortschritt, Serien mit Tages-Schnappschüssen,
Pro-Routine-Statistik, Overrides, Erinnerungsplanung, Ausführung (Abschluss,
Überspringen, Pause, Zurück, Wiederaufnahme, aktive Dauer), Store-Integration
(Doppeltipp, Nebenläufigkeit, Tageswechsel, Seed-Marker, Startfehler),
Repositories gegen echtes SQLite (UPSERT ohne Kaskadenverlust, Transaktionen,
Migrationen), Backup-Roundtrip sowie Komponenten.
