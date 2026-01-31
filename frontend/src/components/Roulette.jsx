import { useState, useEffect } from 'react';
import { FaTrophy } from 'react-icons/fa';
import axios from 'axios';

const Roulette = ({ roomCode, selectedMovie }) => {
  const [topMovies, setTopMovies] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState(selectedMovie);
  const [loading, setLoading] = useState(!selectedMovie);
  const [error, setError] = useState('');

  // Fetch top movies if we don't have a selected movie yet
  useEffect(() => {
    if (selectedMovie) {
      setWinner(selectedMovie);
      return;
    }

    const fetchTopMovies = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomCode}/results`);
        if (response.data.topThree && response.data.topThree.length > 0) {
          setTopMovies(response.data.topThree);
        } else {
          setError('No movies available for roulette.');
        }
      } catch (error) {
        console.error('Error fetching top movies:', error);
        setError('Failed to load top movies for roulette.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopMovies();
  }, [roomCode, selectedMovie]);

  // Start the roulette animation
  const startRoulette = () => {
    if (spinning || topMovies.length === 0) return;
    
    setSpinning(true);
    setWinner(null);
    
    // Spin animation - cycle through movies rapidly then slow down
    let duration = 50; // start fast
    let spins = 0;
    const maxSpins = 20 + Math.floor(Math.random() * 10); // random number of spins
    
    const spin = () => {
      setCurrentIndex(prev => (prev + 1) % topMovies.length);
      spins++;
      
      // Slow down gradually
      if (spins < maxSpins / 2) {
        setTimeout(spin, duration);
      } else if (spins < maxSpins) {
        // Slow down in second half of spins
        duration += 25;
        setTimeout(spin, duration);
      } else {
        // Final choice
        const finalMovie = topMovies[currentIndex];
        setWinner(finalMovie);
        setSpinning(false);
      }
    };
    
    spin();
  };

  // If we have a selected movie already, show it
  if (winner) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="inline-block bg-primary-600 text-white p-3 rounded-full">
            <FaTrophy className="text-4xl text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mt-4 text-white">
            The movie has been chosen!
          </h2>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {winner.backdropPath ? (
              <img 
                src={winner.backdropPath} 
                alt={winner.title} 
                className="w-full h-48 object-cover"
              />
            ) : winner.posterPath ? (
              <img 
                src={winner.posterPath} 
                alt={winner.title}
                className="w-full h-48 object-cover" 
              />
            ) : (
              <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
            
            <div className="p-4">
              <h3 className="text-xl font-bold text-white mb-1">{winner.title}</h3>
              {winner.releaseDate && (
                <p className="text-gray-400">
                  {new Date(winner.releaseDate).getFullYear()}
                </p>
              )}
              
              <p className="mt-4 text-gray-300">
                {winner.overview?.substring(0, 150)}
                {winner.overview?.length > 150 ? '...' : ''}
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center text-white">
            <p>Enjoy watching!</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading roulette...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Movie Roulette</h2>
        <p className="text-gray-400 mt-2">
          Let fate decide which movie you'll watch tonight!
        </p>
      </div>

      {/* Roulette wheel (simplified as a movie card that changes) */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-gray-800 rounded-lg overflow-hidden border-4 border-primary-600">
          {topMovies.length > 0 && topMovies[currentIndex] && (
            <>
              {topMovies[currentIndex].backdropPath ? (
                <img 
                  src={topMovies[currentIndex].backdropPath} 
                  alt={topMovies[currentIndex].title}
                  className="w-full h-48 object-cover"
                />
              ) : topMovies[currentIndex].posterPath ? (
                <img 
                  src={topMovies[currentIndex].posterPath} 
                  alt={topMovies[currentIndex].title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-xl font-bold text-white text-center">
                  {topMovies[currentIndex].title}
                </h3>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={startRoulette}
          disabled={spinning || topMovies.length === 0}
          className={`btn-primary text-lg py-3 px-8 ${
            spinning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {spinning ? 'Spinning...' : 'Spin the Wheel'}
        </button>
        
        <p className="text-gray-400 mt-4 text-sm">
          Click to randomly select from the top-rated movies
        </p>
      </div>
    </div>
  );
};

export default Roulette;
