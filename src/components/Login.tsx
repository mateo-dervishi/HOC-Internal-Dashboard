import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

// Simple password for dashboard access - change this!
const ADMIN_PASSWORD = 'HOC2025!';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem('hoc_authenticated', 'true');
        localStorage.setItem('hoc_auth_time', Date.now().toString());
        onLogin();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Lock size={28} />
          </div>
          <h1>House of Clarence</h1>
          <p>Internal Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="form-input"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn btn-primary login-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">Authorized personnel only</p>
      </div>
    </div>
  );
};

export const isAuthenticated = (): boolean => {
  const auth = localStorage.getItem('hoc_authenticated');
  const authTime = localStorage.getItem('hoc_auth_time');
  
  if (!auth || !authTime) return false;
  
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - parseInt(authTime);
  
  if (elapsed > SESSION_DURATION) {
    localStorage.removeItem('hoc_authenticated');
    localStorage.removeItem('hoc_auth_time');
    return false;
  }
  
  return true;
};

export const logout = () => {
  localStorage.removeItem('hoc_authenticated');
  localStorage.removeItem('hoc_auth_time');
  window.location.reload();
};

