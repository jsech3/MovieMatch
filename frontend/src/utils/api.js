import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Movie API
export const movieApi = {
  discoverMovies: (filters = {}) => api.get('/movies/discover', { params: filters }),
  getMovie: (movieId) => api.get(`/movies/${movieId}`),
  getGenres: () => api.get('/movies/genres/list'),
};

// Room API
export const roomApi = {
  createRoom: (creatorName, filters = {}, settings = {}) =>
    api.post('/rooms', { creatorName, filters, settings }),

  joinRoom: (roomCode, userName) =>
    api.post(`/rooms/${roomCode}/join`, { userName }),

  getRoom: (roomCode) => api.get(`/rooms/${roomCode}`),

  addMovies: (roomCode, movies, userId) =>
    api.post(`/rooms/${roomCode}/movies`, { movies, userId }),

  startGame: (roomCode, userId) =>
    api.post(`/rooms/${roomCode}/start-game`, { userId }),

  voteOnMovie: (roomCode, userId, movieId, vote) =>
    api.post(`/rooms/${roomCode}/vote`, { userId, movieId, vote }),

  advance: (roomCode) =>
    api.post(`/rooms/${roomCode}/advance`),

  timeout: (roomCode) =>
    api.post(`/rooms/${roomCode}/timeout`),

  getResults: (roomCode) => api.get(`/rooms/${roomCode}/results`),

  startRoulette: (roomCode) => api.post(`/rooms/${roomCode}/roulette`),

  selectMovie: (roomCode, movieId, userId) =>
    api.post(`/rooms/${roomCode}/select`, { movieId, userId }),

  closeRoom: (roomCode, userId) =>
    api.post(`/rooms/${roomCode}/close`, { userId }),
};

export default { movie: movieApi, room: roomApi };
