import { Link } from 'react-router-dom';
import { FaFilm, FaUsers, FaThumbsUp, FaRandom } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Find Your Perfect Movie Match
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            End the endless scrolling and debating. Vote with friends and quickly find a movie everyone wants to watch.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/create-room" className="btn-primary text-lg px-6 py-3">
              Create a Room
            </Link>
            <Link to="/join-room" className="btn-secondary text-lg px-6 py-3">
              Join a Room
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">How It Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card bg-gray-900 hover:bg-gray-800 hover:scale-105">
            <div className="text-primary-500 text-4xl mb-4 flex justify-center">
              <FaFilm />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white text-center">Filter Movies</h3>
            <p className="text-gray-400">
              Select your streaming services, genres, and runtime preferences to narrow down the options.
            </p>
          </div>
          
          <div className="card bg-gray-900 hover:bg-gray-800 hover:scale-105">
            <div className="text-primary-500 text-4xl mb-4 flex justify-center">
              <FaUsers />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white text-center">Create Group</h3>
            <p className="text-gray-400">
              Generate a unique room code and invite friends to join your movie selection session.
            </p>
          </div>
          
          <div className="card bg-gray-900 hover:bg-gray-800 hover:scale-105">
            <div className="text-primary-500 text-4xl mb-4 flex justify-center">
              <FaThumbsUp />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white text-center">Vote Together</h3>
            <p className="text-gray-400">
              Everyone votes yes or no on suggested movies. The most popular choices rise to the top.
            </p>
          </div>
          
          <div className="card bg-gray-900 hover:bg-gray-800 hover:scale-105">
            <div className="text-primary-500 text-4xl mb-4 flex justify-center">
              <FaRandom />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white text-center">Roulette Mode</h3>
            <p className="text-gray-400">
              Can't decide? Let our roulette feature randomly select from your top-rated options.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="bg-gradient-to-r from-primary-700 to-secondary-700 rounded-2xl py-12 px-6">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to find your next movie?</h2>
          <p className="text-xl mb-8 text-white">
            No more endless scrolling. Start finding movies everyone wants to watch.
          </p>
          <Link to="/create-room" className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-6 py-3">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
