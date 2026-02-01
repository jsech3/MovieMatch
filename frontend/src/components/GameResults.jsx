import { useState } from 'react';
import { FaTrophy, FaStar, FaCopy, FaCheck, FaFilm } from 'react-icons/fa';

const GameResults = ({ winner, speedResults, pitchResults, users, userId, onPlayAgain, onClose }) => {
  const [copied, setCopied] = useState(false);

  const userList = users ? Object.entries(users).map(([id, u]) => ({ id, ...u })) : [];

  // Calculate stats
  const stats = calculateStats(speedResults, pitchResults, userList);

  const handleShare = async () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const text = [
      `🎬 Movie Night — ${today}`,
      `🏆 We picked: ${winner?.title || 'TBD'}`,
      stats.bestPitcher ? `🎤 Best Pitcher: ${stats.bestPitcher}` : '',
      stats.pickiest ? `😤 Pickiest: ${stats.pickiest}` : '',
      stats.mostEnthusiastic ? `🎉 Movie Lover: ${stats.mostEnthusiastic}` : '',
      '',
      'Made with MovieMatch 🍿',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto py-4">
      {/* Winner Card */}
      {winner && (
        <div className="text-center">
          <FaTrophy className="text-5xl text-yellow-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-1">Tonight's Movie</h2>

          <div className="mt-4 rounded-2xl overflow-hidden bg-gray-800 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
            <img
              src={winner.backdropPath || winner.posterPath}
              alt={winner.title}
              className="w-full h-44 object-cover"
            />
            <div className="p-4">
              <h3 className="text-2xl font-bold text-white">{winner.title}</h3>
              <div className="flex items-center justify-center gap-3 mt-1 text-gray-400 text-sm">
                {winner.releaseDate && (
                  <span>{new Date(winner.releaseDate).getFullYear()}</span>
                )}
                {winner.voteAverage && (
                  <span className="flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    {winner.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>
              {winner.overview && (
                <p className="text-gray-400 text-sm mt-3">{winner.overview}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fun Stats */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Game Stats</h3>

        <div className="grid grid-cols-2 gap-3">
          {stats.bestPitcher && (
            <StatCard emoji="🎤" label="Best Pitcher" value={stats.bestPitcher} color="purple" />
          )}
          {stats.pickiest && (
            <StatCard emoji="😤" label="Pickiest Player" value={stats.pickiest} color="red" />
          )}
          {stats.mostEnthusiastic && (
            <StatCard emoji="🎉" label="Movie Lover" value={stats.mostEnthusiastic} color="green" />
          )}
          {stats.mostControversial && (
            <StatCard emoji="🔥" label="Most Controversial" value={stats.mostControversial} color="orange" />
          )}
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <FaCheck className="text-green-400" /> Copied!
          </>
        ) : (
          <>
            <FaCopy /> Share Results
          </>
        )}
      </button>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPlayAgain}
          className="py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl transition"
        >
          Play Again
        </button>
        <button
          onClick={onClose}
          className="py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// Stat card sub-component
const StatCard = ({ emoji, label, value, color }) => {
  const colorMap = {
    purple: 'border-purple-700 bg-purple-900/20',
    red: 'border-red-700 bg-red-900/20',
    green: 'border-green-700 bg-green-900/20',
    orange: 'border-orange-700 bg-orange-900/20',
  };

  return (
    <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.purple}`}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-white font-semibold text-sm mt-1">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  );
};

// Calculate fun stats from round data
function calculateStats(speedResults, pitchResults, userList) {
  const stats = {};

  // Pickiest: most "no" votes in speed round
  if (speedResults && speedResults.length > 0) {
    const noCount = speedResults.filter((r) => r.vote === false).length;
    const yesCount = speedResults.filter((r) => r.vote === true).length;
    const total = speedResults.length;

    if (noCount > yesCount && userList.length > 0) {
      // In single player, the user is always the pickiest (or most enthusiastic)
      stats.pickiest = userList[0]?.name;
    }
    if (yesCount > noCount && userList.length > 0) {
      stats.mostEnthusiastic = userList[0]?.name;
    }
  }

  // Best Pitcher: who got the most "sold" votes
  if (pitchResults && pitchResults.length > 0) {
    const pitcherVotes = {};
    pitchResults.forEach((r) => {
      if (r.pitcher) {
        if (!pitcherVotes[r.pitcher]) pitcherVotes[r.pitcher] = { sold: 0, total: 0 };
        pitcherVotes[r.pitcher].total++;
        if (r.vote === true) pitcherVotes[r.pitcher].sold++;
      }
    });

    let bestPitcher = null;
    let bestRate = 0;
    Object.entries(pitcherVotes).forEach(([name, data]) => {
      const rate = data.total > 0 ? data.sold / data.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestPitcher = name;
      }
    });
    if (bestPitcher) stats.bestPitcher = bestPitcher;
  }

  return stats;
}

export default GameResults;
