const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { creatorName, filters } = req.body || req.query;

    // Input validation
    if (creatorName && (typeof creatorName !== 'string' || creatorName.length > 50)) {
      return res.status(400).json({ message: 'Creator name must be a string of 50 characters or less' });
    }
    
    // Generate a unique 6-character room code
    const generateRoomCode = () => {
      // Generate a random alphanumeric code (uppercase letters and numbers)
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    };
    
    // Ensure room code is unique
    let roomCode;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = generateRoomCode();
      const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
      isUnique = !snapshot.exists();
    }
    
    // Create room data
    const roomData = {
      id: roomCode,
      createdAt: new Date().toISOString(),
      creator: creatorName || 'Anonymous',
      filters: filters || {},
      active: true,
      users: {
        [uuidv4()]: { // Creator's user ID
          name: creatorName || 'Anonymous',
          isHost: true,
          joinedAt: new Date().toISOString()
        }
      },
      movies: {},
      votes: {}
    };
    
    // Save room to Firebase
    await db.ref(`rooms/${roomCode}`).set(roomData);
    
    res.status(201).json({ 
      roomCode,
      message: 'Room created successfully',
      room: roomData
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
});

/**
 * @route   GET /api/rooms/:roomCode
 * @desc    Get room details
 * @access  Public
 */
router.get('/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Get room data from Firebase
    const snapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = snapshot.val();
    
    res.json(roomData);
  } catch (error) {
    console.error(`Error getting room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error getting room details', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/join
 * @desc    Join an existing room
 * @access  Public
 */
router.post('/:roomCode/join', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userName } = req.body;

    // Input validation
    if (userName && (typeof userName !== 'string' || userName.length > 50)) {
      return res.status(400).json({ message: 'User name must be a string of 50 characters or less' });
    }

    // Check if room exists
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = roomSnapshot.val();
    
    // Check if room is active
    if (!roomData.active) {
      return res.status(400).json({ message: 'This room is no longer active' });
    }
    
    // Generate user ID
    const userId = uuidv4();
    
    // Add user to room
    const userData = {
      name: userName || 'Guest',
      isHost: false,
      joinedAt: new Date().toISOString()
    };
    
    await db.ref(`rooms/${roomCode}/users/${userId}`).set(userData);
    
    res.status(200).json({ 
      message: 'Successfully joined room',
      roomCode,
      userId,
      room: {
        ...roomData,
        users: {
          ...roomData.users,
          [userId]: userData
        }
      }
    });
  } catch (error) {
    console.error(`Error joining room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error joining room', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/movies
 * @desc    Add movies to the room for voting
 * @access  Public
 */
router.post('/:roomCode/movies', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { movies, userId } = req.body;
    
    if (!Array.isArray(movies) || movies.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of movies' });
    }
    
    // Check if room exists
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = roomSnapshot.val();
    
    // Check if user is host (only host can add movies)
    if (userId && roomData.users[userId] && !roomData.users[userId].isHost) {
      return res.status(403).json({ message: 'Only the host can add movies to the room' });
    }
    
    // Add movies to room
    const moviesObj = {};
    
    movies.forEach(movie => {
      moviesObj[movie.id] = {
        ...movie,
        addedAt: new Date().toISOString()
      };
    });
    
    await db.ref(`rooms/${roomCode}/movies`).update(moviesObj);
    
    // Initialize vote structure for these movies
    const votesUpdate = {};
    Object.keys(moviesObj).forEach(movieId => {
      votesUpdate[movieId] = { yes: 0, no: 0, users: {} };
    });
    
    await db.ref(`rooms/${roomCode}/votes`).update(votesUpdate);
    
    res.status(200).json({ 
      message: 'Movies added successfully',
      addedMovies: Object.keys(moviesObj).length
    });
  } catch (error) {
    console.error(`Error adding movies to room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error adding movies', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/vote
 * @desc    Vote on a movie
 * @access  Public
 */
router.post('/:roomCode/vote', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId, movieId, vote } = req.body;
    
    if (!userId || !movieId || vote === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        required: ['userId', 'movieId', 'vote'] 
      });
    }
    
    // Check if room exists
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user exists in room
    const userSnapshot = await db.ref(`rooms/${roomCode}/users/${userId}`).once('value');
    
    if (!userSnapshot.exists()) {
      return res.status(404).json({ message: 'User not found in room' });
    }
    
    // Check if movie exists in room
    const movieSnapshot = await db.ref(`rooms/${roomCode}/movies/${movieId}`).once('value');
    
    if (!movieSnapshot.exists()) {
      return res.status(404).json({ message: 'Movie not found in room' });
    }
    
    // Get current votes for the movie
    const votesSnapshot = await db.ref(`rooms/${roomCode}/votes/${movieId}`).once('value');
    const votesData = votesSnapshot.exists() ? votesSnapshot.val() : { yes: 0, no: 0, users: {} };
    
    // Update votes
    // If user already voted, update their vote
    const userPreviousVote = votesData.users[userId];
    
    if (userPreviousVote !== undefined) {
      // Decrement previous vote count
      votesData[userPreviousVote ? 'yes' : 'no']--;
    }
    
    // Increment new vote count
    const voteValue = vote === true || vote === 'yes' || vote === 1;
    votesData[voteValue ? 'yes' : 'no']++;
    
    // Update user's vote
    votesData.users[userId] = voteValue;
    
    // Save updated votes
    await db.ref(`rooms/${roomCode}/votes/${movieId}`).set(votesData);
    
    res.status(200).json({ 
      message: 'Vote recorded successfully',
      movieId,
      currentVotes: {
        yes: votesData.yes,
        no: votesData.no,
        total: votesData.yes + votesData.no
      }
    });
  } catch (error) {
    console.error(`Error voting in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error recording vote', error: error.message });
  }
});

/**
 * @route   GET /api/rooms/:roomCode/results
 * @desc    Get voting results for a room
 * @access  Public
 */
router.get('/:roomCode/results', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Get room data
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = roomSnapshot.val();
    
    // Get movies and votes
    const movies = roomData.movies || {};
    const votes = roomData.votes || {};
    
    // Calculate results
    const results = Object.keys(movies).map(movieId => {
      const movie = movies[movieId];
      const movieVotes = votes[movieId] || { yes: 0, no: 0 };
      
      return {
        id: movieId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        yesVotes: movieVotes.yes || 0,
        noVotes: movieVotes.no || 0,
        totalVotes: (movieVotes.yes || 0) + (movieVotes.no || 0),
        score: movieVotes.yes || 0 // We sort by yes votes
      };
    });
    
    // Sort by yes votes (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Get top 3 for roulette mode
    const topThree = results.slice(0, 3);
    
    res.json({
      roomCode,
      totalMovies: Object.keys(movies).length,
      totalVotes: Object.values(votes).reduce((acc, vote) => acc + vote.yes + vote.no, 0),
      results,
      topThree
    });
  } catch (error) {
    console.error(`Error getting results for room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error getting results', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/roulette
 * @desc    Pick a random movie from the top 3
 * @access  Public
 */
router.post('/:roomCode/roulette', async (req, res) => {
  try {
    const { roomCode } = req.params;
    
    // Get room data
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = roomSnapshot.val();
    
    // Get movies and votes
    const movies = roomData.movies || {};
    const votes = roomData.votes || {};
    
    // Calculate results
    const results = Object.keys(movies).map(movieId => {
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
        score: movieVotes.yes || 0
      };
    });
    
    // Sort by yes votes (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Get top 3
    const topThree = results.slice(0, 3);
    
    if (topThree.length === 0) {
      return res.status(400).json({ message: 'No movies available for roulette' });
    }
    
    // Pick a random movie from top 3
    const randomIndex = Math.floor(Math.random() * topThree.length);
    const selectedMovie = topThree[randomIndex];
    
    // Update room with selected movie
    await db.ref(`rooms/${roomCode}/selectedMovie`).set({
      ...selectedMovie,
      selectedAt: new Date().toISOString(),
      selectionMethod: 'roulette'
    });
    
    res.json({
      message: 'Movie selected by roulette',
      selectedMovie
    });
  } catch (error) {
    console.error(`Error running roulette for room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error running roulette', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/select
 * @desc    Select a movie as the winner (when there's a clear majority)
 * @access  Public
 */
router.post('/:roomCode/select', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { movieId, userId } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: 'movieId is required' });
    }

    // Check if room exists
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');

    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const roomData = roomSnapshot.val();

    // Check if movie exists in room
    const movie = roomData.movies && roomData.movies[movieId];
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found in room' });
    }

    // Get vote data for the movie
    const movieVotes = (roomData.votes && roomData.votes[movieId]) || { yes: 0, no: 0 };

    // Set selected movie
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

    res.json({
      message: 'Movie selected successfully',
      selectedMovie,
    });
  } catch (error) {
    console.error(`Error selecting movie in room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error selecting movie', error: error.message });
  }
});

/**
 * @route   POST /api/rooms/:roomCode/close
 * @desc    Close a room (mark as inactive)
 * @access  Public
 */
router.post('/:roomCode/close', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;
    
    // Check if room exists
    const roomSnapshot = await db.ref(`rooms/${roomCode}`).once('value');
    
    if (!roomSnapshot.exists()) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const roomData = roomSnapshot.val();
    
    // Check if user is host (only host can close room)
    if (userId && roomData.users[userId] && !roomData.users[userId].isHost) {
      return res.status(403).json({ message: 'Only the host can close the room' });
    }
    
    // Mark room as inactive
    await db.ref(`rooms/${roomCode}/active`).set(false);
    await db.ref(`rooms/${roomCode}/closedAt`).set(new Date().toISOString());
    
    res.json({ message: 'Room closed successfully' });
  } catch (error) {
    console.error(`Error closing room ${req.params.roomCode}:`, error);
    res.status(500).json({ message: 'Error closing room', error: error.message });
  }
});

module.exports = router;
