import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut, fetchNotifications, markAllRead } from '../api';

export default function Navbar({ showToast }) {
  const navigate = useNavigate();
  const { isLoggedIn, profile, user } = useAuth();

  const [notifs,      setNotifs]      = useState([]);
  const [bellOpen,    setBellOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingN,    setLoadingN]    = useState(false);

  const bellRef    = useRef(null);
  const profileRef = useRef(null);

  const unread   = notifs.filter(n => !n.is_read).length;
  const initials = profile?.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifs() {
    if (!user) return;
    setLoadingN(true);
    try { const data = await fetchNotifications(user.id); setNotifs(data); }
    catch {}
    finally { setLoadingN(false); }
  }

  async function handleBellClick() {
    setBellOpen(o => !o);
    setProfileOpen(false);
    if (!bellOpen && unread > 0) {
      try {
        await markAllRead(user.id);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch {}
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      showToast('Logged out', 'info');
      navigate('/');
    } catch {
      showToast('Logout failed', 'error');
    }
  }

  const NOTIF_ICONS = { task_accepted: '⚡', task_completed: '💰', warning: '⚠️' };

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
        <NavLink to="/dashboard">Wallet</NavLink>
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={handleBellClick} style={styles.iconBtn(bellOpen)}>
                🔔
                {unread > 0 && <span style={styles.redDot} />}
              </button>

              {bellOpen && (
                <div style={styles.dropdown(320)}>
                  <div style={styles.dropHeader}>
                    Notifications
                    {unread > 0 && <span style={styles.badge}>{unread} new</span>}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {loadingN ? (
                      <div style={styles.dropEmpty}>Loading…</div>
                    ) : notifs.length === 0 ? (
                      <div style={styles.dropEmpty}>No notifications yet</div>
                    ) : notifs.map(n => (
                      <div key={n.id}
                        onClick={() => { if (n.task_id) { navigate(`/task/${n.task_id}`); setBellOpen(false); } }}
                        style={{ ...styles.notifRow, background: n.is_read ? 'transparent' : 'rgba(139,124,248,0.05)', cursor: n.task_id ? 'pointer' : 'default' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: n.type === 'warning' ? '#f87171' : 'var(--text)', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                        </div>
                        {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', flexShrink: 0 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div
                onClick={() => { setProfileOpen(o => !o); setBellOpen(false); }}
                style={styles.avatar(profileOpen)}
              >
                {initials}
              </div>

              {profileOpen && (
                <div style={styles.dropdown(200)}>
                  {/* User info */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{profile?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{user?.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 3 }}>⭐ {profile?.rating} rating</div>
                  </div>

                  {/* Menu */}
                  <div style={{ padding: '6px 0' }}>
                    <MenuItem label="✏️  Edit Profile" onClick={() => { navigate('/profile'); setProfileOpen(false); }} />
                    <MenuItem label="💰  Wallet"       onClick={() => { navigate('/dashboard'); setProfileOpen(false); }} />
                    <MenuItem label="📋  My Tasks"     onClick={() => { navigate('/mytasks'); setProfileOpen(false); }} />
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
                      <MenuItem label="🚪  Logout" onClick={handleLogout} color="#f87171" />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </nav>
  );
}

function MenuItem({ label, onClick, color }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '9px 16px',
        fontSize: 13,
        cursor: 'pointer',
        color: color || 'var(--text)',
        background: hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background .1s',
      }}
    >
      {label}
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = {
  iconBtn: (active) => ({
    position: 'relative', background: active ? 'var(--bg3)' : 'transparent',
    border: `1px solid ${active ? 'var(--border2)' : 'transparent'}`,
    borderRadius: 10, width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 16, transition: 'all .15s',
  }),
  redDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: '50%',
    background: '#ef4444', border: '1.5px solid var(--bg)',
  },
  avatar: (active) => ({
    width: 36, height: 36, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
    border: `2px solid ${active ? 'var(--purple2)' : 'transparent'}`,
    transition: 'border-color .15s', userSelect: 'none',
  }),
  dropdown: (width) => ({
    position: 'absolute', top: 44, right: 0, width,
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.4)',
    zIndex: 999, overflow: 'hidden',
  }),
  dropHeader: {
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    fontSize: 13, fontWeight: 700,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  badge: {
    fontSize: 10, fontWeight: 700,
    background: 'var(--purple-bg)', color: 'var(--purple2)',
    border: '1px solid var(--purple-br)', borderRadius: 100, padding: '2px 8px',
  },
  notifRow: {
    padding: '11px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background .15s',
  },
  dropEmpty: { padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 },
};