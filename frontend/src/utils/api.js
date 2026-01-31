import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Movie related API calls
export const movieApi = {
  // Discover movies with filters
  discoverMovies: (filters = {}) => {
    return api.get('/movies/discover', { params: filters });
  },
  
  // Get movie details
  getMovie: (movieId) => {
    return api.get(`/movies/${movieId}`);
  },
  
  // Get movie genres list
  getGenres: () => {
    return api.get('/movies/genres/list');
  }
};

// Room related API calls
export const roomApi = {
  // Create a new room
  createRoom: (creatorName, filters = {}) => {
    return api.post(`/rooms?creatorName=${encodeURIComponent(creatorName)}`, { filters });
  },
  
  // Join an existing room
  joinRoom: (roomCode, userName) => {
    return api.post(`/rooms/${roomCode}/join`, { userName });
  },
  
  // Get room details
  getRoom: (roomCode) => {
    return api.get(`/rooms/${roomCode}`);
  },
  
  // Add movies to a room
  addMovies: (roomCode, movies, userId) => {
    return api.post(`/rooms/${roomCode}/movies`, { movies, userId });
  },
  
  // Vote on a movie
  voteOnMovie: (roomCode, userId, movieId, vote) => {
    return api.post(`/rooms/${roomCode}/vote`, { userId, movieId, vote });
  },
  
  // Get voting results
  getResults: (roomCode) => {
    return api.get(`/rooms/${roomCode}/results`);
  },
  
  // Start roulette to pick a random movie
  startRoulette: (roomCode) => {
    return api.post(`/rooms/${roomCode}/roulette`);
  },
  
  // Close a room
  closeRoom: (roomCode, userId) => {
    return api.post(`/rooms/${roomCode}/close`, { userId });
  }
};

export default {
  movie: movieApi,
  room: roomApi
};
