import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { DashboardProvider } from './context/DashboardContext';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NetProfit from './pages/NetProfit';
import OperationalCosts from './pages/OperationalCosts';
import Settings from './pages/Settings';
import { Login } from './components/Login';
import { msalConfig } from './config/authConfig';
import './index.css';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect promise on page load
msalInstance.initialize().then(() => {
  // Set active account if available
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Listen for login events
  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      msalInstance.setActiveAccount(payload.account);
    }
  });
});

// Auth wrapper component
const AuthenticatedApp = () => {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Show loading while checking auth
  if (inProgress !== 'none') {
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
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
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
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedApp />
    </MsalProvider>
  );
}

export default App;
