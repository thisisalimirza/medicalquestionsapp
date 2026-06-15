# MyMedQuestions

Rapid-capture app for medical students: log something that came up in class in
under 3 seconds, react to it in one tap, let AI do the first pass of research,
and resurface it for durable learning later.

> Working title. Cross-platform (iOS, iPadOS, Android, web) via Expo / React Native.

See **[PLAN.md](./PLAN.md)** for the full product & engineering plan.

## Status

Milestone **M1 — core capture loop (local, offline-first)**:

- ⚡️ Instant **Capture** screen (auto-focus, voice/photo buttons, one-tap quick-sort)
- 🃏 **Swipe-sort** game — fling captures into reaction buckets (`/sort`)
- 🪣 Four default **reaction buckets** + fully custom buckets (color, emoji, priority)
- 📚 **Library** with search + filter by bucket / "needs sorting"
- 🌱 **Resurface** + **Profile** scaffolds, stats, Anki-export entry point
- 💾 Offline-first local persistence (AsyncStorage today; SQLite per the plan)

Backend sync, Claude enrichment, the resurfacing engine, and intelligent Anki
export are the next milestones (M3–M6 in the plan).

## Run

```bash
npm install
npm start        # then press i / a, or scan with Expo Go
```

Requires Node 18+. iOS simulator needs macOS; otherwise use Expo Go or an
Android emulator.

## Project layout

```
app/                 Expo Router routes
  (tabs)/            Capture · Library · Resurface · Profile
  sort.tsx           Swipe-to-sort game (modal)
  bucket-editor.tsx  Create/edit reaction buckets (modal)
src/
  theme/             Design tokens derived from the brand palette
  store/             Zustand store (offline-first, swappable persistence)
  components/        Shared UI (BucketPill, …)
  data/              Default buckets + palette choices
  types/             Domain types
```

## Design system

Colors map the brand palette to semantic roles (see `src/theme/colors.ts`):
Baltic Blue = primary, Azure Mist = background, Sandy Brown = accent/CTA,
Copper = badges, Deep Walnut = text.

## Disclaimer

Study aid, not medical advice. AI-generated research is a starting point —
always verify against primary sources.
