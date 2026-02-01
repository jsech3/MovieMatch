import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi, movieApi } from '../utils/api';
import { FaGamepad, FaCopy, FaCheck, FaUsers, FaBolt, FaMicrophone, FaTrophy } from 'react-icons/fa';

// Game round components
import SpeedRound from '../components/SpeedRound';
import ThePitch from '../components/ThePitch';
import FaceOff from '../components/FaceOff';
import GameResults from '../components/GameResults';

// Game phases in order
const PHASES = ['lobby', 'loading', 'speed-round', 'the-pitch', 'face-off', 'results'];

const Room = ({ user, setUser }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  // Core state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('lobby');
  const [codeCopied, setCodeCopied] = useState(false);

  // Movie pools for each round
  const [allMovies, setAllMovies] = useState([]);
  const [speedRoundMovies, setSpeedRoundMovies] = useState([]);
  const [pitchMovies, setPitchMovies] = useState([]);
  const [faceOffMovies, setFaceOffMovies] = useState([]);

  // Round results
  const [speedResults, setSpeedResults] = useState([]);
  const [pitchResults, setPitchResults] = useState([]);
  const [winner, setWinner] = useState(null);

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate(`/join-room?room=${roomCode}`);
    }
  }, [user, roomCode, navigate]);

  // Fetch room data on mount + poll for updates
  useEffect(() => {
    if (!user) return;

    const fetchRoom = async () => {
      try {
        const response = await roomApi.getRoom(roomCode);
        setRoom(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching room:', err);
        setError('Room not found or connection failed.');
        setLoading(false);
      }
    };

    fetchRoom();

    // Poll every 2s for multiplayer sync (in-memory backend has no realtime)
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode, user]);

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Start the game — fetch movies and begin Speed Round
  const handleStartGame = async () => {
    setPhase('loading');
    setError('');

    try {
      // Determine vibe-based fetch params
      const vibe = room?.settings?.vibe || 'popular';
      const params = vibeToParams(vibe);

      // Fetch movies from TMDB
      const response = await movieApi.discoverMovies(params);
      let movies = response.data.results || [];

      if (movies.length === 0) {
        setError('No movies found. Try a different vibe.');
        setPhase('lobby');
        return;
      }

      // Shuffle for variety
      movies = shuffleArray(movies);

      // Take up to 6 for the game — keeps it fast
      const gameMovies = movies.slice(0, 6);
      setAllMovies(gameMovies);

      // Add movies to room on backend
      try {
        await roomApi.addMovies(roomCode, gameMovies, user.id);
        await roomApi.startGame(roomCode, user.id);
      } catch {
        // Non-critical — game can proceed client-side
      }

      // Speed Round gets all movies
      setSpeedRoundMovies(gameMovies);
      setPhase('speed-round');
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to fetch movies. Check your TMDB API key.');
      setPhase('lobby');
    }
  };

  // Speed Round complete → advance to The Pitch with top 3
  const handleSpeedRoundComplete = useCallback((results) => {
    setSpeedResults(results);

    const yesMovies = results.filter((r) => r.vote === true).map((r) => r.movie);
    const skippedMovies = results.filter((r) => r.vote === null).map((r) => r.movie);
    const noMovies = results.filter((r) => r.vote === false).map((r) => r.movie);

    // Take up to 3: prefer yes, then skipped, then no
    let pitchPool = [...yesMovies, ...skippedMovies, ...noMovies].slice(0, 3);
    setPitchMovies(pitchPool);

    if (pitchPool.length > 1) {
      setPhase('the-pitch');
    } else if (pitchPool.length === 1) {
      setWinner(pitchPool[0]);
      setPhase('results');
    } else {
      setPhase('results');
    }
  }, []);

  // The Pitch complete → advance to Face-Off with top 2
  const handlePitchComplete = useCallback((results) => {
    setPitchResults(results);

    const keptMovies = results.filter((r) => r.vote === true).map((r) => r.movie);
    const skippedMovies = results.filter((r) => r.vote !== true).map((r) => r.movie);

    // Top 2 for a single Face-Off matchup
    let contenders = [...keptMovies, ...skippedMovies].slice(0, 2);
    setFaceOffMovies(contenders);

    if (contenders.length === 2) {
      setPhase('face-off');
    } else if (contenders.length === 1) {
      setWinner(contenders[0]);
      setPhase('results');
    } else {
      setPhase('results');
    }
  }, []);

  // Face-Off complete → show results
  const handleFaceOffComplete = useCallback((finalWinner) => {
    setWinner(finalWinner);
    setPhase('results');

    // Record winner on backend
    try {
      roomApi.selectMovie(roomCode, finalWinner.id, user?.id);
    } catch {
      // Non-critical
    }
  }, [roomCode, user]);

  // Play again — reset everything
  const handlePlayAgain = () => {
    setPhase('lobby');
    setAllMovies([]);
    setSpeedRoundMovies([]);
    setPitchMovies([]);
    setFaceOffMovies([]);
    setSpeedResults([]);
    setPitchResults([]);
    setWinner(null);
  };

  // Done — go home
  const handleDone = () => {
    navigate('/');
  };

  // --- Render ---

  if (loading && !room) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto" />
        <p className="mt-4 text-xl text-gray-400">Joining room...</p>
      </div>
    );
  }

  if (error && phase === 'lobby' && !room) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto bg-red-900/30 border border-red-700 text-red-300 p-6 rounded-2xl text-center">
          <h2 className="text-xl font-bold mb-2">Oops</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-xl">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const users = room?.users || {};
  const userCount = Object.keys(users).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      {/* Phase: Lobby */}
      {phase === 'lobby' && (
        <div className="space-y-6 animate-fade-in">
          {/* Room Header */}
          <div className="text-center">
            <FaGamepad className="text-4xl text-primary-400 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-white">Game Night</h1>
            <p className="text-gray-400 mt-1">Invite your friends. Pick a movie.</p>
          </div>

          {/* Room Code */}
          <div className="text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Room Code</p>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-primary-500 transition group"
            >
              <span className="text-3xl font-mono font-bold text-white tracking-widest">{roomCode}</span>
              {codeCopied ? (
                <FaCheck className="text-green-400" />
              ) : (
                <FaCopy className="text-gray-500 group-hover:text-primary-400 transition" />
              )}
            </button>
            {codeCopied && <p className="text-green-400 text-xs mt-1">Copied!</p>}
          </div>

          {/* Player List */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaUsers className="text-primary-400" />
              <span className="text-white font-semibold">Players ({userCount})</span>
            </div>
            <div className="space-y-2">
              {Object.entries(users).map(([id, u]) => (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-gray-300">{u.name}</span>
                  {u.isHost && (
                    <span className="text-xs px-2 py-0.5 bg-primary-900/50 text-primary-400 rounded-full">Host</span>
                  )}
                  {id === user?.id && (
                    <span className="text-xs text-gray-500">(you)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vibe display */}
          {room?.settings?.vibe && (
            <div className="text-center">
              <span className="text-gray-500 text-xs uppercase tracking-wider">Tonight's Vibe</span>
              <p className="text-white font-semibold capitalize">{vibeLabel(room.settings.vibe)}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Start Button (host only) */}
          {user?.isHost ? (
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-primary-900/50"
            >
              Start Game
            </button>
          ) : (
            <div className="text-center py-4 text-gray-400">
              Waiting for the host to start the game...
            </div>
          )}
        </div>
      )}

      {/* Phase: Loading movies */}
      {phase === 'loading' && (
        <div className="text-center py-20 animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-xl text-white font-semibold">Finding movies...</p>
          <p className="text-gray-500 mt-1">Setting up your game night</p>
        </div>
      )}

      {/* Phase: Speed Round */}
      {phase === 'speed-round' && (
        <div>
          <SpeedRound
            movies={speedRoundMovies}
            onComplete={handleSpeedRoundComplete}
          />
        </div>
      )}

      {/* Phase: The Pitch */}
      {phase === 'the-pitch' && (
        <div>
          <ThePitch
            movies={pitchMovies}
            onComplete={handlePitchComplete}
          />
        </div>
      )}

      {/* Phase: Face-Off */}
      {phase === 'face-off' && (
        <div>
          <FaceOff
            movies={faceOffMovies}
            onComplete={handleFaceOffComplete}
          />
        </div>
      )}

      {/* Phase: Results */}
      {phase === 'results' && (
        <div>
          <GameResults
            winner={winner}
            speedResults={speedResults}
            pitchResults={pitchResults}
            users={users}
            userId={user?.id}
            onPlayAgain={handlePlayAgain}
            onClose={handleDone}
          />
        </div>
      )}

      {/* Round progress indicator (visible during game rounds) */}
      {['speed-round', 'the-pitch', 'face-off'].includes(phase) && (
        <div className="mt-6 flex justify-center gap-2">
          {[
            { id: 'speed-round', icon: FaBolt, label: 'Speed' },
            { id: 'the-pitch', icon: FaMicrophone, label: 'Pitch' },
            { id: 'face-off', icon: FaTrophy, label: 'Face-Off' },
          ].map((step) => {
            const isActive = step.id === phase;
            const isDone = PHASES.indexOf(phase) > PHASES.indexOf(step.id);
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-primary-900/50 text-primary-400 border border-primary-700'
                    : isDone
                    ? 'bg-green-900/30 text-green-500 border border-green-800'
                    : 'bg-gray-800/50 text-gray-600 border border-gray-700'
                }`}
              >
                <Icon className="text-[0.6rem]" />
                {step.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Helpers ---

function vibeToParams(vibe) {
  switch (vibe) {
    case 'hidden-gems':
      return { page: Math.floor(Math.random() * 10) + 3, sort_by: 'vote_average.desc' };
    case 'new-releases':
      return { page: 1 };
    case 'wildcard':
      return { page: Math.floor(Math.random() * 20) + 1 };
    case 'popular':
    default:
      return { page: Math.floor(Math.random() * 3) + 1 };
  }
}

function vibeLabel(vibe) {
  const labels = {
    popular: 'Movie Buffs',
    'hidden-gems': 'Hidden Gems',
    'new-releases': 'Fresh Picks',
    wildcard: 'Wildcard',
  };
  return labels[vibe] || vibe;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default Room;
