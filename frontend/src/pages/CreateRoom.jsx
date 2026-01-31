import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components
import FilterSelector from '../components/FilterSelector';

const CreateRoom = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);

  // Filters state
  const [filters, setFilters] = useState({
    platform: 'all',
    genre: 'all',
    minRuntime: 0,
    maxRuntime: 240
  });

  // Fetch genres from TMDB API via our backend
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get('/api/movies/genres/list');
        setGenres(response.data.genres || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
        setError('Failed to load movie genres. Please try again later.');
      }
    };

    fetchGenres();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create a new room through our API
      const response = await axios.post(`/api/rooms?creatorName=${encodeURIComponent(name)}`, {
        filters
      });

      // Save user information
      const newUser = {
        name,
        id: Object.keys(response.data.room.users)[0],
        isHost: true
      };
      
      setUser(newUser);
      
      // Navigate to the room page
      navigate(`/room/${response.data.roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">Create a Movie Room</h1>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="card bg-gray-900 mb-8">
          <form onSubmit={handleCreateRoom}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter your name"
                required
              />
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-white">Movie Preferences</h2>
            
            <div className="space-y-6">
              <FilterSelector 
                label="Streaming Platform"
                type="platform"
                value={filters.platform}
                onChange={handleFilterChange}
                options={[
                  { value: 'all', label: 'All Platforms' },
                  { value: 'netflix', label: 'Netflix' },
                  { value: 'prime', label: 'Amazon Prime' },
                  { value: 'disney', label: 'Disney+' },
                  { value: 'hulu', label: 'Hulu' },
                  { value: 'hbo', label: 'HBO Max' },
                  { value: 'apple', label: 'Apple TV+' }
                ]}
              />
              
              <FilterSelector 
                label="Genre"
                type="genre"
                value={filters.genre}
                onChange={handleFilterChange}
                options={[
                  { value: 'all', label: 'All Genres' },
                  ...genres.map(genre => ({
                    value: genre.id.toString(),
                    label: genre.name
                  }))
                ]}
              />
              
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Movie Length (minutes)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-1/2">
                    <label htmlFor="minRuntime" className="block text-gray-400 text-sm mb-1">
                      Minimum: {filters.minRuntime} min
                    </label>
                    <input
                      type="range"
                      id="minRuntime"
                      min="0"
                      max="240"
                      step="15"
                      value={filters.minRuntime}
                      onChange={(e) => handleFilterChange('minRuntime', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="w-1/2">
                    <label htmlFor="maxRuntime" className="block text-gray-400 text-sm mb-1">
                      Maximum: {filters.maxRuntime} min
                    </label>
                    <input
                      type="range"
                      id="maxRuntime"
                      min="0"
                      max="240"
                      step="15"
                      value={filters.maxRuntime}
                      onChange={(e) => handleFilterChange('maxRuntime', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                className="btn-primary w-full py-3 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Room...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
