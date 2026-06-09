/*
  Post.jsx — UPDATED FOR PHASE 4
  ─────────────────────────────────
  WHAT CHANGED FROM PHASE 3:
  - useAuth() to get logged-in user (no more getUser() from storage)
  - createTask() calls Supabase INSERT instead of localStorage
  - Task gets a real UUID from the database, not a fake generated one
  - poster_id is the real Supabase user ID (uuid)
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTask } from '../api';

const CATEGORIES = ['Delivery', 'Study help', 'Errand', 'Tech help', 'Print job', 'Other'];

export default function Post({ showToast }) {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState('Delivery');
  const [deadline, setDeadline] = useState('');
  const [amount,   setAmount]   = useState('');
  const [location, setLocation] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const amtNum = parseInt(amount) || 0;
  const fee    = Math.round(amtNum * 0.2);
  const earn   = amtNum - fee;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isLoggedIn) {
      showToast('Please login first', 'error');
      navigate('/login');
      return;
    }

    const errs = {};
    if (!title.trim())          errs.title  = 'Title is required';
    if (!desc.trim())           errs.desc   = 'Description is required';
    if (!amtNum || amtNum < 30) errs.amount = 'Minimum ₹30';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);

    const initials = (profile?.name || user.email)
      .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

    try {
      /*
        createTask() calls Supabase INSERT.
        poster_id is user.id — the real UUID from Supabase Auth.
        The database generates the task UUID automatically.
        Realtime subscription on Home page fires instantly
        so other students see this task without refreshing.
      */
      await createTask({
        title:           title.trim(),
        description:     desc.trim() + (location ? ` | Location: ${location}` : ''),
        category,
        amount:          amtNum,
        deadline:        deadline || '1 hr',
        poster_id:       user.id,
        poster_name:     profile?.name || user.email,
        poster_initials: initials,
        poster_rating:   profile?.rating || 5.0,
      });

      showToast('Task posted! Students are being notified.', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Failed to post task', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div style={{ fontSize:13, color:'var(--text3)', cursor:'pointer', marginBottom:24, display:'inline-flex', alignItems:'center', gap:6 }}
        onClick={() => navigate('/')}>
        ← Back to browse
      </div>

      <h1 style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>Post a task</h1>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:32 }}>Be specific. More detail = faster acceptance.</p>

      <div style={styles.layout}>
        <form onSubmit={handleSubmit} style={styles.formCard}>

          <div className="form-group">
            <label className="form-label">Task title *</label>
            <input className={`inp ${errors.title ? 'error':''}`}
              placeholder="e.g. Deliver my notes to Block C Room 214"
              value={title} maxLength={80}
              onChange={e => { setTitle(e.target.value); setErrors({}); }} />
            {errors.title && <span style={styles.err}>{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className={`inp ${errors.desc ? 'error':''}`}
              placeholder="Exact location, what needs to happen, any special instructions..."
              value={desc}
              onChange={e => { setDesc(e.target.value); setErrors({}); }} />
            {errors.desc && <span style={styles.err}>{errors.desc}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="inp" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="inp" placeholder="e.g. 30 min" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount you'll pay (₹) *</label>
            <input className={`inp ${errors.amount ? 'error':''}`} type="number" min="30" max="5000"
              placeholder="150" value={amount}
              onChange={e => { setAmount(e.target.value); setErrors({}); }} />
            {errors.amount && <span style={styles.err}>{errors.amount}</span>}
            <span style={{ fontSize:11, color:'var(--text3)' }}>Fair pay = faster acceptance.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Location / pickup point</label>
            <input className="inp" placeholder="e.g. Block A Room 101" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <button className="btn btn-lg btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post task →'}
          </button>
        </form>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.calcCard}>
            <h3 style={{ fontSize:15, fontWeight:600, marginBottom:20 }}>Price breakdown</h3>
            <div style={styles.calcRow}>
              <span style={{ color:'var(--text2)' }}>You pay</span>
              <span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{amtNum ? `₹${amtNum}` : '₹—'}</span>
            </div>
            <div style={styles.calcRow}>
              <span style={{ color:'var(--text2)' }}>Platform (20%)</span>
              <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--red)' }}>{amtNum ? `-₹${fee}` : '—'}</span>
            </div>
            <div style={styles.calcTotal}>
              <span style={{ fontWeight:600 }}>Doer earns</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:700, color:'var(--green)' }}>{amtNum ? `₹${earn}` : '₹—'}</span>
            </div>
          </div>

          <div style={styles.tipsCard}>
            <h4 style={{ fontSize:11, fontWeight:600, color:'var(--purple2)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>Tips</h4>
            {['Include exact room numbers.','Realistic deadline = faster acceptance.','Better pay = picked up in under 5 min.'].map((t,i) => (
              <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                <span style={{ color:'var(--purple)', flexShrink:0 }}>→</span>
                <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:   { display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' },
  formCard: { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r3)', padding:28, display:'flex', flexDirection:'column', gap:18 },
  sidebar:  { display:'flex', flexDirection:'column', gap:14, position:'sticky', top:80 },
  calcCard: { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:22 },
  calcRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, padding:'10px 0', borderBottom:'1px solid var(--border)' },
  calcTotal:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:'1px solid var(--border2)' },
  tipsCard: { background:'var(--purple-bg)', border:'1px solid var(--purple-br)', borderRadius:'var(--r2)', padding:16 },
  err:      { fontSize:11, color:'var(--red)', marginTop:2 },
};