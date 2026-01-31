const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to format TMDB movie data
const formatMovieData = (movie) => {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
    backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
    releaseDate: movie.release_date,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    runtime: movie.runtime,
    genres: movie.genres ? movie.genres.map(genre => genre.name) : [],
  };
};

/**
 * @route   GET /api/movies/discover
 * @desc    Get a list of movies with filtering options
 * @access  Public
 */
router.get('/discover', async (req, res) => {
  try {
    const { 
      platform, // streaming service (Netflix, Prime, etc.)
      genre, // genre id from TMDB
      minRuntime, // minimum runtime in minutes
      maxRuntime, // maximum runtime in minutes
      page = 1 
    } = req.query;

    // Base discover movies URL
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc&include_adult=false`;
    
    // Add genre filter if provided
    if (genre) {
      url += `&with_genres=${genre}`;
    }

    // Make request to TMDB API
    const response = await axios.get(url);
    const movies = response.data.results;

    // Get detailed info for each movie (to get runtime which isn't in the discover endpoint)
    const moviesWithDetails = await Promise.all(
      movies.map(async (movie) => {
        try {
          const detailsResponse = await axios.get(
            `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers`
          );
          
          // Combine basic movie data with details
          const movieWithDetails = {
            ...movie,
            runtime: detailsResponse.data.runtime,
            genres: detailsResponse.data.genres,
            watchProviders: detailsResponse.data["watch/providers"]?.results?.US?.flatrate || []
          };
          
          return movieWithDetails;
        } catch (error) {
          console.error(`Error fetching details for movie ${movie.id}:`, error.message);
          return movie; // Return the movie without details if there's an error
        }
      })
    );

    // Filter by runtime if provided
    let filteredMovies = moviesWithDetails;
    
    if (minRuntime) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.runtime && movie.runtime >= parseInt(minRuntime)
      );
    }
    
    if (maxRuntime) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.runtime && movie.runtime <= parseInt(maxRuntime)
      );
    }

    // Filter by platform if provided
    if (platform) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.watchProviders && 
        movie.watchProviders.some(provider => 
          provider.provider_name.toLowerCase().includes(platform.toLowerCase())
        )
      );
    }

    // Format the response
    const formattedMovies = filteredMovies.map(formatMovieData);

    res.json({
      page: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: formattedMovies.length,
      results: formattedMovies,
    });
  } catch (error) {
    console.error('Error discovering movies:', error);
    res.status(500).json({ message: 'Error fetching movies', error: error.message });
  }
});

/**
 * @route   GET /api/movies/:id
 * @desc    Get detailed information about a specific movie
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get movie details
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=watch/providers,credits`
    );
    
    // Format the movie data
    const movie = formatMovieData(response.data);
    
    // Add additional data
    movie.cast = response.data.credits?.cast?.slice(0, 10) || [];
    movie.director = response.data.credits?.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
    
    // Get watch providers (streaming platforms)
    const providers = response.data["watch/providers"]?.results?.US || {};
    movie.watchProviders = {
      rent: providers.rent || [],
      buy: providers.buy || [],
      flatrate: providers.flatrate || [] // subscription streaming services
    };
    
    res.json(movie);
  } catch (error) {
    console.error(`Error fetching movie ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching movie details', error: error.message });
  }
});

/**
 * @route   GET /api/movies/genres
 * @desc    Get list of movie genres
 * @access  Public
 */
router.get('/genres/list', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ message: 'Error fetching genres', error: error.message });
  }
});

module.exports = router;
