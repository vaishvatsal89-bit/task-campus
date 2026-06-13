/*
  MyTasks.jsx — UPDATED FOR PHASE 4
  ────────────────────────────────────
  WHAT CHANGED FROM PHASE 3:
  - useAuth() to get logged-in user
  - fetchMyTasks() loads from Supabase instead of localStorage
  - useEffect loads data when component mounts
  - loading and error states added
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyTasks } from '../api';

const STATUS_CONFIG = {
  open:      { label:'Open',        cls:'badge-open',   amtColor:'var(--text)'    },
  accepted:  { label:'In progress', cls:'badge-active', amtColor:'var(--purple2)' },
  completed: { label:'Completed',   cls:'badge-done',   amtColor:'var(--green)'   },
  cancelled: { label:'Cancelled',   cls:'badge-gray',   amtColor:'var(--text3)'   },
  expired:   { label:'Expired',     cls:'badge-gray',   amtColor:'var(--text3)'   },
};

const CAT_META = {
  'Delivery':   { icon:'🛵', bg:'rgba(139,124,248,.12)' },
  'Study help': { icon:'📚', bg:'rgba(96,165,250,.1)'   },
  'Errand':     { icon:'🏃', bg:'rgba(251,191,36,.1)'   },
  'Print job':  { icon:'🖨️', bg:'rgba(45,212,191,.1)'   },
  'Tech help':  { icon:'💻', bg:'rgba(74,222,128,.1)'   },
  'Other':      { icon:'📋', bg:'rgba(148,163,184,.1)'  },
};

export default function MyTasks({ showToast }) {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();

  const [tab,     setTab]     = useState('doing');
  const [doing,   setDoing]   = useState([]);
  const [posted,  setPosted]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadMyTasks();
  }, [isLoggedIn, user]);

  async function loadMyTasks() {
    setLoading(true);
    try {
      const { doing: d, posted: p } = await fetchMyTasks(user.id);
      setDoing(d);
      setPosted(p);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">You're not logged in</div>
          <button className="btn btn-md btn-primary" style={{ marginTop:12 }} onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    );
  }

  const tasks    = tab === 'doing' ? doing : posted;
  const earned   = doing.filter(t => t.status === 'completed').reduce((s,t) => s + Math.round(t.amount * 0.8), 0);

  const order = { accepted:0, open:1, completed:2, cancelled:3 };
  const sorted = [...tasks].sort((a,b) => (order[a.status]??9) - (order[b.status]??9));

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:700 }}>My Tasks</h1>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/post')}>+ Post new</button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom:32 }}>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--green)' }}>₹{earned}</div>
          <div className="stat-lbl">Total earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--purple2)' }}>{doing.length}</div>
          <div className="stat-lbl">Tasks done</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--amber)' }}>{posted.length}</div>
          <div className="stat-lbl">Tasks posted</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[{key:'doing',label:"Tasks I'm doing"},{key:'posted',label:'Tasks I posted'}].map(t => (
          <button key={t.key}
            style={{ ...styles.tabBtn, ...(tab===t.key ? styles.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
          <div style={styles.spinner} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab==='doing' ? '🎯' : '📋'}</div>
          <div className="empty-title">{tab==='doing' ? 'No tasks accepted yet' : 'No tasks posted yet'}</div>
          <button className="btn btn-md btn-primary" style={{ marginTop:12 }}
            onClick={() => navigate(tab==='doing' ? '/' : '/post')}>
            {tab==='doing' ? 'Browse tasks' : 'Post a task'}
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {sorted.map(task => (
            <MyTaskCard key={task.id} task={task} tab={tab} userId={user?.id} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyTaskCard({ task, tab, userId, navigate }) {
  const earn   = Math.round(task.amount * 0.8);
  const isDoing = task.doer_id === userId;
  const sc      = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
  const cm      = CAT_META[task.category] || CAT_META['Other'];

  const amtDisplay = isDoing && task.status === 'completed' ? `+₹${earn}` : `₹${task.amount}`;
  const amtColor   = isDoing && task.status === 'completed' ? 'var(--green)' : sc.amtColor;

  const subText = tab === 'posted'
    ? task.status === 'accepted'  ? `Being done by ${task.doer_name}`
    : task.status === 'completed' ? `Done by ${task.doer_name}`
    : 'Waiting for someone to accept'
    : `Posted by ${task.poster_name}`;

  return (
    <div style={styles.card} onClick={() => navigate(`/task/${task.id}`)}>
      <div style={{ ...styles.icon, background:cm.bg }}>{cm.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:3 }}>{task.title}</div>
        <div style={{ fontSize:12, color:'var(--text2)' }}>{subText}</div>
        {task.status === 'accepted' && (
          <div style={{ marginTop:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:5 }}>
              <span>In progress</span><span>Enter OTP when done</span>
            </div>
            <div style={{ height:4, borderRadius:2, background:'var(--bg4)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg, var(--purple), var(--purple2))', width:'55%' }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
        <span className={`badge ${sc.cls}`}>{sc.label}</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:700, color:amtColor }}>{amtDisplay}</span>
      </div>
    </div>
  );
}

const styles = {
  tabBar:   { display:'flex', gap:6, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:5, marginBottom:24, width:'fit-content' },
  tabBtn:   { padding:'8px 22px', borderRadius:12, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', background:'transparent', color:'var(--text2)', fontFamily:'var(--font)', transition:'all .15s' },
  tabActive:{ background:'var(--bg2)', color:'var(--text)', boxShadow:'0 1px 4px rgba(0,0,0,.4)' },
  card:     { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:18, display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'all .2s' },
  icon:     { width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  spinner:  { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};