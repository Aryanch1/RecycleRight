# RecycleRight

**Point it at anything in your hand and it tells you which bin it belongs in.**

RecycleRight sorts waste the honest way: Recycle, Compost, Trash,
Hazardous or Donate — with the why, the prep steps and where to drop
it off. Snap a photo or type the item name, get a straight verdict,
and watch your diverted-from-landfill tally grow.

## Who it helps

- **Anyone standing over a bin, unsure** — a greasy pizza box, a
  coffee cup, a dead battery — who wants a straight answer, not a
  guessing game.
- **People who want to recycle right** — putting the wrong thing in
  the blue bin contaminates a whole load, so the app says Trash when
  Trash is the honest answer.
- **Households keeping a small habit** — a day streak and a tally of
  items sorted and kilograms diverted make the habit visible.
- **Donors and composters** — still-usable items get a Donate verdict
  and food scraps get Compost, so less ends up in landfill at all.

## Features

- **Sort by photo or by typing** — point the camera at an item or
  type its name; the verdict gives the stream, the reason, numbered
  prep steps and drop-off info.
- **AI sorting** — live Gemini AI when the Python backend is deployed;
  honest on-device demo sorter until then (always labelled LIVE AI vs
  DEMO, never guessed).
- **Guide: what goes where** — every item A to Z, searchable by name
  or keyword, filterable by stream, with the same full verdict detail
  for each item. Tapping a row saves it to history for one-tap re-use.
- **Impact tally** — items sorted, kilograms diverted (labelled as an
  estimate), day streak, a 7-day bar chart and a by-stream split.
- **Accounts** — sign in with Google or email, or continue as a guest
  for this visit only. Signed-in users stay signed in; profile picture
  and display name editable in Settings.
- **Town rules, stated plainly** — the app uses common US curbside
  rules and says so; your town's guide has the final word.
- **Demo data included** — five seeded scans and a 128-item baseline
  so you can see the tally work on first open; clearable from
  Settings.

## Live link

Live web app: coming soon (Vercel link is a publish step).

## Figma design

https://www.figma.com/design/oIlTw3oWjE3M70IBlvIGd7

## How to run

```sh
npm install
npm start          # Expo dev server (Android / iOS via Expo Go, web with `npm run web`)
npm run web        # web dev server
npx expo export --platform web   # static web build into dist/
```

Backend (Python serverless, `api/sort.py`):

```sh
# POST /api/sort with {"item": "..."} — calls Gemini server-side.
# Set GEMINI_API_KEY on the server only; never in app code or this repo.
```

Set `EXPO_PUBLIC_API_URL` to the backend origin for live sorting on
native; without it the app uses its honest on-device demo sorter and
says so. The Gemini key lives server-side only (`GEMINI_API_KEY` env
var on the API) — never in app code or this repo.

Android APK: `eas.json` ships a preview profile. `npm run android`
for a dev build, or the GitHub workflow builds a release APK.

## Tech stack

- React Native + Expo SDK 58 + TypeScript (one codebase: Android,
  iOS, web), expo-router, Reanimated, expo-blur, expo-haptics
- Display font: Bitter (700/800) via @expo-google-fonts/bitter
- Python serverless sorter (`api/sort.py`) on Vercel
- Google Gemini `gemini-3.5-flash-lite` via the OpenAI-compatible
  endpoint, key server-side only
- Firebase Authentication + Firestore (per-user data under
  users/{uid}, owner-only rules) — wiring is a publish step; see
  `lib/firebase.ts` (TODO-RECYCLERIGHT placeholders)

## Demo mode + Firebase pending

Demo mode is honest, not a guesser: the on-device sorter only
answers what it knows from the guide and labels every answer DEMO.
The seeded baseline (128 items / 14.2 kg / 12-day streak) is labelled
wherever it appears and clears from Settings.

Firebase is pending: no project exists yet (the account already has
11 projects, the account limit), so `firebaseConfigured` is false and
the app runs in local/guest demo mode until Aryan deletes an unused
project or gets a limit increase.

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli. See LICENSE.

## Author

Aryanmouli Cherupalli
