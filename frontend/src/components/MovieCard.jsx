import { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaInfoCircle } from 'react-icons/fa';

const MovieCard = ({ movie, onVote, showVoteButtons = true }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!movie) return null;

  // Format runtime into hours and minutes
  const formatRuntime = (minutes) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
  };

  // Format release date to year only
  const formatReleaseYear = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).getFullYear();
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl transition-all hover:shadow-2xl">
      <div className="relative">
        {/* Poster Image */}
        <div className="relative h-96 overflow-hidden">
          {movie.backdropPath ? (
            <img 
              src={movie.backdropPath} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : movie.posterPath ? (
            <img 
              src={movie.posterPath}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500 text-lg">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent"></div>
        </div>

        {/* Movie Title and Year */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
          <div className="flex items-center text-gray-400 mt-1">
            <span>{formatReleaseYear(movie.releaseDate)}</span>
            {movie.runtime && (
              <>
                <span className="mx-2">•</span>
                <span>{formatRuntime(movie.runtime)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-primary-500 hover:text-primary-400 mb-4"
        >
          <FaInfoCircle className="mr-2" />
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Movie Details (toggled) */}
        {showDetails && (
          <div className="mb-4 fade-in">
            <p className="text-gray-300 mb-4">{movie.overview}</p>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="mb-3">
                <h3 className="text-gray-400 text-sm mb-1">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span 
                      key={genre} 
                      className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.voteAverage && (
              <div className="mb-3">
                <h3 className="text-gray-400 text-sm mb-1">Rating</h3>
                <div className="flex items-center">
                  <div className="bg-yellow-600 text-white px-2 py-1 rounded font-medium mr-2">
                    {movie.voteAverage.toFixed(1)}
                  </div>
                  <span className="text-gray-400 text-sm">
                    from {movie.voteCount} votes
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vote Buttons */}
        {showVoteButtons && onVote && (
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => onVote(false)}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <FaThumbsDown className="mr-2" /> Not Interested
            </button>
            <button
              onClick={() => onVote(true)}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <FaThumbsUp className="mr-2" /> Interested
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
