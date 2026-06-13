import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUpiId, fetchTransactions } from '../api';

export default function Profile({ showToast }) {
  const navigate  = useNavigate();
  const { user, profile, isLoggedIn, refreshProfile } = useAuth();

  const [upiId,       setUpiId]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [tab,         setTab]         = useState('deposits');
  const [deposits,    setDeposits]    = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (profile?.upi_id) setUpiId(profile.upi_id);
  }, [profile]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    fetchTransactions(user.id)
      .then(({ deposits: d, withdrawals: w }) => {
        setDeposits(d);
        setWithdrawals(w);
      })
      .catch(() => showToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, user]);

  async function handleSaveUpi() {
    if (!upiId.trim()) { showToast('Enter a valid UPI ID', 'error'); return; }
    setSaving(true);
    try {
      await updateUpiId(user.id, upiId);
       try { if (refreshProfile) await refreshProfile(); } catch {}
      showToast('UPI ID updated ✓', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">You're not logged in</div>
          <button className="btn btn-md btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    );
  }

  const initials = profile?.name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
        <div style={styles.bigAvatar}>{initials}</div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{profile?.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{user?.email}</div>
          <div style={{ fontSize: 13, color: 'var(--amber)', marginTop: 4 }}>⭐ {profile?.rating} rating</div>
        </div>
      </div>

      {/* Edit UPI */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Payment Details</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Your UPI ID is used for withdrawing your earnings.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="inp"
            style={{ flex: 1 }}
            placeholder="yourname@upi"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
          />
          <button
            className="btn btn-md btn-primary"
            onClick={handleSaveUpi}
            disabled={saving}
            style={{ flexShrink: 0 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {profile?.upi_id && (
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 8 }}>
            ✓ Current: {profile.upi_id}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={{ ...styles.cardTitle, marginBottom: 16 }}>Transaction History</h3>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {[{ key: 'deposits', label: '💰 Earnings' }, { key: 'withdrawals', label: '↑ Withdrawals' }].map(t => (
            <button
              key={t.key}
              style={{ ...styles.tabBtn, ...(tab === t.key ? styles.tabActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <div style={styles.spinner} />
          </div>
        ) : tab === 'deposits' ? (
          deposits.length === 0 ? (
            <div style={styles.empty}>No earnings yet. Complete a task to earn.</div>
          ) : (
            deposits.map(task => (
              <div key={task.id} style={styles.row} onClick={() => navigate(`/task/${task.id}`)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {task.poster_name} · {new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>
                  +₹{Math.round(task.amount * 0.8)}
                </div>
              </div>
            ))
          )
        ) : (
          withdrawals.length === 0 ? (
            <div style={styles.empty}>No withdrawals yet.</div>
          ) : (
            withdrawals.map(w => (
              <div key={w.id} style={styles.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Withdrawal to {w.upi_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {new Date(w.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15 }}>-₹{w.amount}</div>
                  <span style={badgeStyle(w.status)}>
                    {w.status === 'paid' ? '✓ Paid' : w.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

function badgeStyle(status) {
  if (status === 'paid')     return { fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-br)' };
  if (status === 'rejected') return { fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(220,38,38,.1)', color: '#f87171', border: '1px solid rgba(220,38,38,.3)' };
  return                            { fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,.25)' };
}

const styles = {
  bigAvatar: { width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--purple2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 },
  card:      { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r3)', padding: 24 },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  tabBar:    { display: 'flex', gap: 6, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 4, marginBottom: 16, width: 'fit-content' },
  tabBtn:    { padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font)', transition: 'all .15s' },
  tabActive: { background: 'var(--bg2)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,.4)' },
  row:       { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  empty:     { textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 },
  spinner:   { width: 24, height: 24, border: '2px solid rgba(255,255,255,.1)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
};