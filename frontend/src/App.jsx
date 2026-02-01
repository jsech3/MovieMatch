import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Page components
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('moviematch_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('moviematch_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('moviematch_user');
    }
  }, [user]);

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-room" element={<CreateRoom user={user} setUser={setUser} />} />
          <Route path="/join-room" element={<JoinRoom user={user} setUser={setUser} />} />
          <Route path="/room/:roomCode" element={<Room user={user} setUser={setUser} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
