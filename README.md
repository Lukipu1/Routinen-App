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
| Benachrichtigungen | Expo Notifications (lokal)                          |
| Haptik             | Expo Haptics                                       |
| Icons              | Lucide React Native                                |
| Datum/Zeit         | date-fns                                           |
| Validierung        | Zod                                                |
| Tests              | Jest (jest-expo) + Testing Library React Native    |

## Voraussetzungen

- **Node.js** ≥ 20
- **npm** ≥ 10
- Zum Ausführen auf einem Gerät: die **Expo Go**-App (iOS/Android) oder ein
  iOS-Simulator / Android-Emulator.

## Installation

```bash
npm install
```

> Das Projekt enthält eine `.npmrc` mit `legacy-peer-deps=true`, da das
> React-19-/Expo-57-Ökosystem einige Peer-Ranges noch nicht vollständig
> auflöst. Ein normales `npm install` funktioniert damit ohne zusätzliche Flags.

## Starten

```bash
npm start          # Expo Dev-Server (QR-Code für Expo Go)
npm run ios        # iOS-Simulator
npm run android    # Android-Emulator
npm run web        # Web (eingeschränkt – SQLite ist gerätespezifisch)
```

## Prüfen

```bash
npm run typecheck  # TypeScript (tsc --noEmit) – fehlerfrei
npm run lint       # ESLint (eslint-config-expo) – fehlerfrei
npm test           # Jest – 64 Tests, 12 Suites
```

## Projektstruktur

```
app/                         # Expo-Router-Routen (dünne Wrapper um Screens)
  _layout.tsx                # Provider, Bootstrap-Gate, Onboarding-Redirect
  (tabs)/                    # Bottom-Tabs: Heute, Routinen, Fortschritt, Einstellungen
  editor.tsx                 # Routine erstellen/bearbeiten (Modal)
  routine/[id].tsx           # Routine-Detail (Modal)
  run.tsx                    # Vollbild-Ausführung
  onboarding.tsx             # Onboarding (max. 3 Seiten)
src/
  components/                # Wiederverwendbare UI
    common/                  #   Buttons, Card, BottomSheet, Picker, StatusBadge, …
    routine/                 #   RoutineCard, RoutineStepEditor, Icon-/ColorPicker
    timeline/                #   TimelineItem, NextRoutineCard
    progress/                #   ProgressRing, ProgressBar
  features/                  # Fachlogik + Screens je Bereich
    today/ routines/ execution/ statistics/ settings/ onboarding/ planner/
  theme/                     # Design-System (Farben, Typografie, Spacing, Radien, Schatten)
  types/                     # Zentrale TypeScript-Datenmodelle
  database/                  # SQLite-Client, Migrationen, Repositories, Mapper
  store/                     # Zustand-Stores (app, execution, preferences)
  services/                  # Notifications, Haptics
  hooks/                     # useToday, useDayPlan, useStatistics, useAppBootstrap, …
  utils/                     # Datum/Zeit, Formatierung, IDs, Arrays
  constants/                 # Icons, Farben, Kategorien, Wochentage, Dauern
  data/                      # Vorlagen + Startdaten (Seed)
  testing/                   # Test-Factories (nicht Teil der App-Laufzeit)
```

## Datenbankstruktur

SQLite mit versionierten Migrationen (`PRAGMA user_version`). Referentielle
Integrität und Kaskaden-Löschungen über Fremdschlüssel.

| Tabelle          | Zweck                                             | Besonderheiten                                  |
| ---------------- | ------------------------------------------------- | ----------------------------------------------- |
| `routines`       | Routinen inkl. Zeitplan & Erinnerung (Spalten)    | Wochentage/Zeitfenster als JSON                 |
| `routine_steps`  | Schritte einer Routine                            | FK → routines (ON DELETE CASCADE)               |
| `executions`     | Laufende/beendete Durchführungen                  | Wiederherstellbar (Timer via Zeitstempel)       |
| `completions`    | Abschlüsse pro Tag (Statistik)                    | **UNIQUE (routine_id, date)** – keine Duplikate |
| `plan_overrides` | Tages-Anpassungen (verschieben/überspringen/…)    | **UNIQUE (routine_id, date)**                   |
| `meta`           | Schlüssel/Wert (z. B. Schema-Infos)               | –                                               |

Einstellungen liegen separat in AsyncStorage (Zustand Persist).

## Wichtige Architekturentscheidungen

- **Reine Logik getrennt von UI.** Wiederholung, Tagesauswahl, Fortschritt,
  Serien, Ausführung, Überschneidungen und Validierung sind seiteneffektfreie
  Funktionen in `src/features/*` und `src/utils/*` – dadurch vollständig und
  einfach testbar. Die Stores und Screens komponieren nur diese Funktionen.
- **Tages-Overrides statt Duplikaten.** Wiederkehrende Routinen werden aus dem
  Zeitplan berechnet; einzelne Tage werden über `plan_overrides` angepasst
  („nur heute verschieben/überspringen/pausieren“ oder ad-hoc hinzufügen).
  „Alle zukünftigen Tage“ ändert stattdessen den Zeitplan der Routine.
- **Robuste Ausführung.** Der Zustand jeder Durchführung wird laufend
  gespeichert; Timer werden aus `stepStartedAt` + `accumulatedStepSeconds`
  rekonstruiert. Eine pausierte oder laufende Routine übersteht App-Neustarts.
- **Faire Serien.** Bewusst „für heute pausierte“ Tage zählen nicht als
  Fehlschlag; ein noch nicht beendeter heutiger Tag bricht die Serie nicht.
- **Lokale Zeit statt UTC.** Tagesgrenzen, Wochentage und Uhrzeiten arbeiten in
  der Gerätezeit und bleiben so über Sommer-/Winterzeit korrekt.
- **Design-Tokens überall.** Keine fest verdrahteten Farben oder Abstände im
  UI-Code – alles kommt aus dem Theme (Light & Dark, System-Standard).

## Bekannte Einschränkungen

- **Töne bei Timer-Ende** sind über die Einstellungen vorbereitet, aktuell wird
  jedoch nur haptisches Feedback ausgelöst (keine Audiodatei enthalten).
- **Drag-and-drop-Sortierung** von Schritten ist als stabile Auf/Ab-Steuerung
  umgesetzt; echtes Drag-and-drop ist bewusst noch nicht integriert.
- **Web-Ziel** ist eingeschränkt, da Expo SQLite gerätespezifisch ist – die App
  ist für iOS/Android ausgelegt.
- Lokale Benachrichtigungen und Haptik lassen sich nur auf echten Geräten bzw.
  in Simulatoren vollständig testen, nicht im Unit-Test.

## Nächste sinnvolle Erweiterungen

- Echtes Drag-and-drop für Schritte und Timeline (react-native-reanimated +
  gesture-handler).
- Optionale Audiosignale bei Timer-Ende (expo-audio).
- Detailliertere Statistik (Monats-/Kalenderansicht, Trends pro Kategorie).
- Datenexport/-import (JSON) und optionales Cloud-Backup.
- Widgets bzw. Live-Aktivitäten für die nächste anstehende Routine.

## Tests

Die wichtigsten Logikbereiche sind abgedeckt (64 Tests):

- Wiederholungsberechnung, Auswahl der heutigen Routinen, Sortierung/Status
- Fortschritts- und Serienberechnung (inkl. fairer Pausen-Tage)
- Verschieben/Überspringen/Pausieren nur für heute
- Ausführung: Abschluss, Überspringen, Pause/Fortsetzen, Zusatzzeit, Abbruch
- Wiederherstellung einer laufenden Routine (Timer aus Zeitstempeln)
- Zeitüberschneidungen und Datenvalidierung (Zod)
- Integration der Stores (Start → Schritte → Abschluss) sowie Komponententests

```bash
npm test
```
