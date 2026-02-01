# MovieMatch

A movie night party game. Stop scrolling, start playing — find your movie in 3 rounds.

## How It Works

1. **Speed Round** — 6 movies fly by. Swipe right to keep, left to skip. 4 seconds each.
2. **The Pitch** — Top 3 advance. Tap tiles to reveal genre, cast, rating, plot. Vote keep or skip.
3. **Face-Off** — Final 2 go head-to-head. Tap to pick. That's your movie.

Create a room, share the code, everyone plays on their phone.

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express
- **Database**: Firebase Realtime Database (optional — in-memory fallback for local dev)
- **Movie Data**: TMDB API

## Quick Start

```bash
# 1. Clone
git clone https://github.com/jsech3/MovieMatch.git
cd MovieMatch

# 2. Backend
cd backend
npm install
cp .env.local.example .env
# Edit .env → add your TMDB API key (free at themoviedb.org/settings/api)
npm start

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Open http://localhost:5173
```

> Without Firebase credentials, the backend uses in-memory storage. Rooms reset when the server restarts. Fine for local dev.

## Project Structure

```
MovieMatch/
├── backend/
│   ├── server.js                  # Express server
│   ├── config/firebase.js         # Firebase or in-memory adapter
│   └── routes/
│       ├── rooms.js               # Room CRUD + game state endpoints
│       └── movies.js              # TMDB movie discovery
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + user state
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── CreateRoom.jsx     # Vibe selector + game setup
│   │   │   ├── JoinRoom.jsx       # Join by room code
│   │   │   └── Room.jsx           # Game engine (round orchestration)
│   │   ├── components/
│   │   │   ├── SpeedRound.jsx     # Swipe cards, 4s timer
│   │   │   ├── ThePitch.jsx       # Tap-to-reveal tiles, keep/skip
│   │   │   ├── FaceOff.jsx        # Side-by-side final pick
│   │   │   └── GameResults.jsx    # Winner + stats + share
│   │   └── utils/
│   │       └── api.js             # Axios API client
│   └── vite.config.js             # Dev server + API proxy
└── README.md
```

## Game Flow (Room.jsx)

```
Lobby → Fetch 6 movies from TMDB → Speed Round → The Pitch (top 3) → Face-Off (top 2) → Results
```

Each round component calls `onComplete(results)` which Room.jsx uses to filter movies down to the next round.

## Current Status

**Working prototype.** The full 3-round game flow works end-to-end in single-player. Multiplayer room sync via polling is scaffolded but not fully tested with multiple browsers.

### What's done
- Room creation with vibe selector (Movie Buffs, Hidden Gems, Fresh Picks, Wildcard)
- Speed Round: swipeable cards with timed voting, NOPE/WATCH overlays
- The Pitch: tap-to-reveal tiles (genre, cast, rating, plot) with keep/skip voting
- Face-Off: side-by-side tap-to-pick final matchup
- Results screen with winner card, game stats, clipboard share
- Backend game state machine (lobby → voting → reveal → results)
- In-memory Firebase fallback for zero-config local dev

### What's next
- Polish animations and transitions between rounds
- Test multiplayer flow with 2+ browsers
- Add "Deep Cut" round (discovery/trivia bonus round)
- Taste compatibility scores after multiple games
- Movie night scheduling
- Deploy (Vercel frontend, Railway backend)

## Environment

### Backend `.env`
```
TMDB_API_KEY=your_key_here
PORT=3001
```

### Optional: Firebase
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## Getting a TMDB API Key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings > API
3. Request an API key (select "Developer")
4. Copy the **API Key (v3 auth)** into `backend/.env`
