# RecycleRight — Design

## Identity: "The kraft-paper sorting desk"

A calm, practical desk where every item in your hand gets a straight
answer: which bin, why, and what to do first. The home is
**scan-first** — a typographic display headline ("Where does this
go?") over one big pine scan tile, a "type an item" field, four stream
quick-chips, then a recent-scans feed. No photo hero, no ledger, no
dashboard grid, no ring, no poster type, no top segmented tabs.
Navigation is a **flat white bottom tab bar** with labeled icons
(Scan / Guide / Impact / Settings). Detail screens are full-screen
takeovers with a big colored verdict banner in the stream color.

Palette: kraft paper `#F6F1E7` (ground), deep pine `#14532D`
(primary), leaf `#16A34A` (accent), ink `#1F2A1F`. The five waste
streams each own a color: Recycle blue `#2563EB`, Compost green
`#16A34A`, Trash slate `#64748B`, Hazard red `#DC2626`, Donate purple
`#7C3AED`, with caution amber `#F59E0B`. Display font: **Bitter
700/800** via `@expo-google-fonts/bitter`. Cards 28px radius (sheets
36px), pills fully round, primary CTA a pine gradient with a soft
glow, stream pills tinted in their stream color.

## Distinctness vs the previous app (the neighborhood swap board)

| Element | Previous app | RecycleRight |
|---|---|---|
| Display font | Outfit 700/800 (geometric sans) | Bitter 700/800 (slab serif) |
| Navigation | Flat white bottom tab bar + raised amber "+" center button | Flat white bottom tab bar, four labeled tabs, no center button |
| Hero | Typographic hero + data strip + arch neighbor rail | Typographic display headline + one big pine scan tile + type-an-item field + stream quick-chips |
| Home structure | Board of match cards with big match-% numbers | Scan-first desk + recent-scans feed |
| Palette | Neighbor blue `#1F5FA8` + amber on warm paper | Deep pine `#14532D` + leaf on kraft paper |
| Refresh motif | Two arrows swapping in a circle | Recycling loop: three chasing arrows filling leaf green |
| Data visual | Big match-% numbers + data strip | Huge Bitter tally numbers + 7-day bar chart + by-stream split bars |
| Detail | Listing page with "Write my hello" intro writer | Verdict takeover: colored banner, why, numbered prep steps, drop-off |

No screen shares the previous app's home structure, navigation chrome,
or display font. Nothing here could be mistaken for a swap board.

## Tokens

- `palette` — primary `#14532D`, primaryDeep `#0B3D1E`,
  primaryLight `#1E6B3C`, primarySoft `#DCEADF`, primaryPale
  `#EDF4EE`; leaf `#16A34A`, leafDeep `#15803D`, leafSoft `#DCF2E3`;
  stream colors in `streamColors` (recycle `#2563EB` / `#DBEAFE`,
  compost `#16A34A` / `#DCF2E3`, trash `#64748B` / `#E2E8F0`,
  hazard `#DC2626` / `#FEE2E2`, donate `#7C3AED` / `#EDE9FE`);
  caution `#F59E0B` / `#FEF3C7`; ground `#F6F1E7`; ink `#1F2A1F`,
  body `#4B574B`, muted `#8A938A`, line `rgba(31,42,31,0.10)`,
  surface `#FFFFFF`, glass `rgba(255,255,255,0.62)`,
  glassStrong `rgba(255,255,255,0.85)`, sheet
  `rgba(255,255,255,0.92)`.
- `spacing` — xs 4, sm 8, md 16, lg 24, xl 32, xxl 48.
- `radii` — sm 12, md 18, card 28, sheet 36, pill 999, input 24.
- `font` — display `Bitter_800ExtraBold`, bold `Bitter_700Bold`.
- `type` — display 40/44, displayWide 52/54, title 26/32, subtitle
  17/24 bold, body 15/22, bodyStrong 15/22 bold, caption 12/16
  (letter-spacing 0.6), label 11/14 (letter-spacing 1.1).
- `shadows` — card (ink, 10/24, 0.10), glow (pine, 8/18, 0.35),
  leafGlow (leaf, 8/18, 0.40), float (ink, 4/12, 0.08).
- `useResponsive()` — `<600` compact (single column, full width);
  `600–840` medium (content cap 640, larger display type);
  `840–1280` wide (content cap 1024, two-pane on); `≥1280` desktop
  (content cap 1120, two-pane on).

## Screen inventory + flow

1. **Splash** — kraft paper, pine rounded square with the recycling
   mark.
2. **Welcome gate** (every open, signed-out non-guest) — pine panel
   with the recycling loop and "WHERE DOES THIS GO?"; exactly four
   options: Continue with Google / Create account / Log in (+ Forgot
   password) / Continue without an account.
3. **Home / Scan** — display headline, big pine scan tile (camera),
   "type an item" field, four stream quick-chips (each opens the Guide
   pre-filtered with `?stream=...`), recent-scans feed. Sorting runs
   live AI when the backend answers, honest on-device demo sorter
   otherwise, always labelled LIVE AI vs DEMO.
4. **Result detail** — full-screen takeover: big colored banner in
   the stream color (glyph + stream name + item name), why it goes
   there, numbered prep steps, drop-off info, log-to-tally action.
5. **Guide** — searchable "what goes where": search field (name +
   keywords, case-insensitive), stream filter chips (All + five
   streams with glyphs and colors), A-Z item rows (name, stream pill,
   chevron), count label computed from the guide. Tapping a row opens
   the same verdict layout as the result screen (in place on wide
   screens, full-screen takeover on narrow ones) and records the item
   in history for one-tap re-use. Empty state with a clear-search
   action when nothing matches.
6. **Item detail** — the Guide's verdict view (not a separate route):
   banner, why, numbered prep steps, drop-off.
7. **Impact** — the big tally: huge Bitter numbers for items sorted,
   kg diverted (labelled "estimated", with a note that weights are
   estimates), streak in days; a 7-day bar chart (today highlighted
   in pine); a by-stream split (colored bars + counts + % of total);
   a "Demo data" note while the seeded baseline is in the totals,
   with a link to Settings to clear it; an empty state when demo data
   is off and nothing has been sorted yet.
8. **Settings / Profile** — avatar circle (initials or photo),
   display name (editable inline), email + sign-in method,
   picture change (resized to max 256px, stored as base64),
   password-reset email for password accounts, sign out; town-rules
   note ("Rules vary by town…"); show-demo-data toggle; danger zone
   (clear history, clear demo data — both confirm in place);
   about (version read from app.json only, MIT license,
   © 2026 Aryanmouli Cherupalli); link to Help.
9. **Help & about** — how sorting works, expandable FAQ (why Trash,
   batteries and electronics, is the AI always right, town rules, photo
   did not sort, privacy), the sorting-guidance disclaimer (guidance,
   not a legal guarantee; hazardous items follow local law), and a
   support note pointing to Settings.
10. **Empty states** — no guide matches, nothing sorted yet, no scans
    in the last 7 days, no history saved yet, each with a next step.
11. **Toasts / inline feedback** — "Name updated", "History cleared",
    "Demo data cleared", "Profile picture updated" appear where the
    user is looking; destructive taps arm first ("Tap again to
    confirm") and then report the result in place.

## Transition + animation plan

- Screen changes: slide from right (expo-router stack), 60fps.
- Cards enter with a staggered spring rise (FadeInDown, 40–70ms steps).
- Every pressable: Reanimated spring scale to ~0.95 with overshoot
  settle; primary actions add a light haptic tap (mobile only).
- Stream filter chips fill with their stream color when selected.
- Buttons show bouncing dots while loading — never a frozen button.
- Skeleton loaders shimmer while a refresh replays.
- **Custom pull-to-refresh ("recycling loop")**: the pull is scrubbed
  by finger distance — three arrows chase each other around a loop,
  filling with leaf green as the user pulls; past the threshold,
  releasing plays the loop spin while data returns, then content
  settles with a spring and cards re-enter staggered. On web the same
  animation is wired to the header refresh button.
- Glass surfaces use the two-layer structure everywhere (outer view:
  background + shadow; inner view with overflow hidden clips the
  BlurView) so Android never paints a white plate.

## Responsive widths (static audit)

Breakpoints driven by `useWindowDimensions` in `lib/theme.ts`:
`<600` single column, full-width cards; `600–840` wider content cap,
larger type; `840–1280` **two-pane** (Guide list left, selected item
detail right); `≥1280` centered shell, max 1120px. No fixed-width
containers anywhere: lists, chips and bars all flex or wrap; the
chip row scrolls horizontally. Widths checked by layout audit
(static): 360, 390, 430 (5–7 inch phones), 600 (foldable folded),
840 (tablet / foldable unfolded, two-pane on), 1024 and 1440
(PC/desktop). Live-browser visual check is a publish step, as with
the previous apps.

## Demo data

First launch seeds five demo scans (plastic bottle → Recycle, banana
peel → Compost, AA batteries → Hazard, old jeans → Donate, greasy
pizza box → Trash) and, while demo data is on, the Impact screen
includes a seeded baseline of **128 items / 14.2 kg / 12-day streak**.
The guide itself is a fixed reference list (count shown live from the
data, never hand-typed). Demo scans and the baseline clear from
Settings; the demo toggle hides them without deleting them. Every
demo surface is labelled DEMO; live AI answers are labelled LIVE AI.

## Self-check scores (quality / distinctness vs previous app)

- Home / Scan: 90% / 96% — scan-first desk, pine tile, quick-chips
  and recent-scans feed read as a sorting desk at a glance; nothing
  board-like.
- Result detail: 90% / 94% — colored verdict banner + numbered prep
  steps + drop-off; a verdict, not a listing page.
- Guide: 90% / 95% — A-Z reference list with stream pills and a
  verdict detail; distinct from any board by the search + stream-chip
  system and the bin language.
- Item detail: 89% / 93% — same verdict layout as the result screen,
  kept inside the Guide on wide screens.
- Impact: 90% / 95% — huge Bitter tally numbers, weekly bars and the
  by-stream split; a tally, not a data strip or match scores.
- Welcome: 88% / 92% — pine panel + recycling loop, no amber, no
  neighbor language.
- Settings / Help: 85% / 88% — standard structure, recolored and
  rewritten in sorting language.

## Figma

Design file: https://www.figma.com/design/oIlTw3oWjE3M70IBlvIGd7
("RecycleRight — Daily App"). The file was created, but the canvas
could NOT be populated: the Figma MCP Starter-plan tool-call limit
was hit, so this document is the design source of truth.

## Firebase — pending

No Firebase project exists for RecycleRight yet (2026-11-24). The
`aryanch99999@gmail.com` account already has 11 Firebase projects,
the account limit, so no new project could be created (the same
block the previous app hit on 2026-11-23). `lib/firebase.ts` and
`lib/firebase.native.ts` carry TODO-RECYCLERIGHT placeholders and
`lib/config.ts` has `firebaseConfigured = false`. Until a project
exists — Aryan deletes an unused project or gets a limit increase —
the app runs in local/guest demo mode: scans and history live on the
device, sign-in is offered but sync is off, and Settings says so
plainly ("Not set up yet — guest mode").
