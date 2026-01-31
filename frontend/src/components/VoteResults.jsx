import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaRandom } from 'react-icons/fa';

const VoteResults = ({ roomCode, onStartRoulette }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomCode}/results`);
        setResults(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load voting results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [roomCode]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 btn-primary"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!results || !results.results || results.results.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 text-white">No Results Yet</h2>
        <p className="text-gray-400">No movies have been voted on yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Voting Results</h2>
        
        {results.topThree && results.topThree.length > 0 && (
          <button
            onClick={onStartRoulette}
            className="btn-primary flex items-center"
          >
            <FaRandom className="mr-2" /> 
            Roulette Mode
          </button>
        )}
      </div>

      <div className="space-y-4">
        {results.results.map((movie, index) => (
          <div 
            key={movie.id}
            className={`bg-gray-800 rounded-lg p-4 flex items-center ${
              index === 0 ? 'border-2 border-yellow-500' : ''
            }`}
          >
            <div className="flex-shrink-0 mr-4 w-12 h-12 flex items-center justify-center bg-gray-700 rounded-lg font-bold text-xl text-white">
              {index + 1}
            </div>
            
            <div className="flex-grow">
              <h3 className="text-white font-medium">{movie.title}</h3>
              <p className="text-gray-400 text-sm">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''}</p>
            </div>
            
            <div className="flex-shrink-0 flex items-center space-x-4">
              <div className="flex items-center" title="Yes Votes">
                <FaCheckCircle className="text-green-500 mr-1" />
                <span className="text-white">{movie.yesVotes}</span>
              </div>
              
              <div className="flex items-center" title="No Votes">
                <FaTimesCircle className="text-red-500 mr-1" />
                <span className="text-white">{movie.noVotes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {results.topThree && results.topThree.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-300 mb-4">
            Can't decide? Try the roulette mode to randomly pick from the top 3 movies!
          </p>
          <button
            onClick={onStartRoulette}
            className="btn-secondary flex items-center mx-auto"
          >
            <FaRandom className="mr-2" /> 
            Start Roulette
          </button>
        </div>
      )}
    </div>
  );
};

export default VoteResults;
