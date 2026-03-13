import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar           from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import Dashboard  from './pages/Dashboard';
import Patterns   from './pages/Patterns';
import Simulator  from './pages/Simulator';
import SyncHub    from './pages/SyncHub';
import Coach      from './pages/Coach';
import LogEntry   from './pages/LogEntry';
import Login      from './pages/Login';
import Register   from './pages/Register';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading Loom…</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}


function AppShell() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">

      <Navbar />

      <main>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/log"       element={<LogEntry />} />
          <Route path="/patterns"  element={<Patterns />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/coach"     element={<Coach />} />
          <Route path="/sync"      element={<SyncHub />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <PWAInstallPrompt />

    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
