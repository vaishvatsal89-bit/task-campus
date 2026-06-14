import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../api';
import { supabase } from '../supabase';

export default function ResetPassword({ showToast }) {
  const navigate  = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [checking,  setChecking]  = useState(true);

  // Supabase puts the session in the URL hash after email link click
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidLink(true);
      }
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error'); return;
    }
    if (password !== confirm) {
      showToast('Passwords do not match', 'error'); return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      showToast('Password updated! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="page-wrap" style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!validLink) {
    return (
      <div className="page-wrap" style={{ maxWidth:400, margin:'0 auto', paddingTop:60 }}>
        <div style={styles.card}>
          <div style={{ fontSize:32, textAlign:'center', marginBottom:16 }}>❌</div>
          <h2 style={styles.title}>Invalid or expired link</h2>
          <p style={{ fontSize:14, color:'var(--text2)', textAlign:'center', marginBottom:24 }}>
            This password reset link has expired or already been used.
          </p>
          <button className="btn btn-md btn-primary btn-full" onClick={() => navigate('/login')}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth:400, margin:'0 auto', paddingTop:60 }}>
      <div style={styles.card}>
        <div style={{ fontSize:32, textAlign:'center', marginBottom:8 }}>🔒</div>
        <h2 style={styles.title}>Set new password</h2>
        <p style={{ fontSize:14, color:'var(--text2)', textAlign:'center', marginBottom:28 }}>
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              className="inp"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              className="inp"
              type="password"
              placeholder="Type it again"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-lg btn-primary btn-full"
            type="submit"
            disabled={loading}
            style={{ marginTop:8 }}
          >
            {loading ? 'Updating...' : 'Update password →'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  card:    { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r3)', padding:32 },
  title:   { fontSize:20, fontWeight:700, textAlign:'center', marginBottom:8 },
  spinner: { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};