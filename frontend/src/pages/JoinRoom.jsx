import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JoinRoom = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Join the room through our API
      const response = await axios.post(`/api/rooms/${roomCode.toUpperCase()}/join`, {
        userName: name
      });

      // Save user information
      const newUser = {
        name,
        id: response.data.userId,
        isHost: false,
        roomCode: response.data.roomCode
      };
      
      setUser(newUser);
      
      // Navigate to the room page
      navigate(`/room/${response.data.roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      
      if (error.response && error.response.status === 404) {
        setError('Room not found. Please check the room code.');
      } else if (error.response && error.response.status === 400) {
        setError('This room is no longer active.');
      } else {
        setError('Failed to join room. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white text-center">Join a Movie Room</h1>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="card bg-gray-900">
          <form onSubmit={handleJoinRoom}>
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
            
            <div className="mb-6">
              <label htmlFor="roomCode" className="block text-gray-300 mb-2 font-medium">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="input text-center text-2xl tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={6}
                required
              />
              <p className="text-gray-400 text-sm mt-2">
                Enter the 6-character code shared by the room creator
              </p>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                className="btn-primary w-full py-3 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Joining Room...' : 'Join Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
