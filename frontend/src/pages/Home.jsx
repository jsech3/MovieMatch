import { Link } from 'react-router-dom';
import { FaBolt, FaMicrophone, FaTrophy, FaGamepad } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero */}
      <section className="text-center py-16 max-w-2xl mx-auto">
        <FaGamepad className="text-6xl text-primary-400 mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          MovieMatch
        </h1>
        <p className="text-xl md:text-2xl mb-2 text-gray-300">
          The movie night party game.
        </p>
        <p className="text-gray-500 mb-10">
          Stop scrolling. Start playing. Find your movie in 3 rounds.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/create-room"
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-primary-900/50"
          >
            Start a Game
          </Link>
          <Link
            to="/join-room"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-lg font-semibold rounded-xl transition"
          >
            Join a Room
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10 text-white">3 Rounds. 1 Movie.</h2>
        <div className="space-y-6">
          <RoundCard
            icon={FaBolt}
            color="yellow"
            number="1"
            title="Speed Round"
            desc="Movies fly by. Swipe yes or no in 5 seconds. Quick gut reactions narrow the field."
          />
          <RoundCard
            icon={FaMicrophone}
            color="purple"
            number="2"
            title="The Pitch"
            desc="Take turns pitching movies to the group. Sell it in 45 seconds — then everyone votes: Sold or Pass."
          />
          <RoundCard
            icon={FaTrophy}
            color="orange"
            number="3"
            title="Face-Off"
            desc="Top contenders go head-to-head in a bracket. Pick your favorite until one movie wins."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <div className="bg-gradient-to-r from-primary-800/50 to-primary-700/30 border border-primary-700/50 rounded-2xl py-10 px-6 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-3 text-white">Ready for movie night?</h2>
          <p className="text-gray-400 mb-6">
            No signup. No app download. Just share the room code.
          </p>
          <Link
            to="/create-room"
            className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
          >
            Create a Room
          </Link>
        </div>
      </section>
    </div>
  );
};

const RoundCard = ({ icon: Icon, color, number, title, desc }) => {
  const colorMap = {
    yellow: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400',
    purple: 'bg-purple-900/30 border-purple-700/50 text-purple-400',
    orange: 'bg-orange-900/30 border-orange-700/50 text-orange-400',
  };

  return (
    <div className={`flex items-start gap-4 p-5 rounded-2xl border ${colorMap[color]}`}>
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
        <Icon className="text-xl" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">Round {number}</span>
        </div>
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">{desc}</p>
      </div>
    </div>
  );
};

export default Home;
