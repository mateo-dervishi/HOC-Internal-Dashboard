import { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured, isAllowedEmail, ALLOWED_EMAIL_DOMAINS } from '../config/authConfig';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    // Check if email domain is allowed
    if (!isAllowedEmail(email)) {
      setError(`Only ${ALLOWED_EMAIL_DOMAINS.join(', ')} emails are allowed`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setEmailSent(true);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  // Success state - email sent
  if (emailSent) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon" style={{ background: 'var(--color-success-dim)', borderColor: 'var(--color-success)' }}>
              <Check size={28} style={{ color: 'var(--color-success)' }} />
            </div>
            <h1>Check Your Email</h1>
            <p style={{ marginTop: '0.5rem' }}>
              We sent a login link to<br />
              <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
            </p>
          </div>

          <div style={{
            padding: '1rem',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
          }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              Click the link in the email to sign in. The link will expire in 1 hour.
            </p>
          </div>

          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Use a different email
          </button>

          <p className="login-footer">Authorized personnel only</p>
        </div>
      </div>
    );
  }

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

        {!configured ? (
          // Show setup instructions if Supabase not configured
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
                  Supabase Not Configured
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
                  }}>src/config/authConfig.ts</code> with your Supabase URL and anon key.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Login Form
          <form onSubmit={handleMagicLinkLogin}>
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@houseofclarence.com"
                  className="form-input"
                  style={{ paddingLeft: '2.75rem' }}
                  autoFocus
                  required
                />
                <Mail 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.875rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)'
                  }} 
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn-primary login-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  Send Login Link
                  <ArrowRight size={18} />
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
              We'll email you a secure login link.<br />
              <span style={{ color: 'var(--color-text-dim)' }}>No password required.</span>
            </p>
          </form>
        )}

        {/* Footer */}
        <p className="login-footer">Authorized personnel only</p>
      </div>
    </div>
  );
};
