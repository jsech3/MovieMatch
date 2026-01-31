import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaFilm, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-900 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Site Name */}
          <Link to="/" className="flex items-center space-x-2">
            <FaFilm className="text-primary-500 text-2xl" />
            <span className="text-white font-bold text-xl">MovieMatch</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-300 hover:text-white px-3 py-2">
              Home
            </Link>
            
            {!user ? (
              <>
                <Link to="/create-room" className="text-gray-300 hover:text-white px-3 py-2">
                  Create Room
                </Link>
                <Link to="/join-room" className="text-gray-300 hover:text-white px-3 py-2">
                  Join Room
                </Link>
              </>
            ) : (
              <>
                {user.roomCode && (
                  <Link to={`/room/${user.roomCode}`} className="text-gray-300 hover:text-white px-3 py-2">
                    Current Room
                  </Link>
                )}
                <div className="flex items-center text-gray-300">
                  <span className="mr-2">{user.name}</span>
                  <button
                    onClick={onLogout}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <FaSignOutAlt className="mr-1" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-2 space-y-2">
            <Link 
              to="/" 
              className="block text-gray-300 hover:text-white px-3 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {!user ? (
              <>
                <Link 
                  to="/create-room" 
                  className="block text-gray-300 hover:text-white px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Room
                </Link>
                <Link 
                  to="/join-room" 
                  className="block text-gray-300 hover:text-white px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Join Room
                </Link>
              </>
            ) : (
              <>
                {user.roomCode && (
                  <Link 
                    to={`/room/${user.roomCode}`} 
                    className="block text-gray-300 hover:text-white px-3 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Current Room
                  </Link>
                )}
                <div className="flex justify-between items-center text-gray-300 px-3 py-2">
                  <span>{user.name}</span>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <FaSignOutAlt className="mr-1" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
