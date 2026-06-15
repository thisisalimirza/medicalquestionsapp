# MyMedQuestions — Product & Engineering Plan

> A rapid-capture app for medical students to log "things that came up" during
> didactics, react to them metacognitively in one tap, let AI quietly do the
> first pass of research, and resurface them for durable learning later.

_Status: draft for approval. Last updated: 2026-06-15._

---

## 1. The core insight

A med student in lecture hears something they don't fully know. They have ~2
seconds of spare attention. The current options are bad: a full note app is too
slow, and a mental "I'll remember to look that up" almost always fails.

The product is built around **one gesture**: capture the fragment + tag the
*feeling* it triggered, in under 3 seconds, then forget about it. Everything
else (AI research, organization, resurfacing) happens later or in the
background.

The emotional reaction is not decoration — it is the most valuable signal in the
app. "Damn, I didn't know that at all" vs. "I kind of vaguely remember this" is a
real-time **judgment of learning**. We capture it at the exact moment it's most
accurate (during the lecture, not in retrospect) and use it to drive how
aggressively we resurface the item later.

### Design prerequisites (non-negotiable)
- **Fluid, fun, rapid.** Capture must feel like a reflex, not a task.
- **Works offline.** Lecture-hall wifi is unreliable; capture can NEVER block on
  a network call.
- **Minimal but functional.** Few screens, no clutter, no settings rabbit holes.

---

## 2. Decisions locked in (from kickoff)

| Area | Decision |
|------|----------|
| Cross-platform stack | **Expo / React Native** (iOS, iPadOS, Android, + web) |
| Data model | **Local-first** with **cloud sync** (offline capture, multi-device) |
| AI | **Backend proxy** calling the **Claude API** (key stays server-side) |
| This session | **Written plan first** (this document) |
| Working name | **MyMedQuestions** |

---

## 3. Design system

Derived from the provided Coolors palette. We assign each color a *semantic
role* so the UI stays consistent and we never pick colors ad hoc.

| Token | Hex | Palette name | Role |
|-------|-----|--------------|------|
| `primary` | `#2660A4` | Baltic Blue | Primary actions, active nav, brand, focus rings |
| `surface` | `#EDF7F6` | Azure Mist | App background / cards (light, calm, clinical) |
| `accent` | `#F19953` | Sandy Brown | Highlights, the capture FAB, energy/CTA moments |
| `accentDeep` | `#C47335` | Copper | Pressed/secondary accent, badges, streaks |
| `ink` | `#56351E` | Deep Walnut | Primary text, headings, high-contrast detail |

Derived neutrals (tints/shades of the above, not new hues) handle borders,
muted text, and disabled states so the palette stays tight.

**Emotion bucket colors** (see §5) are drawn from this same set so the whole app
reads as one family:
- New-to-me → Baltic Blue
- Forgot-it → Copper
- Fuzzy → Sandy Brown
- Got-it → muted Deep Walnut / green-tinted neutral

**Typography:** one humanist sans (e.g. Inter) at a tight type scale (4–5 sizes).
Large, confident headings in Deep Walnut. Generous whitespace on Azure Mist.

**Motion language:** spring-based, short (150–250ms). Capture confirmation uses a
satisfying micro-animation (card flies into its bucket) — this is where "fun"
lives. Haptics on every capture and sort on iOS/Android.

**Theming:** light mode first (Azure Mist base). Dark mode is a fast-follow using
Deep Walnut as the base surface.

---

## 4. The rapid-capture flow (the heart of the app)

Goal: **launch → captured → back to listening** in < 3 seconds.

1. **Instant entry.** App opens directly to the capture field (no home screen
   in the way). A persistent capture button is reachable from anywhere.
2. **Multi-modal input**, in order of speed:
   - **Voice-to-text** (on-device dictation) — primary path in a lecture. Tap
     mic, mutter the term, done.
   - **Type** a few words.
   - **Photo** of a slide (OCR'd later) for "that diagram."
3. **One-tap emotion sort.** Immediately after entry, four large tappable
   buckets (or a swipe gesture) let them classify the *feeling*. This is
   optional — they can skip and sort later in batch.
4. **Optional context, zero-friction.** A single "context" chip: lecture/course,
   auto-suggested from calendar + time of day, or a quick free-text tag. Nothing
   is required.
5. **Fire-and-forget.** Save is instant and local. A background job is queued for
   AI enrichment (runs when connectivity returns).

**Batch sort mode (the "fun" loop):** later, a Tinder-style stack lets them
rip through unsorted captures, swiping each into a bucket. Fast, gamified,
satisfying — turns a backlog into a 60-second game.

---

## 5. Emotion / recall buckets

These double as the **spaced-repetition priority signal**. Four buckets keep it
fast (four is the max you can eyeball-tap without thinking):

| Bucket | Student's gut reaction | Meaning | Resurface priority |
|--------|------------------------|---------|--------------------|
| **New to me** | "Damn, I didn't know that at all" | Never learned | High |
| **Forgot it** | "Fuck, I don't remember that" | Knew it, blanked | **Highest** |
| **Fuzzy** | "I vaguely remember, but not well enough" | Partial recall | Medium |
| **Got it** | "Oh right, I know this" (confirmation) | Solid | Low / archive |

"Forgot it" is highest priority because forgetting something previously learned
is the strongest signal of a decaying memory worth rescuing.

The bucket sets the **initial interval** for the resurfacing engine (§7).

**Custom buckets.** The four above ship as defaults, but students can add their
own (e.g. "Ask a resident", "Board-relevant", "Confused by the slide"). Rules to
keep the core gesture fast and joyful:
- Sort UI shows at most ~6 buckets at once; beyond that, extras live in a "More"
  sheet so the one-tap target grid never gets cramped.
- Creating a bucket is itself delightful: name it, pick a color from the palette,
  pick an emoji, set its resurface priority — all in one playful sheet with live
  preview. No buried settings screen.
- Each custom bucket maps to a resurface priority (Highest→Low) so the
  spaced-repetition engine treats it correctly.
- Defaults can be renamed/recolored but not deleted (keeps onboarding sane);
  custom ones are fully editable and reorderable by drag.

---

## 6. AI enrichment pipeline

The promise: by the time the student comes back, "a little research is already
done." Quality scales with how much context they gave.

**Flow:**
1. Capture is saved locally and enqueued.
2. When online, the app sends the fragment (+ context, + OCR'd slide text) to
   **our backend**, which calls the **Claude API** (key server-side, never on
   device).
3. Claude returns a structured enrichment we render later:
   - **Disambiguation / title** — what the term most likely refers to in a med
     context.
   - **Plain-language explanation** (1–2 sentences).
   - **Why it matters clinically** (high-yield framing).
   - **Key facts / mnemonics** worth memorizing.
   - **Suggested tags** (system, organ, discipline) for auto-organization.
   - **Confidence flag** — if the fragment is too vague, it says so and proposes
     clarifying questions instead of hallucinating.
4. Enrichment is cached locally and synced.

**Guardrails (medical accuracy matters):**
- The model is prompted to flag uncertainty rather than guess, and to mark
  content as **study aid, not clinical advice**.
- Every enrichment is clearly labeled "AI-generated — verify against your
  sources." We are a *starting point for research*, not a reference.
- Consider grounding/citation to reputable sources in a later version.

**Cost control:** batch/queue enrichments, debounce, cache aggressively, and use
a smaller/faster Claude model for routine enrichments with escalation only when
needed. Per-user rate limits on the backend.

---

## 7. Resurfacing engine (durable learning)

The reason captures don't die in a list. A lightweight spaced-repetition system:

- Each item gets a **next-review date** seeded by its bucket (Forgot-it soonest).
- A daily **"Resurface" queue** shows a few due items: the fragment first
  ("do you remember this now?"), then the AI enrichment on tap.
- The student gives a quick self-rating (Still fuzzy / Got it now / Nailed it),
  which adjusts the next interval (SM-2-style, simplified).
- **Resurfacing is opt-in and gentle** — a small daily nudge, not a Duolingo
  guilt machine. Streaks exist but are understated (Copper badge).

---

## 8. Information architecture / screens

Four primary surfaces, bottom-tab navigation:

1. **Capture** (default) — the instant-entry screen of §4.
2. **Library** — all captures, searchable, filterable by bucket / course / tag /
   "needs sorting." This is where AI enrichments are read and edited.
3. **Resurface** — today's due items (§7).
4. **Profile** — courses, account/sync status, theme, export.

Plus: **Item detail** (fragment + AI enrichment + context + notes + history) and
**Batch sort** (the swipe game).

---

## 9. Architecture & tech

**Client (Expo / React Native, TypeScript)**
- Expo Router for navigation; works across iOS/iPadOS/Android/web.
- **Local store:** SQLite (via `expo-sqlite` / `op-sqlite`) for durable,
  queryable offline data. A small state layer (Zustand) over it.
- **Sync:** offline-first queue; each record has `id`, `updatedAt`, `dirty`,
  `syncState`. Last-write-wins per field to start (simple, good enough for a
  single user across their own devices).
- Voice: on-device speech-to-text. Photos: `expo-image-picker`; OCR can be
  server-side to keep the app light.
- iPad: master–detail layout (list + item) to use the bigger screen.

**Backend**
- A thin API (Node/TypeScript or a serverless platform) exposing:
  `/auth`, `/sync`, `/enrich`. Holds the **Anthropic API key**.
- Managed Postgres for the synced source of truth.
- A job queue for enrichment (so requests can fail/retry without blocking sync).
- Auth: email magic-link or Apple/Google sign-in (Apple sign-in is required by
  App Store if we offer other social logins).

**Why this shape:** capture never depends on the backend; the backend only adds
sync + AI. If the backend is down, the app is still fully usable.

---

## 10. Data model (first cut)

```
User        { id, email, createdAt }
Course      { id, userId, name, color, schedule? }
Capture     { id, userId, text, audioUri?, imageUri?, ocrText?,
              bucket: enum, courseId?, tags[], source?,
              createdAt, updatedAt, syncState }
Enrichment  { id, captureId, title, summary, clinicalRelevance,
              keyFacts[], suggestedTags[], confidence, model,
              status: queued|done|failed, createdAt }
Review      { id, captureId, dueAt, interval, ease, lastResult, history[] }
```

---

## 11. Risks & how we handle them

| Risk | Mitigation |
|------|-----------|
| Capture feels slow → app dies | Obsess over the <3s path; offline-first; voice as default; measure cold-start time |
| Bad lecture-hall connectivity | Everything local-first; AI is async and never blocks |
| AI medical inaccuracy / liability | Uncertainty flags, "study aid not advice" labeling, verify-your-sources framing |
| AI cost blowup | Queue + cache + cheaper model default + per-user limits |
| Over-feature creep kills the simplicity | Hard line: protect the four-screen IA and the four buckets in v1 |
| App Store review (medical + AI) | Clear disclaimers, no diagnostic claims, Apple sign-in support |
| Sync conflicts across devices | Field-level last-write-wins; single-user scope keeps this tractable |
| Privacy of health-adjacent study data | Encrypt in transit + at rest; clear data export/delete; no third-party data sale |

---

## 12. Ancillary features worth including (prioritized)

**v1 essentials (beyond the core loop):**
- Search across captures + enrichments.
- Course/context tagging with calendar-aware suggestions.
- Slide-photo capture with later OCR.
- **Intelligent Anki export** — students live in Anki; this is a killer
  integration and must be genuinely good, not a dumb text dump. See §15.

**Fast-follow (v1.x):**
- Dark mode.
- Widgets / lock-screen quick-capture (iOS) for true 1-tap entry.
- Apple Watch / quick-capture share-sheet.
- Streaks + gentle resurfacing nudges.

**Later:**
- Source-grounded AI with citations.
- Shared decks / study groups.
- Cross-reference linking between related captures ("you logged this before").

---

## 13. Proposed milestones

1. **M0 — Scaffold & design system.** Expo app, navigation, tokens from the
   palette, component primitives.
2. **M1 — Core capture (offline, local-only).** Instant entry, voice, four
   buckets, batch-sort swipe. _This is the demoable heart._
3. **M2 — Library + item detail + search.**
4. **M3 — Backend + auth + sync.**
5. **M4 — Claude enrichment pipeline.**
6. **M5 — Resurfacing engine.**
7. **M6 — Polish: haptics, motion, dark mode, Anki export, store prep.**

We can ship a compelling internal demo at the end of **M1** with zero backend.

---

## 15. Intelligent Anki export

A dumb export (front = fragment, back = blob) is worse than useless — it creates
bad cards students delete. We make the AI do the work of a good card author.

**What "intelligent" means here:**
- **Atomic cards.** The enrichment is decomposed into multiple well-formed cards,
  each testing *one* fact (Anki's minimum-information principle), instead of one
  giant card.
- **Right card type per fact:** basic Q/A, **cloze deletions** for definitions
  and lists, and image-occlusion-friendly output when a slide photo exists.
- **High-yield framing.** Claude generates cards in the style that works for
  boards — clinical vignette → answer, mechanism prompts, "buzzword → diagnosis."
- **Preview & curate before export.** The student sees the generated cards, can
  edit/delete/regenerate any of them, and picks which make the cut. No surprise
  garbage in their deck.
- **Clean `.apkg` output** with a proper deck name (mapped from course/bucket),
  tags carried over from enrichment, and scheduling left to Anki. We generate a
  real Anki package (genanki-style structure) rather than fragile CSV.
- **Round-trip respect.** Exported cards are marked as exported and link back to
  the source capture so nothing is double-exported.

This is its own milestone-grade feature; it lands after the enrichment pipeline
(M4) since card quality depends on enrichment quality.

---

## 14. Open questions for later (not blocking)

- Target users beyond med students (residents, other health pros)?
- Free vs. paid? (AI cost suggests a free tier + paid "unlimited enrichment.")
- Which med curricula/regions first (affects AI prompting + examples)?
- Final app name + branding (MyMedQuestions is the working title).
