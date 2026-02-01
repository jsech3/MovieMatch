# MovieMatch

MovieMatch is a full-stack application designed to help groups of people quickly choose a movie to watch across various streaming services. It features group voting functionality to reach a consensus.

## Features (MVP)

- Filter movies by platform (e.g., Netflix, Prime Video), genre, and runtime.
- Create a group room with a unique shareable code.
- Users can join rooms and vote "yes" or "no" on suggested movies.
- Movies with the most "yes" votes are ranked at the top.
- A "roulette mode" to randomly pick from the top 3 movies if there's no clear consensus.

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Realtime Database (optional — in-memory fallback for local dev)
- **Movie Data API**: TMDB (The Movie Database)
- **Hosting**:
  - Frontend: Vercel
  - Backend: Railway

## Project Structure

```
MovieMatch/
├── backend/        # Node.js + Express backend
├── frontend/       # React + Tailwind frontend
└── README.md       # This file
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- A TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Quick Start (Local Development)

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd MovieMatch
```

2. **Set up the backend:**
```bash
cd backend
npm install
cp .env.local.example .env
```

Edit `.env` and add your TMDB API key:
```
TMDB_API_KEY=your_tmdb_api_key_here
```

Start the backend:
```bash
npm run dev
```

The API will be running at `http://localhost:3001`.

3. **Set up the frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

The frontend will be running at `http://localhost:5173` and automatically proxies `/api` requests to the backend.

4. **Open your browser** and go to `http://localhost:5173`.

> **Note:** Without Firebase credentials, the backend uses in-memory storage. This works for local development and testing — rooms and votes are stored in server memory and reset when the server restarts.

### Getting a TMDB API Key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Settings > API** in your account
3. Request an API key (select "Developer" usage)
4. Copy the **API Key (v3 auth)** into your `.env` file

### Setting Up Firebase (Optional)

Firebase enables persistent storage and real-time multi-device support. For local development, it's not required.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable **Realtime Database**
3. Go to **Project Settings > Service Accounts** and generate a new private key
4. Copy the full `.env.example` to `.env` and fill in the Firebase credentials:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

5. Restart the backend — it will log "Firebase initialized successfully" on startup.

## Environment Files

### Backend

- `.env.local.example` — Minimal config for local dev (just TMDB key + port)
- `.env.example` — Full config including Firebase credentials

### Frontend

- `.env.example` — Frontend environment variables (API URL, Firebase client config)

## Available Scripts

### Backend
- `npm run dev` — Start with nodemon (auto-reload)
- `npm start` — Start in production mode
- `npm test` — Run tests

### Frontend
- `npm run dev` — Start Vite dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
