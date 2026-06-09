/*
  Navbar.jsx — UPDATED FOR PHASE 4
  ───────────────────────────────────
  WHAT CHANGED:
  - No longer receives user/setUser as props
  - Uses useAuth() to get user and logout
  - signOut() calls Supabase, not localStorage
*/

import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../api';

export default function Navbar({ showToast }) {
  const navigate = useNavigate();
  const { isLoggedIn, profile } = useAuth();

  async function handleLogout() {
    try {
      await signOut();
      showToast('Logged out', 'info');
      navigate('/');
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  }

  const displayName = profile?.name?.split(' ')[0] || 'You';

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => navigate('/')}>
        <div className="bolt">⚡</div>
        TaskCampus
      </div>
      <div className="nav-links">
        <NavLink to="/">Browse</NavLink>
        <NavLink to="/post">Post task</NavLink>
        <NavLink to="/mytasks">My tasks</NavLink>
      </div>
      <div className="nav-right">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              Hey, <strong style={{ color: 'var(--text)' }}>{displayName}</strong>
            </span>
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/login')}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}