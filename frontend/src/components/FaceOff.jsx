import { useState } from 'react';
import { FaTrophy, FaStar } from 'react-icons/fa';

const FaceOff = ({ movies, onComplete }) => {
  const [winner, setWinner] = useState(null);
  const [picked, setPicked] = useState(null); // index of picked movie

  // Just take top 2
  const movieA = movies[0];
  const movieB = movies[1];

  if (!movieA || !movieB) {
    // Only 1 movie — auto-win
    if (movieA) {
      setTimeout(() => onComplete(movieA), 500);
    }
    return null;
  }

  const handlePick = (index) => {
    if (picked !== null) return;
    setPicked(index);
    const chosen = index === 0 ? movieA : movieB;
    setWinner(chosen);

    setTimeout(() => onComplete(chosen), 1200);
  };

  // Winner reveal
  if (winner) {
    return (
      <div className="text-center space-y-5 animate-fade-in py-6">
        <FaTrophy className="text-5xl text-yellow-400 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-white">Tonight's Movie!</h2>
        <div className="max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-800 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10">
          <img
            src={winner.backdropPath || winner.posterPath}
            alt={winner.title}
            className="w-full h-44 object-cover"
          />
          <div className="p-4">
            <h3 className="text-xl font-bold text-white">{winner.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
              {winner.releaseDate && <span>{new Date(winner.releaseDate).getFullYear()}</span>}
              {winner.voteAverage && (
                <span className="flex items-center gap-1">
                  <FaStar className="text-yellow-400 text-xs" />
                  {winner.voteAverage.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <span className="text-orange-400 font-bold text-sm uppercase tracking-wider">
          <FaTrophy className="inline mr-1" /> Final Face-Off
        </span>
        <h2 className="text-xl font-bold text-white mt-1">Which one are we watching?</h2>
      </div>

      {/* Two cards side by side */}
      <div className="grid grid-cols-2 gap-3">
        {[movieA, movieB].map((movie, i) => (
          <button
            key={movie.id}
            onClick={() => handlePick(i)}
            className={`group rounded-2xl overflow-hidden bg-gray-800 border-2 transition-all text-left active:scale-95 ${
              picked === i
                ? 'border-yellow-500 scale-[1.02] shadow-lg shadow-yellow-500/20'
                : picked !== null
                ? 'border-gray-800 opacity-40 scale-95'
                : 'border-gray-700 hover:border-primary-500 hover:scale-[1.02]'
            }`}
          >
            <div className="relative h-48">
              <img
                src={movie.posterPath || movie.backdropPath}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
            </div>
            <div className="p-3">
              <h3 className="text-white font-semibold text-sm leading-tight">{movie.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-gray-400 text-xs">
                {movie.releaseDate && (
                  <span>{new Date(movie.releaseDate).getFullYear()}</span>
                )}
                {movie.voteAverage && (
                  <span className="flex items-center gap-0.5">
                    <FaStar className="text-yellow-400" style={{ fontSize: '0.5rem' }} />
                    {movie.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* VS badge */}
      <div className="flex justify-center -mt-2">
        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
          VS
        </div>
      </div>
    </div>
  );
};

export default FaceOff;
