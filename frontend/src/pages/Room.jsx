import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDatabase, ref, onValue, off } from 'firebase/database';

// Components
import MovieCard from '../components/MovieCard';
import UserList from '../components/UserList';
import VoteResults from '../components/VoteResults';
import Roulette from '../components/Roulette';

const Room = ({ user, setUser }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  // State
  const [room, setRoom] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [votingComplete, setVotingComplete] = useState(false);
  const [isRoulette, setIsRoulette] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // If no user, redirect to join room page
  useEffect(() => {
    if (!user) {
      navigate(`/join-room?room=${roomCode}`);
    }
  }, [user, roomCode, navigate]);

  // Get room data and set up realtime listener
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const db = getDatabase();
    const roomRef = ref(db, `rooms/${roomCode}`);

    // Set up realtime listener for room data
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        setRoom(roomData);
        
        // Convert movies object to array
        if (roomData.movies) {
          const moviesArray = Object.values(roomData.movies);
          setMovies(moviesArray);
        }
        
        // Check if voting is complete
        if (roomData.selectedMovie) {
          setSelectedMovie(roomData.selectedMovie);
          setVotingComplete(true);
        }
      } else {
        setError('Room not found');
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => {
      off(roomRef);
    };
  }, [roomCode, user]);

  // Handle voting
  const handleVote = async (vote) => {
    try {
      await axios.post(`/api/rooms/${roomCode}/vote`, {
        userId: user.id,
        movieId: movies[currentMovieIndex].id,
        vote: vote
      });

      // Move to next movie if not the last one
      if (currentMovieIndex < movies.length - 1) {
        setCurrentMovieIndex(currentMovieIndex + 1);
      } else {
        // All movies voted on, check results
        const resultsResponse = await axios.get(`/api/rooms/${roomCode}/results`);
        
        // If there's a clear winner (top movie has more than 50% yes votes)
        const topMovie = resultsResponse.data.results[0];
        if (topMovie && (topMovie.yesVotes / topMovie.totalVotes) > 0.5) {
          await axios.post(`/api/rooms/${roomCode}/select`, {
            movieId: topMovie.id,
            userId: user.id
          });
          setSelectedMovie(topMovie);
          setVotingComplete(true);
        } else {
          // No clear winner, suggest roulette
          setVotingComplete(true);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to record your vote. Please try again.');
    }
  };

  // Start roulette
  const handleStartRoulette = async () => {
    setIsRoulette(true);
    try {
      const response = await axios.post(`/api/rooms/${roomCode}/roulette`);
      setSelectedMovie(response.data.selectedMovie);
    } catch (error) {
      console.error('Error with roulette:', error);
      setError('Failed to select a random movie. Please try again.');
    }
  };

  // Fetch more movies
  const handleFetchMoreMovies = async () => {
    if (!room || !user.isHost) return;
    
    try {
      setLoading(true);
      
      // Get movies from TMDB based on room filters
      const filters = room.filters || {};
      
      const response = await axios.get('/api/movies/discover', {
        params: {
          platform: filters.platform,
          genre: filters.genre,
          minRuntime: filters.minRuntime,
          maxRuntime: filters.maxRuntime,
          page: Math.floor(Math.random() * 5) + 1 // Get a random page of results
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        // Add movies to the room
        await axios.post(`/api/rooms/${roomCode}/movies`, {
          movies: response.data.results.slice(0, 10), // Limit to 10 movies
          userId: user.id
        });
      } else {
        setError('No movies found matching your filters.');
      }
      
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to fetch more movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close room (only host)
  const handleCloseRoom = async () => {
    if (!user.isHost) return;
    
    try {
      await axios.post(`/api/rooms/${roomCode}/close`, {
        userId: user.id
      });
      navigate('/');
    } catch (error) {
      console.error('Error closing room:', error);
      setError('Failed to close the room. Please try again.');
    }
  };

  // Render loading state
  if (loading && !room) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-xl text-white">Loading room...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-600 text-white p-6 rounded-lg max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Render room not found
  if (!room) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-gray-800 text-white p-6 rounded-lg max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
          <p>The room you're looking for doesn't exist or has been closed.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Room Header */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {roomCode}</h1>
            <p className="text-gray-400">Created by {room.creator}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-3">
              {user.isHost && !votingComplete && movies.length === 0 && (
                <button 
                  onClick={handleFetchMoreMovies}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Find Movies'}
                </button>
              )}
              
              {user.isHost && (
                <button 
                  onClick={handleCloseRoom}
                  className="btn-outline"
                >
                  Close Room
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Users */}
        <div className="lg:col-span-1">
          <UserList users={room.users} />
        </div>
        
        {/* Right Column - Movies or Results */}
        <div className="lg:col-span-2">
          {/* No movies state */}
          {movies.length === 0 && !votingComplete && (
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">Waiting for Movies</h2>
              <p className="text-gray-400 mb-6">
                {user.isHost 
                  ? 'Click "Find Movies" to add movies for voting.' 
                  : 'Waiting for the host to add movies for voting.'}
              </p>
              
              {user.isHost && (
                <button 
                  onClick={handleFetchMoreMovies}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Find Movies'}
                </button>
              )}
            </div>
          )}
          
          {/* Voting state */}
          {movies.length > 0 && !votingComplete && currentMovieIndex < movies.length && (
            <div>
              <div className="mb-4 bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-300">
                    Movie {currentMovieIndex + 1} of {movies.length}
                  </p>
                  <div className="bg-gray-700 h-2 w-1/2 rounded-full">
                    <div 
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${((currentMovieIndex + 1) / movies.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <MovieCard 
                movie={movies[currentMovieIndex]} 
                onVote={handleVote}
              />
            </div>
          )}
          
          {/* Results state */}
          {votingComplete && !isRoulette && !selectedMovie && (
            <VoteResults 
              roomCode={roomCode}
              onStartRoulette={handleStartRoulette}
            />
          )}
          
          {/* Roulette state */}
          {isRoulette && (
            <Roulette 
              roomCode={roomCode}
              selectedMovie={selectedMovie}
            />
          )}
          
          {/* Selected movie state */}
          {selectedMovie && !isRoulette && (
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">Movie Selected!</h2>
              <div className="max-w-md mx-auto">
                <MovieCard 
                  movie={selectedMovie}
                  showVoteButtons={false}
                />
                <p className="mt-6 text-gray-300">
                  Enjoy watching {selectedMovie.title}!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;
