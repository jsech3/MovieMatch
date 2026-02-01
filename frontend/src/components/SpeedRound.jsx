import { useState, useEffect, useRef } from 'react';
import { FaBolt, FaCheck } from 'react-icons/fa';

const VOTE_TIME = 4000; // 4 seconds per movie

const SpeedRound = ({ movies, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(VOTE_TIME);
  const [results, setResults] = useState([]);
  const [swipeDir, setSwipeDir] = useState(null); // 'left' | 'right' | null
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const cardRef = useRef(null);
  const votedRef = useRef(false);

  const currentMovie = movies[currentIndex];
  const totalMovies = movies.length;
  const isComplete = currentIndex >= totalMovies;

  // Timer
  useEffect(() => {
    if (isComplete) return;
    votedRef.current = false;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          if (!votedRef.current) {
            doVote(null);
          }
          return VOTE_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isComplete]);

  const doVote = (vote) => {
    if (votedRef.current) return;
    votedRef.current = true;

    const dir = vote === true ? 'right' : 'left';
    setSwipeDir(dir);

    const newResults = [...results, { movie: currentMovie, vote }];

    setTimeout(() => {
      setResults(newResults);
      setSwipeDir(null);
      setTouchDelta(0);
      setTimeRemaining(VOTE_TIME);

      if (currentIndex + 1 >= totalMovies) {
        // Done — show summary briefly then complete
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => onComplete(newResults), 1500);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 250);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 60) {
      doVote(touchDelta > 0);
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Tap left/right halves
  const handleCardClick = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRightHalf = x > rect.width / 2;
    doVote(isRightHalf);
  };

  // Summary screen
  if (isComplete) {
    const yesCount = results.filter((r) => r.vote === true).length;
    return (
      <div className="text-center space-y-4 animate-fade-in py-8">
        <FaBolt className="text-4xl text-yellow-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Speed Round Done!</h2>
        <p className="text-gray-400">
          {yesCount} of {totalMovies} made the cut
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-12 h-16 rounded-lg overflow-hidden border-2 ${
                r.vote === true ? 'border-green-500' : r.vote === false ? 'border-red-500/50' : 'border-gray-700'
              }`}
            >
              {r.movie.posterPath && (
                <img src={r.movie.posterPath} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentMovie) return null;

  const timerFraction = timeRemaining / VOTE_TIME;
  const timerColor = timerFraction < 0.3 ? 'bg-red-500' : timerFraction < 0.6 ? 'bg-yellow-500' : 'bg-green-500';

  // Card transform from touch swipe
  const cardStyle = touchDelta !== 0
    ? {
        transform: `translateX(${touchDelta}px) rotate(${touchDelta * 0.05}deg)`,
        transition: 'none',
      }
    : swipeDir
    ? {
        transform: `translateX(${swipeDir === 'right' ? 300 : -300}px) rotate(${swipeDir === 'right' ? 15 : -15}deg)`,
        opacity: 0,
        transition: 'all 0.25s ease-out',
      }
    : { transition: 'all 0.2s ease-out' };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaBolt className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Speed Round</span>
        </div>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {totalMovies}
        </span>
      </div>

      <p className="text-center text-gray-500 text-xs">Swipe or tap left to skip, right to keep</p>

      {/* Timer */}
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${timerColor} rounded-full transition-all duration-100 ease-linear`}
          style={{ width: `${timerFraction * 100}%` }}
        />
      </div>

      {/* Swipeable Card */}
      <div className="relative" style={{ minHeight: '360px' }}>
        <div
          ref={cardRef}
          className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-800 cursor-pointer select-none"
          style={cardStyle}
          onClick={handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Movie image */}
          <div className="relative h-full">
            <img
              src={currentMovie.backdropPath || currentMovie.posterPath}
              alt={currentMovie.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = currentMovie.posterPath || ''; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />

            {/* Swipe indicators */}
            <div className={`absolute top-6 left-6 px-4 py-2 rounded-xl border-2 border-red-500 text-red-500 font-black text-lg -rotate-12 transition-opacity ${touchDelta < -30 || swipeDir === 'left' ? 'opacity-100' : 'opacity-0'}`}>
              NOPE
            </div>
            <div className={`absolute top-6 right-6 px-4 py-2 rounded-xl border-2 border-green-500 text-green-500 font-black text-lg rotate-12 transition-opacity ${touchDelta > 30 || swipeDir === 'right' ? 'opacity-100' : 'opacity-0'}`}>
              WATCH
            </div>

            {/* Movie info */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-2xl font-bold text-white">{currentMovie.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-gray-300 text-sm">
                {currentMovie.releaseDate && (
                  <span>{new Date(currentMovie.releaseDate).getFullYear()}</span>
                )}
                {currentMovie.genres && currentMovie.genres.length > 0 && (
                  <span>{currentMovie.genres.slice(0, 2).join(' · ')}</span>
                )}
                {currentMovie.voteAverage && (
                  <span className="text-yellow-400">{currentMovie.voteAverage.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {movies.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i < currentIndex
                ? results[i]?.vote === true
                  ? 'bg-green-500'
                  : results[i]?.vote === false
                  ? 'bg-red-500'
                  : 'bg-gray-600'
                : i === currentIndex
                ? 'bg-yellow-400 scale-125'
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SpeedRound;
