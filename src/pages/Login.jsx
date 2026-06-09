import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signIn, signUp } from '../api';

const UNIVERSITY_DOMAIN =
  import.meta.env.VITE_UNIVERSITY_DOMAIN || 'university.edu';

export default function Login({ showToast }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, name, upiId);
      showToast('Account created! You are logged in.', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <div className="bolt">⚡</div>
          TaskCampus
        </div>
        <div className="nav-right">
          <Link to="/" className="btn btn-sm btn-secondary">
            ← Back To Home
          </Link>
        </div>
      </nav>

      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-logo">
            <div className="bolt">⚡</div>
            TaskCampus
          </div>

          <div className="auth-sub">
            Campus-only task marketplace. Verified students only.
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="info-box" style={{ borderColor: 'var(--red-br)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  className="inp"
                  type="email"
                  placeholder={`yourname@${UNIVERSITY_DOMAIN}`}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="inp"
                  type="password"
                  placeholder="••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-md btn-primary btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="form-note">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--purple2)',
                    cursor: 'pointer',
                    font: 'inherit',
                    padding: 0,
                  }}
                  onClick={() => setTab('signup')}
                >
                  Sign up here
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="info-box">
                🎓 Only @{UNIVERSITY_DOMAIN} emails accepted
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="inp"
                  placeholder="Arjun Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  className="inp"
                  type="email"
                  placeholder={`yourname@${UNIVERSITY_DOMAIN}`}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input
                  className="inp"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="inp"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <button
                className="btn btn-md btn-primary btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default Login;
