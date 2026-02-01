import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../utils/api';
import { FaFilm, FaGem, FaStar, FaDice, FaBolt, FaGamepad } from 'react-icons/fa';

const VIBES = [
  { id: 'popular', label: 'Movie Buffs', icon: FaStar, desc: 'Popular, well-known films', color: 'from-yellow-600 to-orange-600' },
  { id: 'hidden-gems', label: 'Hidden Gems', icon: FaGem, desc: 'Obscure but highly rated', color: 'from-purple-600 to-pink-600' },
  { id: 'new-releases', label: 'Fresh Picks', icon: FaBolt, desc: 'Recent releases', color: 'from-blue-600 to-cyan-600' },
  { id: 'wildcard', label: 'Wildcard', icon: FaDice, desc: 'Totally random mix', color: 'from-green-600 to-emerald-600' },
];

const GAME_MODES = [
  { id: 'quick', label: 'Quick Game', rounds: 3, desc: '~10 min — Speed Round, The Pitch, Face-Off' },
  { id: 'full', label: 'Full Game', rounds: 5, desc: '~20 min — All rounds + Deep Cut & Wildcard' },
];

const CreateRoom = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [vibe, setVibe] = useState('popular');
  const [gameMode, setGameMode] = useState('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const settings = {
        vibe,
        gameMode,
        rounds: GAME_MODES.find((m) => m.id === gameMode).rounds,
      };

      const response = await roomApi.createRoom(name, {}, settings);

      const newUser = {
        name,
        id: Object.keys(response.data.room.users)[0],
        isHost: true,
      };
      setUser(newUser);
      navigate(`/room/${response.data.roomCode}`);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <FaGamepad className="text-5xl text-primary-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">New Game Night</h1>
          <p className="text-gray-400">Set the vibe. Invite your crew. Find your movie.</p>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-300 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateRoom} className="space-y-8">
          {/* Name Input */}
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full text-lg"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Vibe Selector */}
          <div>
            <label className="block text-gray-300 mb-3 font-medium">Tonight's Vibe</label>
            <div className="grid grid-cols-2 gap-3">
              {VIBES.map((v) => {
                const Icon = v.icon;
                const selected = vibe === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVibe(v.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-primary-500 bg-primary-900/30 scale-[1.02]'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${v.color} mb-2`}>
                      <Icon className="text-white text-lg" />
                    </div>
                    <div className="font-semibold text-white">{v.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.desc}</div>
                    {selected && (
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-gray-300 mb-3 font-medium">Game Length</label>
            <div className="grid grid-cols-2 gap-3">
              {GAME_MODES.map((m) => {
                const selected = gameMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGameMode(m.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-primary-500 bg-primary-900/30'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-white">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/50"
          >
            {isLoading ? 'Creating...' : 'Start Game Night'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
