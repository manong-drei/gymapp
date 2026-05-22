# FORGED Application Memory

This document is a handoff for another AI or developer. It explains how the current Expo app works, where the important code lives, and what to watch when changing or debugging it.

## Project Identity

- App name: `FORGED`
- Package name: `com.edssurio.forged`
- App root: `c:\ninoystracker\liftLog`
- Framework: Expo SDK 54 with Expo Router
- Runtime: React 19.1, React Native 0.81.5
- Storage: local SQLite through `expo-sqlite`
- Build service: EAS Build
- EAS project id: `d0d46370-ab27-42a2-bdf3-8efe3216ff3b`

The parent repo at `c:\ninoystracker` tracks `liftLog` as a git submodule. Most application work happens inside `c:\ninoystracker\liftLog`.

## Main Commands

Run these from `c:\ninoystracker\liftLog`.

```powershell
npm install
npx expo-doctor
npx expo lint
npx expo start
eas build --platform android --profile preview
eas build --platform android --profile production
```

The `expo-doctor` check currently reported a patch version warning for `@react-navigation/native`: expected `^7.1.8`, found `7.1.14`. That is a patch-level mismatch and should not normally block EAS builds.

## App Configuration

Important files:

- `app.json`: Expo app config, package id, icons, splash config, SQLite plugin, EAS project id.
- `eas.json`: EAS build profiles.
- `package.json`: dependencies and scripts.
- `src/app/_layout.tsx`: root Expo Router layout and app startup.

Current EAS profiles:

- `development`: internal distribution with development client.
- `preview`: internal distribution.
- `production`: auto increments version remotely.

The app icon and splash image use `assets/images/ForgedLogo.png`.

## Navigation Model

The app uses Expo Router file-based routing under `src/app`.

Root layout:

- `src/app/_layout.tsx`
  - Initializes the SQLite database with `initialiseDatabase()`.
  - Renders `AnimatedSplashOverlay`.
  - Renders `AppTabs`.

Tabs:

- `src/components/app-tabs.tsx`
  - Visible tabs:
    - `index`: Home
    - `plan`: Plans
    - `progress`: Progress
    - `settings`: Settings
  - Hidden routes with `href: null`:
    - `add-plan`
    - `edit-plan`
    - `plan-exercises`
    - `add-exercise`
    - `edit-exercise`
    - `start-workout`
    - `session-detail`
    - `progress-tracking`
    - `calendar`
    - `weight`

Route wrapper files:

- `src/app/index.tsx` exports `HomeScreen`.
- `src/app/plan.tsx` exports `PlanScreen`.
- `src/app/progress.tsx` exports `ProgressScreen`.
- `src/app/calendar.tsx` exports `CalendarScreen`.
- `src/app/weight.tsx` exports `WeightScreen`.
- `src/app/settings.js` exports `SettingsScreen`.

The app mostly navigates with `router.push({ pathname, params })`.

## Design System

Shared visual tokens live in:

- `src/constants/design.js`
- `src/constants/theme.ts`

Most app screens use `palette`, `radius`, and `spacing` from `design.js`.

The app is dark, utilitarian, and workout-focused. Most screens use:

- `palette.background` for the page.
- `palette.surface` for cards.
- `palette.primary` for primary actions.
- `palette.success` or `palette.successMuted` for positive workout states.
- `palette.danger` or `palette.dangerMuted` for destructive actions.

## Database

Database entry point:

- `src/database/database.ts`

Database name:

- `liftlog.db`

Initialization:

- `initialiseDatabase()` opens the database and creates all tables if missing.
- It also enables foreign keys using `PRAGMA foreign_keys = ON`.
- It contains simple migrations for `workout_plans.description` and `workout_plans.updated_at`.

Tables:

### workout_plans

Fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL`
- `description TEXT`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP`

Purpose:

- Stores each named workout plan.

### exercises

Fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `workout_plan_id INTEGER NOT NULL`
- `name TEXT NOT NULL`
- `target_sets INTEGER`
- `target_reps TEXT`
- `target_weight REAL`
- `rest_seconds INTEGER`
- `order_index INTEGER`

Foreign key:

- `workout_plan_id` references `workout_plans(id)` with cascade delete.

Purpose:

- Stores exercises under each workout plan.

### workout_sessions

Fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `workout_plan_id INTEGER NOT NULL`
- `date TIMESTAMP NOT NULL`
- `status TEXT NOT NULL`
- `notes TEXT`

Foreign key:

- `workout_plan_id` references `workout_plans(id)` with cascade delete.

Purpose:

- Stores completed workout instances.

### workout_sets

Fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `workout_session_id INTEGER NOT NULL`
- `exercise_id INTEGER NOT NULL`
- `set_number INTEGER NOT NULL`
- `weight_kg REAL`
- `reps INTEGER`

Foreign keys:

- `workout_session_id` references `workout_sessions(id)` with cascade delete.
- `exercise_id` references `exercises(id)` with cascade delete.

Purpose:

- Stores per-set performance data for completed workouts.

### body_weight_logs

Fields:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `date TIMESTAMP NOT NULL UNIQUE`
- `weight_kg REAL NOT NULL`

Purpose:

- Stores one body weight entry per date.
- Saving a duplicate date updates the existing weight.

### app_settings

Fields:

- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`

Purpose:

- Stores key-value preferences.

Default settings:

- `defaultRestSeconds`: `90`
- `timerVibrationEnabled`: `true`

## Query Modules

### `src/database/workoutQueries.js`

Responsibilities:

- Create workout plans.
- List workout plans ordered by creation date.
- Count plans for the home dashboard.
- Read/update/delete workout plans.

Important behavior:

- `createWorkoutPlan()` returns `result.lastInsertRowId`, which is used to navigate directly to the new plan's exercise list.

### `src/database/exerciseQueries.js`

Responsibilities:

- Create exercises under a plan.
- List exercises by plan.
- Count exercises in a plan.
- Read/update/delete exercises.

Important behavior:

- Empty numeric fields are stored as `null`.
- New exercises get `order_index` as max current order plus one.
- `getExerciseCountByWorkoutPlanId()` is used before starting a workout so empty plans cannot be started.

### `src/database/sessionQueries.js`

Responsibilities:

- Create completed workout sessions and their sets.
- List workout history.
- Get latest workout for the home dashboard.
- Count workouts since a date.
- Load calendar date summaries and date-specific sessions.
- Load session details and session sets.
- Delete sessions.

Important behavior:

- `createCompletedWorkoutSession()` wraps the session insert and set inserts in a transaction.
- Session status is currently always `Completed`.
- Session details join `workout_sets` to `exercises` so set rows include `exercise_name`.

### `src/database/progressQueries.js`

Responsibilities:

- Get per-exercise progress summaries.
- Get historical set rows for a specific exercise.
- Get previous performance for an exercise when starting a workout.

Important behavior:

- Previous performance matches by exercise name and workout plan name, not only by exercise ID. This helps after recreating plans/exercises with the same names.

### `src/database/weightQueries.js`

Responsibilities:

- Save body weight logs.
- List body weight logs.
- Get latest weight for the home dashboard.
- Delete logs.

Important behavior:

- `saveBodyWeightLog()` uses `ON CONFLICT(date) DO UPDATE`.

### `src/database/settingsQueries.js`

Responsibilities:

- Read settings with defaults.
- Save individual settings.
- Save several settings in parallel.

### `src/database/dataManagementQueries.js`

Responsibilities:

- Export local app data as JSON.
- Import backup JSON and replace all current local data.
- Clear all app data.

Important behavior:

- Backup version is currently `1`.
- Import deletes current data and inserts rows from the backup inside a transaction.
- Export/import covers all tables: plans, exercises, sessions, sets, body weight logs, and app settings.

## Major User Flows

### Home

Screen:

- `src/screens/HomeScreen.js`

Shows:

- App name and subtitle.
- Last workout.
- Number of workouts in the last seven days.
- Number of saved plans.
- Latest body weight.
- Quick action buttons to Plans, Add Plan, History, Weight, Calendar, and Progress.

Data sources:

- `getLatestWorkoutSession()`
- `getWorkoutSessionCountSince()`
- `getLatestBodyWeightLog()`
- `getWorkoutPlanCount()`

### Workout Plans

Screen:

- `src/screens/PlanScreen.js`

Shows:

- All workout plans.
- Start Workout button.
- Exercises, Edit, and Delete actions.
- Floating Add Workout Plan button.

Behavior:

- On focus, reloads plans.
- Before starting a workout, checks that the plan has at least one exercise.
- Deletes use confirmation alerts.

Related route screens:

- `src/app/add-plan.js`
- `src/app/edit-plan.js`
- `src/app/plan-exercises.js`
- `src/app/add-exercise.js`
- `src/app/edit-exercise.js`

### Add/Edit Plan

Add route:

- `src/app/add-plan.js`

Edit route:

- `src/app/edit-plan.js`

Behavior:

- Plan name is required.
- Description is optional.
- After creating a plan, the app navigates to `/plan-exercises` for that new plan.

### Plan Exercises

Route:

- `src/app/plan-exercises.js`

Behavior:

- Loads a plan and its exercises.
- Allows editing/deleting exercises.
- Allows adding exercises for the current plan.

### Add/Edit Exercise

Routes:

- `src/app/add-exercise.js`
- `src/app/edit-exercise.js`

Fields:

- Name
- Target sets
- Target reps
- Target weight
- Rest seconds

Validation:

- Name is required.
- Target sets may be blank or an integer from 1 to 20.
- Target reps may be blank, a positive integer, or a range like `8-12`.
- Target weight may be blank or a positive decimal.
- Rest seconds may be blank or a positive integer.

### Start Workout

Route:

- `src/app/start-workout.js`

Core behavior:

- Reads `planId` from route params.
- Loads the plan, its exercises, settings, and previous performance.
- Builds initial set rows from each exercise's `target_sets`.
- Prefills each set's weight from `target_weight` if present.
- Shows previous performance for each exercise.
- Lets the user enter weight and reps.
- Lets the user check a set as complete.
- Starts a rest timer after checking a set.
- Allows adding/removing sets.
- Prevents accidental exit if there are unsaved notes, reps, or completed sets.
- Saves the workout as a completed session with all non-empty set records.

Rest timer:

- Uses the plan/exercise rest setting if available.
- Falls back to app setting `defaultRestSeconds`.
- Vibrates when complete if `timerVibrationEnabled` is true.

Save behavior:

- Validates all entered weights/reps.
- Requires at least one set with weight or reps.
- Prevents double-save using `savingRef`.
- Stops timer and vibration before save.
- Calls `createCompletedWorkoutSession(workoutPlanId, completedSets, notes)`.
- After success, allows navigation and goes back.

Potential concern:

- `markRecordedSetsCompleted()` updates React state immediately before saving but does not affect the `completedSets` array used for the database insert. This is okay because the database only stores actual set records, not completion flags.

### Progress History

Screen:

- `src/screens/ProgressScreen.js`

Shows:

- Quick buttons for Lifts, Calendar, and Weight.
- List of completed sessions.
- View Sets and Delete actions.

### Session Detail

Route:

- `src/app/session-detail.js`

Behavior:

- Loads one workout session and all its sets.
- Groups sets by exercise.
- Shows notes, date, status, and set details.

### Progress Tracking

Route:

- `src/app/progress-tracking.js`

Behavior:

- Shows progress summaries per exercise.
- Expands/collapses exercise history.
- Groups historical set rows and calculates best set display.

Known limitation:

- Summary groups by exercise ID, so recreated exercises with the same name can appear separately in summaries. Previous-performance lookup has a name-based fallback, but the summary query is still ID-based.

### Calendar

Screen:

- `src/screens/CalendarScreen.js`

Behavior:

- Uses `react-native-calendars`.
- Marks days with completed workout sessions.
- Lets the user select a date.
- Shows workouts on the selected date.
- View Sets navigates to session detail.

### Body Weight

Screen:

- `src/screens/WeightScreen.js`

Behavior:

- Shows latest body weight.
- Saves or updates a weight log by date.
- Displays a simple weight chart.
- History can be expanded for edit/delete.
- Editing copies the selected log into the form.
- Deleting uses confirmation.

### Settings and Backup

Screen:

- `src/screens/SettingsScreen.js`

Features:

- Default rest time.
- Timer vibration toggle.
- Generate JSON backup.
- Import JSON backup.
- Clear all local data.

Important copy note:

- Import helper text still says `SoloFit backup JSON`; the app is now branded `FORGED`, so that text should be updated.

## Validation Utilities

File:

- `src/utils/validation.js`

Helpers:

- `isBlank`
- `isPositiveDecimal`
- `isPositiveDecimalOrBlank`
- `isPositiveInteger`
- `isPositiveIntegerOrBlank`
- `isTargetSetCountOrBlank`
- `isRepTargetOrBlank`

## Route Param Utilities

File:

- `src/utils/routeParams.js`

Helpers:

- `getSingleParam(value)`: unwraps array route params.
- `getNumericParam(value)`: converts a route param to a number or returns `null`.

## Current Assets

Important assets:

- `assets/images/ForgedLogo.png`
- `assets/images/tabIcons/*`
- `assets/expo.icon/*`

Many default Expo image assets were removed in the current working tree. The app now references `ForgedLogo.png` for icon, splash, favicon, and animated icon.

## Startup and Crash Risk Areas

If an Android preview build installs but immediately says the app keeps stopping, check these first.

### 1. Custom animated splash overlay

Files:

- `src/app/_layout.tsx`
- `src/components/animated-icon.tsx`

`AnimatedSplashOverlay` uses Reanimated `Keyframe` and `scheduleOnRN` from `react-native-worklets`.

Quick isolation test:

```tsx
// Temporarily remove this from _layout.tsx:
<AnimatedSplashOverlay />
```

If the app stops crashing after removing it, the issue is likely Reanimated/worklets runtime behavior in the preview build.

### 2. SQLite initialization

File:

- `src/database/database.ts`

The database initializes on root layout mount. Startup failures here are logged as `Database initialisation failed`.

### 3. Native module mismatch

Relevant packages:

- `react-native-reanimated`
- `react-native-worklets`
- `expo-sqlite`
- `expo-image`
- `expo-router`
- `react-native-screens`
- `react-native-safe-area-context`

Use `npx expo-doctor` and `npx expo install --check` to verify versions.

### 4. Crash logs

For device crashes, connect Android over USB and run:

```powershell
adb logcat -c
adb logcat *:E
```

Then open the app until it crashes. Look for:

- `FATAL EXCEPTION`
- `AndroidRuntime`
- `ReactNativeJS`
- `com.edssurio.forged`

## Known Current Working Tree Context

At the time this memory file was created, the submodule working tree had uncommitted changes including:

- App branding/config updates.
- `eas.json`.
- Asset replacement with `ForgedLogo.png`.
- UI cleanup in home/calendar/weight/start-workout areas.

The parent repository shows `liftLog` as modified because the submodule has moved from commit `d1d3535` to `bc5fc6c` plus local dirty changes.

## Suggested Development Rules

- Keep local data model changes backward compatible. Add migrations in `initialiseDatabase()`.
- Use the existing query modules instead of writing SQL directly in screens.
- Keep workout saving transactional.
- Keep route screens thin when possible, but this codebase currently places screen logic directly in route files for several flows.
- Run `npx expo lint` before building.
- Run `npx expo-doctor` before EAS builds.
- For runtime crashes, get device logs before guessing.

## High-Value Future Fixes

- Update Settings import text from `SoloFit` to `FORGED`.
- Consider removing or simplifying the custom Reanimated splash if preview builds keep crashing.
- Add explicit schema versioning for SQLite migrations.
- Add tests or manual QA checklist for:
  - Creating a plan.
  - Adding exercises.
  - Starting and saving a workout.
  - Viewing session details.
  - Exporting/importing backup JSON.
  - Saving body weight logs.
- Consider changing progress summary grouping if recreated exercises should be merged by plan/exercise name.
