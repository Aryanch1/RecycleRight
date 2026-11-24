/**
 * RecycleRight runtime config.
 *
 * The sorter is a Python Vercel serverless function (api/sort.py):
 * POST /api/sort with {"item": "..."} calls Gemini
 * (gemini-3.5-flash-lite via the OpenAI-compatible endpoint) with the
 * key server-side only (GEMINI_API_KEY env var). When no endpoint
 * answers, the app falls back to its on-device demo sorter
 * (lib/sort.ts) and says so honestly with a DEMO badge.
 *
 * No Gemini key ever lives in this file or in app code; the key is
 * server-side only in the /api/sort function (GEMINI_API_KEY env var).
 */

/** Deployed backend origin for native, or '' to use same-origin /api on web. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/**
 * Set to true once the Firebase project for RecycleRight exists and
 * the values in lib/firebase.ts / lib/firebase.native.ts are the
 * real web config. No project exists yet (2026-11-24) — the
 * aryanch99999@gmail.com account already has 11 Firebase projects,
 * the account limit, so no new project could be created (the same
 * block SkillSwapLocal hit on 2026-11-23). TODO-RECYCLERIGHT
 * placeholders in both files; wiring is a publish step once Aryan
 * deletes an unused project or gets a limit increase.
 */
export const firebaseConfigured = false;
