import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut, fetchNotifications, markAllRead } from '../api';

export default function Navbar({ showToast }) {
  const navigate  = useNavigate();
  const { isLoggedIn, profile, user } = useAuth();

  const [notifs,      setNotifs]      = useState([]);
  const [open,        setOpen]        = useState(false);
  const [loadingN,    setLoadingN]    = useState(false);
  const dropRef = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  // Load notifications when logged in
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadNotifs();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifs() {
    if (!user) return;
    setLoadingN(true);
    try {
      const data = await fetchNotifications(user.id);
      setNotifs(data);
    } catch {}
    finally { setLoadingN(false); }
  }

  async function handleBellClick() {
    setOpen(o => !o);
    if (!open && unread > 0) {
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

  const displayName = profile?.name?.split(' ')[0] || 'You';

  const NOTIF_ICONS = {
    task_accepted: '⚡',
    task_completed: '💰',
    warning: '⚠️',
  };

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
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:13, color:'var(--text2)' }}>
              Hey, <strong style={{ color:'var(--text)' }}>{displayName}</strong>
            </span>

            {/* Bell */}
            <div ref={dropRef} style={{ position:'relative' }}>
              <button
                onClick={handleBellClick}
                style={{
                  position:   'relative',
                  background: open ? 'var(--bg3)' : 'transparent',
                  border:     '1px solid ' + (open ? 'var(--border2)' : 'transparent'),
                  borderRadius: 10,
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16, transition: 'all .15s',
                }}
              >
                🔔
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--red, #ef4444)',
                    border: '1.5px solid var(--bg)',
                  }} />
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div style={{
                  position: 'absolute', top: 44, right: 0,
                  width: 320,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,.4)',
                  zIndex: 999,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    Notifications
                    {unread > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: 'var(--purple-bg)',
                        color: 'var(--purple2)',
                        border: '1px solid var(--purple-br)',
                        borderRadius: 100, padding: '2px 8px',
                      }}>
                        {unread} new
                      </span>
                    )}
                  </div>

                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {loadingN ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                        Loading…
                      </div>
                    ) : notifs.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifs.map(n => (
                        <div
                          key={n.id}
                          onClick={() => { if (n.task_id) { navigate(`/task/${n.task_id}`); setOpen(false); } }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                            background: n.is_read ? 'transparent' : 'rgba(139,124,248,0.05)',
                            cursor: n.task_id ? 'pointer' : 'default',
                            transition: 'background .15s',
                          }}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                            {NOTIF_ICONS[n.type] || '🔔'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, lineHeight: 1.4,
                              color: n.type === 'warning' ? '#f87171' : 'var(--text)',
                            }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                              {timeAgo(n.created_at)}
                            </div>
                          </div>
                          {!n.is_read && (
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: 'var(--purple)', flexShrink: 0, marginTop: 5,
                            }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}