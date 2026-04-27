import { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './shared/store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyPage } from './features/auth/VerifyPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { FeedPage } from './features/feed/FeedPage';
import { PostPage } from './features/post/PostPage';
import { SearchPage } from './features/search/SearchPage';
import { TagPage } from './features/tag/TagPage';
import { ShelvesPage } from './features/shelves/ShelvesPage';
import { TrackerPage } from './features/tracker/TrackerPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ChatsPage } from './features/chat/ChatsPage';

function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ borderBottom: '1px solid #eee', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" style={{ fontWeight: 700, textDecoration: 'none', color: '#646cff', fontSize: '1.1rem' }}>White Nights</Link>
      <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Feed</Link>
      <Link to="/search" style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Search</Link>
      {user && (
        <>
          <Link to={`/u/${user.nickname}/shelves`} style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Shelves</Link>
          <Link to="/tracker" style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Tracker</Link>
          <Link to="/chat" style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Chat</Link>
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <>
            <Link to={`/u/${user.nickname}`} style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>@{user.nickname}</Link>
            <Link to="/settings" style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Settings</Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '0.9rem' }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/u/:nickname" element={<ProfilePage />} />
        <Route path="/posts/:id" element={<PostPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tags/:name" element={<TagPage />} />
        <Route path="/u/:nickname/shelves" element={<ShelvesPage />} />
        <Route
          path="/tracker"
          element={
            <PrivateRoute>
              <TrackerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <PrivateRoute>
              <ChatsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <FeedPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
