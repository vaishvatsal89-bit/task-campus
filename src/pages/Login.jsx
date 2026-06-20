import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signIn, signUp, sendPasswordReset } from '../api';

const UNIVERSITY_DOMAIN =
  import.meta.env.VITE_UNIVERSITY_DOMAIN || 'university.edu';

export default function Login({ showToast }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [tab,           setTab]           = useState('login');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [forgotMode,    setForgotMode]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [name,          setName]          = useState('');
  const [signupEmail,   setSignupEmail]   = useState('');
  const [upiId,         setUpiId]         = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupSent, setSignupSent] = useState(false);
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
  if (err.message?.toLowerCase().includes('email not confirmed')) {
    setError('Please confirm your email first. Check your university inbox.');
  } else {
    setError(err.message || 'Login failed');
  }
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
    setSignupSent(true);
    } catch (err) {
  if (err.message?.includes('permission denied')) {
    setError('Signup failed. Please try again.');
  } else if (err.message?.includes('already registered')) {
    setError('This email is already registered. Try logging in.');
  } else {
    setError(err.message || 'Signup failed');
  }
  } finally {
    setLoading(false);
  }
}

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      showToast('Reset link sent! Check your university email.', 'success');
      setForgotMode(false);
      setForgotEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">

        <div className="auth-logo">
          <div className="bolt">⚡</div>
          TaskCampus
        </div>
        <div className="auth-sub">
          Campus-only task marketplace. Verified students only.
        </div>

        {/* ── FORGOT PASSWORD MODE ── */}
        {forgotMode ? (
          <>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Reset password</h2>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
              Enter your university email and we'll send a reset link.
            </p>

            {error && (
              <div className="info-box" style={{ borderColor:'var(--red-br)', color:'var(--red)', marginBottom:16 }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleForgot}>
              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  className="inp"
                  type="email"
                  placeholder={`yourname@${UNIVERSITY_DOMAIN}`}
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <button
                className="btn btn-md btn-primary btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link →'}
              </button>
              <div className="form-note">
                <button
                  type="button"
                  style={{ background:'none', border:'none', color:'var(--purple2)', cursor:'pointer', font:'inherit', padding:0 }}
                  onClick={() => { setForgotMode(false); setError(''); }}
                >
                  ← Back to login
                </button>
              </div>
            </form>
          </>

        ) : (
          /* ── NORMAL LOGIN / SIGNUP MODE ── */
          <>
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
              <div className="info-box" style={{ borderColor:'var(--red-br)', color:'var(--red)' }}>
                {error}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">University Email</label>
                  <input
                    className="inp"
                    type="email"
                    placeholder={`yourname@${UNIVERSITY_DOMAIN}`}
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
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
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{ background:'none', border:'none', color:'var(--purple2)', cursor:'pointer', font:'inherit', fontSize:12, padding:'4px 0 0', textAlign:'right', width:'100%' }}
                    onClick={() => { setForgotMode(true); setForgotEmail(loginEmail); setError(''); }}
                  >
                    Forgot password?
                  </button>
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
                    style={{ background:'none', border:'none', color:'var(--purple2)', cursor:'pointer', font:'inherit', padding:0 }}
                    onClick={() => { setTab('signup'); setError(''); }}
                  >
                    Sign up here
                  </button>
                </div>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
              {tab === 'signup' && signupSent ? (
  <div style={{ textAlign:'center', padding:'8px 0' }}>
    <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
    <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Check your email!</h3>
    <p style={{ fontSize:14, color:'var(--text2)', marginBottom:6, lineHeight:1.6 }}>
      We sent a confirmation link to
    </p>
    <p style={{ fontSize:14, fontWeight:600, color:'var(--purple2)', marginBottom:16 }}>
      {signupEmail}
    </p>
    <p style={{ fontSize:13, color:'var(--text3)', marginBottom:24, lineHeight:1.6 }}>
      Click the link in the email to activate your account, then come back to log in.
    </p>
    <button
      className="btn btn-md btn-primary btn-full"
      onClick={() => { setSignupSent(false); setTab('login'); setError(''); }}
    >
      Go to login
    </button>
  </div>
) : tab === 'signup' && (
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
                    onChange={e => setName(e.target.value)}
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
                    onChange={e => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UPI ID</label>
                  <input
                    className="inp"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
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
                    onChange={e => setSignupPassword(e.target.value)}
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
          </>
        )}

      </div>
    </div>
  );
}