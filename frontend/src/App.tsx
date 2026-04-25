import { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './shared/store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyPage } from './features/auth/VerifyPage';
import { ProfilePage } from './features/profile/ProfilePage';

const FeedPage = () => {
  const { user, logout } = useAuthStore();
  return (
    <div>
      <h1>Feed Page</h1>
      <p>Welcome, {user?.nickname}!</p>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to={`/u/${user?.nickname}`}>My Profile</Link>
        <button onClick={logout}>Logout</button>
      </nav>
    </div>
  );
};

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/u/:nickname" element={<ProfilePage />} />
      
      <Route 
        path="/" 
        element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

export default App;
