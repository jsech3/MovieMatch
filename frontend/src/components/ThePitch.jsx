import { useState } from 'react';
import { FaMicrophone, FaStar, FaFilm, FaUsers, FaQuoteLeft, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const TILES = [
  { id: 'genre', icon: FaFilm, label: 'Genre', color: 'from-blue-600 to-blue-800' },
  { id: 'cast', icon: FaUsers, label: 'Cast', color: 'from-purple-600 to-purple-800' },
  { id: 'rating', icon: FaStar, label: 'Rating', color: 'from-yellow-600 to-yellow-800' },
  { id: 'plot', icon: FaQuoteLeft, label: 'Plot', color: 'from-green-600 to-green-800' },
];

const ThePitch = ({ movies, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedTiles, setRevealedTiles] = useState([]);
  const [voted, setVoted] = useState(false);
  const [results, setResults] = useState([]);

  const movie = movies[currentIndex];
  if (!movie) return null;

  const handleReveal = (tileId) => {
    if (revealedTiles.includes(tileId)) return;
    setRevealedTiles((prev) => [...prev, tileId]);
  };

  const handleVote = (vote) => {
    if (voted) return;
    setVoted(true);

    const newResults = [...results, { movie, vote, tilesRevealed: revealedTiles.length }];

    setTimeout(() => {
      if (currentIndex + 1 >= movies.length) {
        onComplete(newResults);
      } else {
        setResults(newResults);
        setCurrentIndex((prev) => prev + 1);
        setRevealedTiles([]);
        setVoted(false);
      }
    }, 400);
  };

  const getTileContent = (tileId) => {
    switch (tileId) {
      case 'genre':
        return movie.genres?.length > 0
          ? movie.genres.slice(0, 3).map((g) => (typeof g === 'string' ? g : g.name)).join(', ')
          : 'Unknown';
      case 'cast':
        return movie.cast?.length > 0
          ? movie.cast.slice(0, 3).map((c) => (typeof c === 'string' ? c : c.name)).join(', ')
          : 'Unknown cast';
      case 'rating':
        return movie.voteAverage ? `${movie.voteAverage.toFixed(1)} / 10` : 'Unrated';
      case 'plot':
        return movie.overview || 'No description available';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaMicrophone className="text-purple-400" />
          <span className="text-purple-400 font-bold text-sm uppercase tracking-wider">The Pitch</span>
        </div>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {movies.length}
        </span>
      </div>

      <p className="text-center text-gray-500 text-xs">Tap tiles to reveal clues. Then decide.</p>

      {/* Movie Card — poster + title only */}
      <div className="rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
        <div className="relative h-44">
          <img
            src={movie.posterPath || movie.backdropPath}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl font-bold text-white">{movie.title}</h3>
            {movie.releaseDate && (
              <span className="text-gray-400 text-sm">
                {new Date(movie.releaseDate).getFullYear()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reveal Tiles — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const isRevealed = revealedTiles.includes(tile.id);

          return (
            <button
              key={tile.id}
              onClick={() => handleReveal(tile.id)}
              disabled={isRevealed}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                isRevealed ? 'bg-gray-800 border border-gray-700' : 'hover:scale-[1.03] active:scale-95'
              }`}
              style={{ minHeight: tile.id === 'plot' ? '80px' : '70px' }}
            >
              {!isRevealed ? (
                // Hidden tile
                <div className={`h-full w-full bg-gradient-to-br ${tile.color} flex flex-col items-center justify-center gap-1 p-3`}>
                  <Icon className="text-white/80 text-lg" />
                  <span className="text-white font-semibold text-sm">{tile.label}</span>
                  <span className="text-white/50 text-[10px]">Tap to reveal</span>
                </div>
              ) : (
                // Revealed content
                <div className="h-full w-full p-3 flex flex-col justify-center animate-fade-in">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{tile.label}</p>
                  <p className={`text-white ${tile.id === 'plot' ? 'text-xs line-clamp-3' : 'text-sm font-medium'}`}>
                    {getTileContent(tile.id)}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Vote — always visible */}
      {!voted ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote(false)}
            className="flex items-center justify-center gap-2 py-3.5 bg-gray-800 hover:bg-red-900/40 border-2 border-gray-700 hover:border-red-600 text-gray-300 hover:text-red-300 rounded-xl font-semibold transition-all active:scale-95"
          >
            <FaThumbsDown /> Skip
          </button>
          <button
            onClick={() => handleVote(true)}
            className="flex items-center justify-center gap-2 py-3.5 bg-gray-800 hover:bg-green-900/40 border-2 border-gray-700 hover:border-green-600 text-gray-300 hover:text-green-300 rounded-xl font-semibold transition-all active:scale-95"
          >
            <FaThumbsUp /> Keep
          </button>
        </div>
      ) : (
        <div className="text-center py-3 text-purple-400 font-medium animate-fade-in">
          Noted!
        </div>
      )}

      {/* Tiles revealed counter */}
      <div className="flex justify-center gap-1">
        {TILES.map((t) => (
          <div
            key={t.id}
            className={`w-2 h-2 rounded-full transition-all ${
              revealedTiles.includes(t.id) ? 'bg-purple-400' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ThePitch;
