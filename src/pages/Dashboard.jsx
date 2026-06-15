import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWalletData, requestWithdrawal } from '../api';
import { useWindowWidth } from '../hooks/useWindowWidth';

export default function Dashboard({ showToast }) {
  const navigate  = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();

  const [walletBalance,  setWalletBalance]  = useState(0);
  const [totalEarned,    setTotalEarned]    = useState(0);
  const [rating,         setRating]         = useState(5.0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [withdrawals,    setWithdrawals]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [withdrawAmt,    setWithdrawAmt]    = useState('');
  const [withdrawing,    setWithdrawing]    = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadData();
  }, [isLoggedIn, user]);

  async function loadData() {
    setLoading(true);
    try {
      const d = await fetchWalletData(user.id);
      setWalletBalance(d.walletBalance);
      setRating(d.rating);
      setCompletedTasks(d.completedTasks);
      setWithdrawals(d.withdrawals);
      setTotalEarned(d.completedTasks.reduce((s, t) => s + Math.round(t.amount * 0.8), 0));
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmt);
    if (!amount || amount < 50)          { showToast('Minimum withdrawal is ₹50', 'error'); return; }
    if (amount > walletBalance)          { showToast('Insufficient balance', 'error'); return; }
    if (!profile?.upi_id)                { showToast('No UPI ID on your profile', 'error'); return; }

    setWithdrawing(true);
    try {
      const result = await requestWithdrawal(user.id, amount, profile.upi_id);
      if (result.success) {
        showToast(`₹${amount} requested! Transfer within 24h to ${profile.upi_id}`, 'success', 5000);
        setWithdrawAmt('');
        loadData();
      } else {
        showToast(result.message || 'Withdrawal failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setWithdrawing(false);
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

  if (loading) {
    return (
      <div className="page-wrap" style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const pendingAmt = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0);
  const quickAmts  = [100, 250, 500].filter(a => a <= walletBalance);
  const isMobile = useWindowWidth() < 640;

  return (
    <div className="page-wrap">

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Wallet & Earnings</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>
          {profile?.name} · ⭐ {rating} rating · {completedTasks.length} tasks completed
        </p>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 28 }}>

        <div style={{ ...styles.statCard, borderColor:'var(--green-br)', background:'var(--green-bg)' }}>
          <div style={styles.statLabel}>Wallet Balance</div>
          <div style={{ ...styles.statVal, color:'var(--green)' }}>₹{walletBalance}</div>
          <div style={styles.statSub}>Available to withdraw</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Earned</div>
          <div style={styles.statVal}>₹{totalEarned}</div>
          <div style={styles.statSub}>All time</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Your Rating</div>
          <div style={{ ...styles.statVal, color:'var(--amber)' }}>⭐ {rating}</div>
          <div style={styles.statSub}>From completed tasks</div>
        </div>

      </div>

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {/* LEFT col */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Withdraw card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Withdraw to UPI</h3>
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
              Transfers to <strong>{profile?.upi_id || '—'}</strong> manually within 24 hours.
            </p>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Amount (₹)</label>
              <input
                className="inp"
                type="number"
                min="50"
                max={walletBalance}
                placeholder="Min ₹50"
                value={withdrawAmt}
                onChange={e => setWithdrawAmt(e.target.value)}
              />
              <span style={{ fontSize:11, color:'var(--text3)' }}>
                Available: ₹{walletBalance}
                {pendingAmt > 0 && ` · ₹${pendingAmt} pending`}
              </span>
            </div>

            {/* Quick amounts */}
            {quickAmts.length > 0 && (
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {quickAmts.map(a => (
                  <button key={a} type="button"
                    onClick={() => setWithdrawAmt(String(a))}
                    style={{
                      ...styles.presetBtn,
                      ...(withdrawAmt === String(a) ? styles.presetBtnActive : {}),
                    }}>
                    ₹{a}
                  </button>
                ))}
                <button type="button"
                  onClick={() => setWithdrawAmt(String(walletBalance))}
                  style={{
                    ...styles.presetBtn,
                    ...(withdrawAmt === String(walletBalance) ? styles.presetBtnActive : {}),
                  }}>
                  All ₹{walletBalance}
                </button>
              </div>
            )}

            <button
              className="btn btn-lg btn-primary btn-full"
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmt || parseInt(withdrawAmt) > walletBalance || parseInt(withdrawAmt) < 50}
            >
              {withdrawing ? 'Requesting…' : 'Request Withdrawal →'}
            </button>

            {!profile?.upi_id && (
              <p style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>
                ⚠ No UPI ID on your profile. Add it to withdraw.
              </p>
            )}
          </div>

          {/* Withdrawal history */}
          {withdrawals.length > 0 && (
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, marginBottom:16 }}>Withdrawal History</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {withdrawals.map(w => (
                  <div key={w.id} style={styles.row}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>₹{w.amount}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>
                        {w.upi_id} · {new Date(w.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                      </div>
                    </div>
                    <span className="badge" style={badgeStyle(w.status)}>
                      {w.status === 'paid' ? '✓ Paid' : w.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT col */}
        <div style={styles.card}>
          <h3 style={{ ...styles.cardTitle, marginBottom:16 }}>Earnings History</h3>

          {completedTasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
              No completed tasks yet.<br />
              <span style={{ fontSize:12 }}>Accept a task to start earning.</span>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {completedTasks.map(task => (
                <div key={task.id} style={{ ...styles.row, cursor:'pointer' }}
                  onClick={() => navigate(`/task/${task.id}`)}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>
                      {task.poster_name} · {new Date(task.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:700, color:'var(--green)' }}>
                      +₹{Math.round(task.amount * 0.8)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>₹{task.amount} task</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function badgeStyle(status) {
  if (status === 'paid')     return { background:'var(--green-bg)',          color:'var(--green)',  border:'1px solid var(--green-br)' };
  if (status === 'rejected') return { background:'rgba(220,38,38,.1)',       color:'#f87171',       border:'1px solid rgba(220,38,38,.3)' };
  return                            { background:'rgba(245,158,11,.1)',       color:'#fbbf24',       border:'1px solid rgba(245,158,11,.25)' };
}

const styles = {
  layout:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' },
  statCard:      { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'20px 22px' },
  statLabel:     { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text3)', marginBottom:8 },
  statVal:       { fontSize:34, fontWeight:700, fontFamily:'var(--mono)', color:'var(--text)' },
  statSub:       { fontSize:12, color:'var(--text3)', marginTop:4 },
  card:          { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r3)', padding:24 },
  cardTitle:     { fontSize:16, fontWeight:700, marginBottom:6 },
  row:           { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' },
  presetBtn:     { padding:'6px 14px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text2)', fontSize:13, cursor:'pointer', fontWeight:400, transition:'all .15s' },
  presetBtnActive: { border:'1.5px solid var(--purple)', background:'var(--purple-bg)', color:'var(--purple)', fontWeight:600 },
  spinner:       { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};