import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reportes from './pages/Reportes';
import Presupuestos from './pages/Presupuestos';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.warn('Supabase session check failed (possibly unconfigured or offline):', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-svh bg-[#090b11] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  // Allow accessing Dashboard & Reportes directly without login if Supabase credentials are missing
  const isSupabaseConfigured =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            session ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/"
          element={
            session || !isSupabaseConfigured ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/reportes"
          element={
            session || !isSupabaseConfigured ? (
              <Reportes />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/presupuestos"
          element={
            session || !isSupabaseConfigured ? (
              <Presupuestos />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
export { App };
