import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats, fetchPendingWithdrawals,
  fetchBannedUsers, adminUpdateWithdrawal, adminUnbanUser
} from '../api';

export default function Admin({ showToast }) {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();
  const [tab,          setTab]          = useState('overview');
  const [stats,        setStats]        = useState(null);
  const [withdrawals,  setWithdrawals]  = useState([]);
  const [bannedUsers,  setBannedUsers]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [acting,       setActing]       = useState(null);

  const isAdmin = isLoggedIn && profile?.is_admin === true;
  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, w, b] = await Promise.all([
        fetchAdminStats(user.id),
        fetchPendingWithdrawals(),
        fetchBannedUsers(),
      ]);
      setStats(s);
      setWithdrawals(w);
      setBannedUsers(b);
    } catch {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawal(id, status) {
    setActing(id);
    try {
      const result = await adminUpdateWithdrawal(id, status,user.id);
      if (result.success) {
        showToast(status === 'paid' ? '✓ Marked as paid' : '✕ Rejected & refunded', 'success');
        setWithdrawals(prev => prev.filter(w => w.id !== id));
        loadAll();
      }
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setActing(null);
    }
  }

  async function handleUnban(userId, name) {
    setActing(userId);
    try {
      const result = await adminUnbanUser(userId,user.id);
      if (result.success) {
        showToast(`${name} unbanned`, 'success');
        setBannedUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setActing(null);
    }
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Access denied</div>
          <button className="btn btn-md btn-primary" style={{ marginTop:12 }} onClick={() => navigate('/')}>
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:700, marginBottom:4 }}>Admin Panel</h1>
          <p style={{ fontSize:13, color:'var(--text3)' }}>TaskCampus · {user?.email}</p>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={loadAll}>↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {[
          { key:'overview',    label:'📊 Overview' },
          { key:'withdrawals', label:`💸 Withdrawals ${withdrawals.length > 0 ? `(${withdrawals.length})` : ''}` },
          { key:'users',       label:`⚠️ Banned Users ${bannedUsers.length > 0 ? `(${bannedUsers.length})` : ''}` },
        ].map(t => (
          <button key={t.key}
            style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
          <div style={S.spinner} />
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && stats && (
            <div>
              <div className="grid-3" style={{ marginBottom:20 }}>
                {[
                  { label:'Total Students', val: stats.total_users,     color:'var(--purple2)' },
                  { label:'Total Tasks',    val: stats.total_tasks,     color:'var(--text)'    },
                  { label:'Open Tasks',     val: stats.open_tasks,      color:'var(--amber)'   },
                  { label:'Completed',      val: stats.completed_tasks, color:'var(--green)'   },
                  { label:'Total Paid Out', val: `₹${stats.total_paid_out}`, color:'var(--green)' },
                  { label:'Pending Withdrawals', val: `${stats.pending_withdrawals} · ₹${stats.pending_amount}`, color:'var(--red, #ef4444)' },
                ].map((s, i) => (
                  <div key={i} style={S.statCard}>
                    <div style={S.statLabel}>{s.label}</div>
                    <div style={{ ...S.statVal, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {withdrawals.length > 0 && (
                <div style={{ ...S.card, background:'rgba(245,158,11,.05)', border:'1px solid rgba(245,158,11,.2)' }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#fbbf24', marginBottom:4 }}>
                    ⏳ {withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''} waiting
                  </div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>
                    Total pending: ₹{stats.pending_amount} — go to Withdrawals tab to process
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WITHDRAWALS */}
          {tab === 'withdrawals' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {withdrawals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-title">All withdrawals processed</div>
                </div>
              ) : withdrawals.map(w => (
                <div key={w.id} style={S.card}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>₹{w.amount}</div>
                      <div style={{ fontSize:13, color:'var(--text2)', marginBottom:2 }}>
                        {w.profiles?.name} · {w.profiles?.email}
                      </div>
                      <div style={{ fontSize:12, color:'var(--purple2)', fontWeight:600 }}>
                        → {w.upi_id}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                        Requested {new Date(w.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        className="btn btn-md"
                        style={{ background:'rgba(16,185,129,.15)', color:'var(--green)', border:'1px solid rgba(16,185,129,.3)' }}
                        disabled={acting === w.id}
                        onClick={() => handleWithdrawal(w.id, 'paid')}
                      >
                        {acting === w.id ? '...' : '✓ Mark Paid'}
                      </button>
                      <button
                        className="btn btn-md"
                        style={{ background:'rgba(239,68,68,.1)', color:'#f87171', border:'1px solid rgba(239,68,68,.3)' }}
                        disabled={acting === w.id}
                        onClick={() => handleWithdrawal(w.id, 'rejected')}
                      >
                        {acting === w.id ? '...' : '✕ Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BANNED USERS */}
          {tab === 'users' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {bannedUsers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-title">No banned users</div>
                </div>
              ) : bannedUsers.map(u => (
                <div key={u.id} style={S.card}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{u.name}</div>
                      <div style={{ fontSize:13, color:'var(--text3)', marginBottom:4 }}>{u.email}</div>
                      <div style={{ fontSize:12, color:'#f87171' }}>
                        ⚠️ {u.warning_count} warnings · Banned until{' '}
                        {new Date(u.banned_until).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </div>
                    </div>
                    <button
                      className="btn btn-md btn-primary"
                      disabled={acting === u.id}
                      onClick={() => handleUnban(u.id, u.name)}
                    >
                      {acting === u.id ? 'Unbanning...' : 'Unban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const S = {
  tabBar:    { display:'flex', gap:6, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:5, marginBottom:24, width:'fit-content', flexWrap:'wrap' },
  tab:       { padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:'transparent', color:'var(--text2)', fontFamily:'var(--font)', transition:'all .15s' },
  tabActive: { background:'var(--bg2)', color:'var(--text)', boxShadow:'0 1px 4px rgba(0,0,0,.4)' },
  statCard:  { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'18px 20px' },
  statLabel: { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text3)', marginBottom:8 },
  statVal:   { fontSize:26, fontWeight:700, fontFamily:'var(--mono)' },
  card:      { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:20 },
  spinner:   { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};