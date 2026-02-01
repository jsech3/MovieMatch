const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a random 6-character alphanumeric room code */
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/** Get room data or return null */
const getRoom = async (roomCode) => {
  const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
  return snapshot.exists() ? snapshot.val() : null;
};

// ---------------------------------------------------------------------------
// Room CRUD
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 */
router.post('/', async (req, res) => {
  try {
    const { creatorName, filters, settings } = req.body || req.query;

    if (creatorName && (typeof creatorName !== 'string' || creatorName.length > 50)) {
      return res.status(400).json({ message: 'Creator name must be a string of 50 characters or less' });
    }

    // Ensure room code is unique
    let roomCode;
    let isUnique = false;
    while (!isUnique) {
      roomCode = generateRoomCode();
      const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
      isUnique = !snapshot.exists();
    }

    const creatorId = uuidv4();

    const roomData = {
      id: roomCode,
      createdAt: new Date().toISOString(),
      creator: creatorName || 'Anonymous',
      filters: filters || {},
      settings: {
        gameMode: 'hot-takes',
        movieCount: 15,
        votingTimeout: 15000,
        blindPitchMode: false,
        ...(settings || {}),
      },
      active: true,
      users: {
        [creatorId]: {
          name: creatorName || 'Anonymous',
          isHost: true,
          joinedAt: new Date().toISOString(),
        },
      },
      movies: {},
      votes: {},
      gameState: {
        phase: 'lobby',
        currentMovieIndex: 0,
        currentMovieId: null,
        round: 1,
        votingStartedAt: null,
      },
    };

    await db.ref(`rooms/${roomCode}`).set(roomData);

    res.status(201).json({
      roomCode,
      message: 'Room created successfully',
      room: roomData,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
});

/**
 * @route   GET /api/rooms/:roomCode
 * @desc    Get room details
 */
router.get('/:roomCode', async (req, res) => {
  try {
    const roomData = await getRoom(req.params.roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });
    res.json(roomData);
  } catch (error) {
    console.error(`Error getting room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error getting room details', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/join
 * @desc    Join an existing room
 */
router.post('/:roomCode/join', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userName } = req.body;

    if (userName && (typeof userName !== 'string' || userName.length > 50)) {
      return res.status(400).json({ message: 'User name must be a string of 50 characters or less' });
    }

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });
    if (!roomData.active) return res.status(400).json({ message: 'This room is no longer active' });

    const userId = uuidv4();
    const userData = {
      name: userName || 'Guest',
      isHost: false,
      joinedAt: new Date().toISOString(),
    };

    await db.ref(`rooms/${roomCode}/users/${userId}`).set(userData);

    res.status(200).json({
      message: 'Successfully joined room',
      roomCode,
      userId,
      room: {
        ...roomData,
        users: { ...roomData.users, [userId]: userData },
      },
    });
  } catch (error) {
    console.error(`Error joining room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error joining room', error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Movie management
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/rooms/:roomCode/movies
 * @desc    Add movies to the room for voting
 */
router.post('/:roomCode/movies', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { movies, userId } = req.body;

    if (!Array.isArray(movies) || movies.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of movies' });
    }

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    if (userId && roomData.users[userId] && !roomData.users[userId].isHost) {
      return res.status(403).json({ message: 'Only the host can add movies to the room' });
    }

    // Add movies
    const moviesObj = {};
    const movieIds = [];
    movies.forEach((movie) => {
      moviesObj[movie.id] = { ...movie, addedAt: new Date().toISOString() };
      movieIds.push(String(movie.id));
    });

    await db.ref(`rooms/${roomCode}/movies`).update(moviesObj);

    // Initialize vote structure
    const votesUpdate = {};
    movieIds.forEach((id) => {
      votesUpdate[id] = { yes: 0, no: 0, users: {} };
    });
    await db.ref(`rooms/${roomCode}/votes`).update(votesUpdate);

    // Store ordered movie list for game phases
    await db.ref(`rooms/${roomCode}/movieOrder`).set(movieIds);

    res.status(200).json({
      message: 'Movies added successfully',
      addedMovies: movieIds.length,
    });
  } catch (error) {
    console.error(`Error adding movies to room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error adding movies', error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Game flow — Hot Takes (synchronized voting)
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/rooms/:roomCode/start-game
 * @desc    Host starts the game — transitions from lobby to first vote
 */
router.post('/:roomCode/start-game', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    // Only host can start
    if (userId && roomData.users[userId] && !roomData.users[userId].isHost) {
      return res.status(403).json({ message: 'Only the host can start the game' });
    }

    const movieOrder = roomData.movieOrder || Object.keys(roomData.movies || {});
    if (movieOrder.length === 0) {
      return res.status(400).json({ message: 'No movies loaded. Add movies first.' });
    }

    const gameState = {
      phase: 'voting',
      currentMovieIndex: 0,
      currentMovieId: movieOrder[0],
      round: 1,
      votingStartedAt: new Date().toISOString(),
    };

    await db.ref(`rooms/${roomCode}/gameState`).set(gameState);

    res.json({ message: 'Game started', gameState });
  } catch (error) {
    console.error(`Error starting game in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error starting game', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/vote
 * @desc    Vote on the current movie. Checks if all users voted → transitions to reveal.
 */
router.post('/:roomCode/vote', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId, movieId, vote } = req.body;

    if (!userId || !movieId || vote === undefined) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['userId', 'movieId', 'vote'],
      });
    }

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    // Validate user and movie
    if (!roomData.users || !roomData.users[userId]) {
      return res.status(404).json({ message: 'User not found in room' });
    }
    if (!roomData.movies || !roomData.movies[movieId]) {
      return res.status(404).json({ message: 'Movie not found in room' });
    }

    // Get current votes
    const votesSnapshot = await db.ref(`rooms/${roomCode}/votes/${movieId}`).once('value');
    const votesData = votesSnapshot.exists() ? votesSnapshot.val() : { yes: 0, no: 0, users: {} };

    // Handle re-vote
    const previousVote = votesData.users ? votesData.users[userId] : undefined;
    if (previousVote !== undefined) {
      votesData[previousVote ? 'yes' : 'no']--;
    }

    const voteValue = vote === true || vote === 'yes' || vote === 1;
    votesData[voteValue ? 'yes' : 'no']++;
    if (!votesData.users) votesData.users = {};
    votesData.users[userId] = voteValue;

    await db.ref(`rooms/${roomCode}/votes/${movieId}`).set(votesData);

    // Check if all users have voted on this movie
    const userIds = Object.keys(roomData.users || {});
    const votedUserIds = Object.keys(votesData.users || {});
    const allVoted = userIds.every((uid) => votedUserIds.includes(uid));

    // If all voted and we're in hot-takes mode, transition to reveal
    if (allVoted && roomData.gameState && roomData.gameState.phase === 'voting') {
      await db.ref(`rooms/${roomCode}/gameState/phase`).set('reveal');
      await db.ref(`rooms/${roomCode}/gameState/revealStartedAt`).set(new Date().toISOString());
    }

    res.status(200).json({
      message: 'Vote recorded successfully',
      movieId,
      allVoted,
      currentVotes: {
        yes: votesData.yes,
        no: votesData.no,
        total: votesData.yes + votesData.no,
      },
    });
  } catch (error) {
    console.error(`Error voting in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error recording vote', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/timeout
 * @desc    Handle voting timeout — mark non-voters as abstained, go to reveal
 */
router.post('/:roomCode/timeout', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    if (!roomData.gameState || roomData.gameState.phase !== 'voting') {
      return res.status(400).json({ message: 'Not in voting phase' });
    }

    // Transition to reveal
    await db.ref(`rooms/${roomCode}/gameState/phase`).set('reveal');
    await db.ref(`rooms/${roomCode}/gameState/revealStartedAt`).set(new Date().toISOString());

    res.json({ message: 'Timeout triggered, moving to reveal' });
  } catch (error) {
    console.error(`Error handling timeout in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error handling timeout', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/advance
 * @desc    After reveal, advance to next movie or transition to results
 */
router.post('/:roomCode/advance', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    const movieOrder = roomData.movieOrder || Object.keys(roomData.movies || {});
    const currentIndex = (roomData.gameState && roomData.gameState.currentMovieIndex) || 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= movieOrder.length) {
      // All movies voted on — go to results
      await db.ref(`rooms/${roomCode}/gameState`).update({
        phase: 'results',
        currentMovieIndex: nextIndex,
        currentMovieId: null,
        votingStartedAt: null,
      });

      return res.json({ message: 'All movies voted, showing results', phase: 'results' });
    }

    // Advance to next movie
    await db.ref(`rooms/${roomCode}/gameState`).update({
      phase: 'voting',
      currentMovieIndex: nextIndex,
      currentMovieId: movieOrder[nextIndex],
      votingStartedAt: new Date().toISOString(),
    });

    res.json({
      message: 'Advanced to next movie',
      phase: 'voting',
      currentMovieIndex: nextIndex,
      currentMovieId: movieOrder[nextIndex],
    });
  } catch (error) {
    console.error(`Error advancing in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error advancing', error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Results & selection
// ---------------------------------------------------------------------------

/**
 * @route   GET /api/rooms/:roomCode/results
 * @desc    Get voting results for a room
 */
router.get('/:roomCode/results', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    const movies = roomData.movies || {};
    const votes = roomData.votes || {};

    const results = Object.keys(movies).map((movieId) => {
      const movie = movies[movieId];
      const movieVotes = votes[movieId] || { yes: 0, no: 0 };
      return {
        id: movieId,
        title: movie.title,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        overview: movie.overview,
        releaseDate: movie.releaseDate,
        yesVotes: movieVotes.yes || 0,
        noVotes: movieVotes.no || 0,
        totalVotes: (movieVotes.yes || 0) + (movieVotes.no || 0),
        score: movieVotes.yes || 0,
      };
    });

    results.sort((a, b) => b.score - a.score);
    const topThree = results.slice(0, 3);

    res.json({
      roomCode,
      totalMovies: Object.keys(movies).length,
      totalVotes: Object.values(votes).reduce((acc, v) => acc + (v.yes || 0) + (v.no || 0), 0),
      results,
      topThree,
    });
  } catch (error) {
    console.error(`Error getting results for room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error getting results', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/roulette
 * @desc    Pick a random movie from the top 3
 */
router.post('/:roomCode/roulette', async (req, res) => {
  try {
    const { roomCode } = req.params;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    const movies = roomData.movies || {};
    const votes = roomData.votes || {};

    const results = Object.keys(movies).map((movieId) => {
      const movie = movies[movieId];
      const movieVotes = votes[movieId] || { yes: 0, no: 0 };
      return {
        id: movieId,
        title: movie.title,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        overview: movie.overview,
        releaseDate: movie.releaseDate,
        yesVotes: movieVotes.yes || 0,
        noVotes: movieVotes.no || 0,
        totalVotes: (movieVotes.yes || 0) + (movieVotes.no || 0),
        score: movieVotes.yes || 0,
      };
    });

    results.sort((a, b) => b.score - a.score);
    const topThree = results.slice(0, 3);

    if (topThree.length === 0) {
      return res.status(400).json({ message: 'No movies available for roulette' });
    }

    const selectedMovie = topThree[Math.floor(Math.random() * topThree.length)];

    await db.ref(`rooms/${roomCode}/selectedMovie`).set({
      ...selectedMovie,
      selectedAt: new Date().toISOString(),
      selectionMethod: 'roulette',
    });

    // Update game phase
    await db.ref(`rooms/${roomCode}/gameState/phase`).set('selected');

    res.json({ message: 'Movie selected by roulette', selectedMovie });
  } catch (error) {
    console.error(`Error running roulette for room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error running roulette', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/select
 * @desc    Select a movie as the winner
 */
router.post('/:roomCode/select', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { movieId, userId } = req.body;

    if (!movieId) return res.status(400).json({ message: 'movieId is required' });

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    const movie = roomData.movies && roomData.movies[movieId];
    if (!movie) return res.status(404).json({ message: 'Movie not found in room' });

    const movieVotes = (roomData.votes && roomData.votes[movieId]) || { yes: 0, no: 0 };

    const selectedMovie = {
      id: movieId,
      title: movie.title,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      yesVotes: movieVotes.yes || 0,
      noVotes: movieVotes.no || 0,
      selectedAt: new Date().toISOString(),
      selectionMethod: 'vote',
      selectedBy: userId || null,
    };

    await db.ref(`rooms/${roomCode}/selectedMovie`).set(selectedMovie);
    await db.ref(`rooms/${roomCode}/gameState/phase`).set('selected');

    res.json({ message: 'Movie selected successfully', selectedMovie });
  } catch (error) {
    console.error(`Error selecting movie in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error selecting movie', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/close
 * @desc    Close a room (mark as inactive)
 */
router.post('/:roomCode/close', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    const roomData = await getRoom(roomCode);
    if (!roomData) return res.status(404).json({ message: 'Room not found' });

    if (userId && roomData.users[userId] && !roomData.users[userId].isHost) {
      return res.status(403).json({ message: 'Only the host can close the room' });
    }

    await db.ref(`rooms/${roomCode}/active`).set(false);
    await db.ref(`rooms/${roomCode}/closedAt`).set(new Date().toISOString());

    res.json({ message: 'Room closed successfully' });
  } catch (error) {
    console.error(`Error closing room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error closing room', error: error.message });
  }
});

module.exports = router;
