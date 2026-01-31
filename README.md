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
- **Database**: Firebase Realtime Database (for votes, rooms, users)
- **Movie Data API**: TMDB (The Movie Database)
- **Streaming Availability API**: JustWatch / Utelly (to be integrated)
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

(Instructions will be added as we build the components)
