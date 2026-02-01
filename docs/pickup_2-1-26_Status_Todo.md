# MovieMatch — Pickup Notes 2/1/26

## Quick Start
```bash
cd backend && npm start        # Terminal 1 (port 3001)
cd frontend && npm run dev     # Terminal 2 (port 5173)
# Open http://localhost:5173
```

TMDB API key is already in `backend/.env`. If it's missing, grab one free at themoviedb.org/settings/api.

---

## What Happened Today

### The Pivot
MovieMatch started as a group voting tool for picking movies. We pivoted it into a **party game** — 3 fast rounds that narrow 6 movies down to 1 winner. Think Jackbox meets movie night.

### What Was Built
- **Home page** — New landing page explaining the 3-round concept
- **CreateRoom** — Vibe selector (Movie Buffs, Hidden Gems, Fresh Picks, Wildcard) + game length
- **Room.jsx** — Complete game engine orchestrating round flow
- **SpeedRound** — Swipeable cards, 4s timer, NOPE/WATCH overlays, 6 movies
- **ThePitch** — Tap colored tiles to reveal Genre/Cast/Rating/Plot, then vote Keep/Skip, 3 movies
- **FaceOff** — Top 2 side-by-side, tap to pick winner
- **GameResults** — Winner card, fun stats, clipboard share button
- **Backend** — Game state machine endpoints (start-game, vote, advance, timeout)
- **Removed Firebase dependency** from frontend (backend uses in-memory storage)

### Game Flow
```
Lobby (share room code)
  → Fetch 6 movies from TMDB based on vibe
  → Speed Round (swipe yes/no, 4s each)
  → The Pitch (top 3, tap tiles to reveal info, keep/skip)
  → Face-Off (top 2, side-by-side, tap to pick)
  → Results (winner + stats + share)
```

### V1 Feedback (from playing it)
- First version had 12 movies in speed round, 6 in pitch — way too long
- Pitch round originally required writing text — too much friction
- Reworked everything to be faster: 6 → 3 → 2 → winner
- Haven't tested the reworked version yet

---

## Current State

| Area | Status |
|------|--------|
| Frontend builds | Yes (vite build passes) |
| Backend runs | Yes (in-memory mode) |
| Single-player game flow | Works end-to-end |
| Multiplayer sync | Scaffolded (polling), not tested |
| Deployed | No |
| Git | All committed + pushed to `jsech3/MovieMatch` @ `c7fc858` |

---

## TODO (Priority Order)

### Immediate — Test & Polish
- [ ] Play through the reworked 3-round flow and evaluate feel
- [ ] Tweak timing (speed round timer, transition delays)
- [ ] Add smooth animations between rounds (fade/slide transitions)
- [ ] Fix any edge cases (no movies returned, all skipped, etc.)

### Soon — Multiplayer
- [ ] Test with 2 browser tabs (create room in one, join in another)
- [ ] Fix polling sync so both players see same game state
- [ ] Add "waiting for other players" states between rounds

### Later — More Features
- [ ] Deep Cut round (bonus discovery/trivia round)
- [ ] Taste compatibility scores across multiple games
- [ ] Movie night scheduling
- [ ] Swipe gesture polish (momentum, spring physics)
- [ ] Sound effects / haptic feedback cues

### Deploy
- [ ] Frontend → Vercel
- [ ] Backend → Railway
- [ ] Set up production env vars
- [ ] Custom domain

---

## Key Files

| File | What it does |
|------|-------------|
| `frontend/src/pages/Room.jsx` | Game engine — round orchestration, movie filtering between rounds |
| `frontend/src/components/SpeedRound.jsx` | Swipe cards with timer |
| `frontend/src/components/ThePitch.jsx` | Tap-to-reveal tiles + voting |
| `frontend/src/components/FaceOff.jsx` | Side-by-side final pick |
| `frontend/src/components/GameResults.jsx` | Winner display + share |
| `frontend/src/pages/CreateRoom.jsx` | Vibe selector + room creation |
| `frontend/src/pages/Home.jsx` | Landing page |
| `frontend/src/utils/api.js` | All API calls |
| `backend/routes/rooms.js` | Room CRUD + game state endpoints |
| `backend/routes/movies.js` | TMDB movie discovery |
| `backend/config/firebase.js` | Firebase or in-memory adapter |

---

## Decisions Made
- **6 movies total** — keeps the game under 2 minutes
- **No text input** — everything is tap/swipe, zero typing
- **In-memory backend** — no Firebase needed for local dev
- **Frontend drives round progression** — backend stores data, frontend manages which round you're in
- **Vite proxy** — frontend dev server proxies `/api` to backend on port 3001
