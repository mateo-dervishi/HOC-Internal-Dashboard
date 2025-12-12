import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { DashboardProvider } from './context/DashboardContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NetProfit from './pages/NetProfit';
import OperationalCosts from './pages/OperationalCosts';
import Settings from './pages/Settings';
import { Login } from './components/Login';
import { supabase } from './config/authConfig';
import './index.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text-muted)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinning" style={{ 
            width: '32px', 
            height: '32px', 
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-text)',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  // Show dashboard if authenticated
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="profit" element={<NetProfit />} />
            <Route path="costs" element={<OperationalCosts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;
