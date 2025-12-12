import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { loginRequest, isAzureConfigured } from '../config/authConfig';

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

  const azureConfigured = isAzureConfigured();

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

        {!azureConfigured ? (
          // Show setup instructions if Azure not configured
          <div style={{
            padding: '1.5rem',
            background: 'var(--color-warning-dim)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ 
                  color: 'var(--color-warning)', 
                  fontWeight: 500, 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem' 
                }}>
                  Azure AD Not Configured
                </p>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  margin: 0 
                }}>
                  Please update <code style={{ 
                    background: 'var(--color-bg-elevated)', 
                    padding: '0.125rem 0.375rem',
                    borderRadius: '3px',
                    fontSize: '0.75rem'
                  }}>src/config/authConfig.ts</code> with your Azure AD Client ID and Tenant ID.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Microsoft Login Button
          <>
            {error && (
              <div className="login-error">{error}</div>
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
                  <Mail size={20} />
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
              Use your company Microsoft account<br />
              <span style={{ color: 'var(--color-text-dim)' }}>(@houseofclarence.com)</span>
            </p>
          </>
        )}

        {/* Footer */}
        <p className="login-footer">Authorized personnel only</p>
      </div>
    </div>
  );
};

// Legacy exports for compatibility (no longer used with Azure AD)
export const isAuthenticated = (): boolean => false;
export const logout = () => {};
