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

// Firebase config
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage
    const savedUser = localStorage.getItem('moviematch_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Initialize Firebase
  useEffect(() => {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    
    // Initialize Realtime Database
    const database = getDatabase(app);
    
    // Log initialization
    console.log('Firebase initialized');
  }, []);

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
