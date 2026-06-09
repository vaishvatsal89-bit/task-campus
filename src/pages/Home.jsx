/*
  Home.jsx — UPDATED FOR PHASE 4
  ────────────────────────────────
  WHAT CHANGED FROM PHASE 3:
  - fetchTasks() calls Supabase instead of localStorage
  - useEffect runs on mount to load tasks from database
  - subscribeToTasks() listens for new tasks in real-time
    → when anyone posts a task, it appears for everyone instantly
  - loading state shows while database query runs
  - error state handles network failures
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTasks, subscribeToTasks } from '../api';
import TaskCard from '../components/TaskCard';

const CATEGORIES = ['All', 'Delivery', 'Study help', 'Errand', 'Tech help', 'Print job'];

export default function Home({ showToast }) {
  const navigate = useNavigate();

  const [tasks,        setTasks]        = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  /*
    Load tasks from Supabase when component mounts.
    Also set up realtime subscription so new tasks
    appear instantly without the user refreshing.
  */
  useEffect(() => {
    loadTasks();

    /*
      subscribeToTasks — listens for INSERT events
      on the tasks table. When anyone posts a task,
      this fires and we add it to the top of the list.

      PHASE 3: there was no realtime. Users had to
      refresh to see new tasks.
      PHASE 4: instant, automatic updates.
    */
    const unsubscribe = subscribeToTasks((newTask) => {
      setTasks(prev => [newTask, ...prev]);
      showToast('New task posted near you! 🔔', 'info');
    });

    /* Cleanup: unsubscribe when leaving this page */
    return () => unsubscribe();
  }, []);

  /* Re-fetch when filter changes */
  useEffect(() => {
    loadTasks();
  }, [activeFilter]);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(activeFilter);
      setTasks(data);
    } catch (err) {
      setError('Could not load tasks. Check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroBadge}>
          <span style={styles.dot} /> Campus-only · Verified students
        </div>
        <h1 style={styles.heroH1}>
          Get things done.<br />
          <span style={{ color: 'var(--purple2)' }}>Earn on campus.</span>
        </h1>
        <p style={styles.heroSub}>
          Post a task, someone nearby completes it. Earn money between classes doing quick tasks for fellow students.
        </p>
        <div style={styles.heroBtns}>
          <button className="btn btn-lg btn-primary" onClick={() => navigate('/post')}>
            Post a task
          </button>
          <a className="btn btn-lg btn-outline" href="#feed">Browse tasks</a>
        </div>
      </section>

      {/* STATS */}
      <div style={styles.statsStrip}>
        <div style={{ ...styles.statBox, borderRight: '1px solid var(--border)' }}>
          <div style={{ ...styles.statN, color: 'var(--green)' }}>
            {loading ? '—' : tasks.length}
          </div>
          <div style={styles.statL}>Open tasks</div>
        </div>
        <div style={{ ...styles.statBox, borderRight: '1px solid var(--border)' }}>
          <div style={{ ...styles.statN, color: 'var(--amber)' }}>₹150</div>
          <div style={styles.statL}>Avg payout</div>
        </div>
        <div style={styles.statBox}>
          <div style={{ ...styles.statN, color: 'var(--purple2)' }}>20 min</div>
          <div style={styles.statL}>Avg completion</div>
        </div>
      </div>

      {/* TASK FEED */}
      <section className="page-wrap" id="feed">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Open tasks near you</h2>
          <span style={styles.taskCount}>
            {loading ? 'Loading...' : `${tasks.length} tasks`}
          </span>
        </div>

        {/* Filter chips */}
        <div style={styles.filterRow}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={{ ...styles.chip, ...(activeFilter === cat ? styles.chipActive : {}) }}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* States: loading / error / empty / tasks */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={styles.spinner} />
          </div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">Could not load tasks</div>
            <div className="empty-sub">{error}</div>
            <button className="btn btn-md btn-primary" style={{ marginTop: 12 }} onClick={loadTasks}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No tasks right now</div>
            <div className="empty-sub">Be the first to post one!</div>
            <button className="btn btn-md btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/post')}>
              Post a task
            </button>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div style={styles.taskGrid}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const styles = {
  hero:      { textAlign:'center', padding:'80px 24px 64px', position:'relative', overflow:'hidden' },
  heroBg:    { position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,124,248,0.12) 0%, transparent 70%)', pointerEvents:'none' },
  heroBadge: { display:'inline-flex', alignItems:'center', gap:8, background:'var(--purple-bg)', border:'1px solid var(--purple-br)', borderRadius:20, padding:'7px 18px', fontSize:13, fontWeight:500, color:'var(--purple2)', marginBottom:24, position:'relative' },
  dot:       { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'var(--green)' },
  heroH1:    { fontSize:52, fontWeight:700, lineHeight:1.1, letterSpacing:'-0.03em', marginBottom:20, position:'relative' },
  heroSub:   { fontSize:17, color:'var(--text2)', lineHeight:1.65, maxWidth:480, margin:'0 auto 36px', position:'relative' },
  heroBtns:  { display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', position:'relative' },
  statsStrip:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg2)' },
  statBox:   { padding:'24px 20px', textAlign:'center' },
  statN:     { fontSize:28, fontWeight:700, fontFamily:'var(--mono)' },
  statL:     { fontSize:12, color:'var(--text3)', marginTop:4, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:500 },
  taskCount: { fontSize:13, color:'var(--text3)', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 14px' },
  filterRow: { display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' },
  chip:      { padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:500, border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontFamily:'var(--font)' },
  chipActive:{ background:'var(--purple)', color:'#fff', borderColor:'transparent', boxShadow:'0 2px 12px rgba(139,124,248,.35)' },
  taskGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 },
  spinner:   { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};