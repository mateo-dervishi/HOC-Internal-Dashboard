import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Lock, AlertCircle } from 'lucide-react';
import { loginRequest } from '../config/authConfig';

export const Login = () => {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        if (err.message.includes('user_cancelled')) {
          setError('Login cancelled');
        } else if (err.message.includes('AADSTS50105')) {
          setError('You do not have access to this application. Contact your administrator.');
        } else if (err.message.includes('AADSTS')) {
          setError('Authentication failed. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo/Header */}
        <div className="login-header">
          <div className="login-icon">
            <Lock size={28} />
          </div>
          <h1>House of Clarence</h1>
          <p>Internal Dashboard</p>
        </div>

        {error && (
          <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className="btn btn-primary login-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.8rem',
          lineHeight: 1.5,
        }}>
          Use your House of Clarence<br />Microsoft account
        </p>

        {/* Footer */}
        <p className="login-footer">Authorized personnel only</p>
      </div>
    </div>
  );
};
