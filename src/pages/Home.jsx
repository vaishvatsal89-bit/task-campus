import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTasks, subscribeToTasks, fetchHomeStats, searchTasks } from '../api';
import TaskCard from '../components/TaskCard';

const CATEGORIES = [
  { label: 'All',        icon: '✦' },
  { label: 'Delivery',   icon: '🛵' },
  { label: 'Study help', icon: '📚' },
  { label: 'Errand',     icon: '🏃' },
  { label: 'Tech help',  icon: '💻' },
  { label: 'Print job',  icon: '🖨️' },
];

const STEPS = [
  { icon: '📝', n: '01', title: 'Post a task',     desc: 'Describe what you need, set a budget and deadline. Takes 30 seconds.' },
  { icon: '⚡', n: '02', title: 'Someone accepts', desc: 'A verified student on campus picks it up instantly.' },
  { icon: '🔒', n: '03', title: 'Pay after OTP',  desc: "Share a 4-digit code. Payment releases only after you confirm it's done." },
];

function CountUp({ to, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = null;
    const dur = 1400;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{prefix}{val.toLocaleString('en-IN')}{suffix}</>;
}

export default function Home({ showToast }) {
  const navigate = useNavigate();
  const [tasks,        setTasks]        = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [stats,        setStats]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');

  useEffect(() => {
    loadTasks();
    fetchHomeStats().then(setStats).catch(() => {});
    const unsub = subscribeToTasks((t) => {
      setTasks(prev => [t, ...prev]);
      showToast('New task posted near you! 🔔', 'info');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) loadTasks();
  }, [activeFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) { loadTasks(); return; }
      setLoading(true); setError(null);
      try   { setTasks(await searchTasks(searchQuery.trim(), activeFilter)); }
      catch { setError('Search failed. Try again.'); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  async function loadTasks() {
    setLoading(true); setError(null);
    try   { setTasks(await fetchTasks(activeFilter)); }
    catch { setError('Could not load tasks. Check your connection.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @keyframes fsu { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fi  { from{opacity:0} to{opacity:1} }
        @keyframes flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes pdot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }
        .how-card:hover { transform:translateY(-5px)!important; border-color:var(--purple-br)!important; box-shadow:0 16px 40px rgba(139,124,248,.12)!important; }
        .cat-chip:hover { background:rgba(139,124,248,.1)!important; color:var(--text)!important; }
        @media(max-width:640px){ .how-grid{grid-template-columns:1fr!important} .stats-strip{grid-template-columns:1fr!important} }
      `}</style>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroBg}/>
        <div style={S.orb1}/><div style={S.orb2}/>
        <div style={{...S.badge, animation:'fsu .5s ease both'}}>
          <span style={S.dot}/> Campus-only · Verified students
        </div>
        <h1 style={{...S.h1, animation:'fsu .55s ease .08s both'}}>
          Get things done.<br/>
          <span style={{color:'var(--purple2)'}}>Earn on campus.</span>
        </h1>
        <p style={{...S.sub, animation:'fsu .55s ease .16s both'}}>
          Post a task, someone nearby completes it. Earn money between classes doing quick tasks for fellow students.
        </p>
        <div style={{...S.btns, animation:'fsu .55s ease .24s both'}}>
          <button className="btn btn-lg btn-primary" onClick={()=>navigate('/post')}
            style={{boxShadow:'0 4px 20px rgba(139,124,248,.45)'}}>
            Post a task
          </button>
          <a className="btn btn-lg btn-outline" href="#feed">Browse tasks</a>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip" style={{...S.statsStrip, animation:'fi .7s ease .3s both'}}>
        {[
          {label:'Students joined',  color:'var(--purple2)', val:stats?.students,     pre:'',  suf:'+'},
          {label:'Tasks completed',  color:'var(--green)',   val:stats?.completed,    pre:'',  suf:'' },
          {label:'Paid to students', color:'var(--amber)',   val:stats?.totalEarned,  pre:'₹', suf:'' },
        ].map((s,i)=>(
          <div key={i} style={{...S.statBox, borderRight: i<2 ? '1px solid var(--border)' : 'none'}}>
            <div style={{...S.statN, color:s.color}}>
              {stats ? <CountUp to={s.val} prefix={s.pre} suffix={s.suf}/> : '—'}
            </div>
            <div style={S.statL}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={S.howWrap}>
        <div style={{textAlign:'center', marginBottom:44}}>
          <div style={S.howEyebrow}>How it works</div>
          <h2 style={S.howH2}>Three steps. That's it.</h2>
        </div>
        <div className="how-grid" style={S.howGrid}>
          {STEPS.map((step,i)=>(
            <div key={i} className="how-card" style={{
              ...S.howCard,
              animation:`fsu .55s ease ${.1+i*.12}s both`,
              transition:'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
            }}>
              <div style={S.howNum}>{step.n}</div>
              <div style={{fontSize:34, marginBottom:14, display:'inline-block', animation:`flt ${3+i*.4}s ease-in-out infinite`}}>
                {step.icon}
              </div>
              <h3 style={S.howCardH}>{step.title}</h3>
              <p  style={S.howCardP}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TASK FEED */}
      <section className="page-wrap" id="feed" style={{animation:'fi .6s ease .4s both'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <h2 style={{fontSize:20, fontWeight:600}}>Open tasks near you</h2>
          <span style={S.taskCount}>
            {loading ? 'Loading…' : `${tasks.length} task${tasks.length!==1?'s':''}`}
          </span>
        </div>

        {/* Search */}
        <div style={S.searchWrap}>
          <svg style={S.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="inp" style={S.searchInp}
            placeholder="Search tasks — delivery, notes, print..."
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={()=>setSearchQuery('')}
              style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>
              ×
            </button>
          )}
        </div>

        {searchQuery && !loading && (
          <div style={{fontSize:13,color:'var(--text3)',marginBottom:16}}>
            {tasks.length===0
              ? `No tasks found for "${searchQuery}"`
              : `${tasks.length} result${tasks.length!==1?'s':''} for "${searchQuery}"`}
          </div>
        )}

        {/* Category chips */}
        <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          {CATEGORIES.map(({label,icon})=>(
            <button key={label} className="cat-chip"
              onClick={()=>setActiveFilter(label)}
              style={{...S.chip,...(activeFilter===label?S.chipOn:{}),transition:'all .15s ease'}}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
            <div style={S.spinner}/>
          </div>
        )}
        {!loading && error && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">Could not load tasks</div>
            <div className="empty-sub">{error}</div>
            <button className="btn btn-md btn-primary" style={{marginTop:12}} onClick={loadTasks}>Try again</button>
          </div>
        )}
        {!loading && !error && tasks.length===0 && (
          <div className="empty-state" style={{animation:'fsu .5s ease both'}}>
            <div className="empty-icon" style={{animation:'flt 3s ease-in-out infinite'}}>📭</div>
            <div className="empty-title">{searchQuery ? `No results for "${searchQuery}"` : 'No tasks right now'}</div>
            <div className="empty-sub">{searchQuery ? 'Try a different keyword' : 'Be the first to post one!'}</div>
            {!searchQuery && (
              <button className="btn btn-md btn-primary" style={{marginTop:12}} onClick={()=>navigate('/post')}>Post a task</button>
            )}
          </div>
        )}
        {!loading && !error && tasks.length>0 && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {tasks.map((task,i)=>(
              <div key={task.id} style={{animation:`fsu .45s ease ${Math.min(i*.06,.4)}s both`}}>
                <TaskCard task={task}/>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const S = {
  hero:       {textAlign:'center',padding:'92px 24px 72px',position:'relative',overflow:'hidden'},
  heroBg:     {position:'absolute',inset:0,background:'radial-gradient(ellipse 110% 65% at 50% 0%, rgba(139,124,248,.13) 0%, transparent 65%)',pointerEvents:'none'},
  orb1:       {position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(139,124,248,.07) 0%, transparent 70%)',top:-160,left:'10%',pointerEvents:'none'},
  orb2:       {position:'absolute',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle, rgba(96,165,250,.05) 0%, transparent 70%)',bottom:-80,right:'8%',pointerEvents:'none'},
  badge:      {display:'inline-flex',alignItems:'center',gap:8,background:'var(--purple-bg)',border:'1px solid var(--purple-br)',borderRadius:20,padding:'7px 18px',fontSize:13,fontWeight:500,color:'var(--purple2)',marginBottom:24,position:'relative'},
  dot:        {display:'inline-block',width:7,height:7,borderRadius:'50%',background:'var(--green)',animation:'pdot 2s ease-in-out infinite'},
  h1:         {fontSize:'clamp(34px,6vw,58px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-.03em',marginBottom:20,position:'relative'},
  sub:        {fontSize:17,color:'var(--text2)',lineHeight:1.65,maxWidth:480,margin:'0 auto 36px',position:'relative'},
  btns:       {display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',position:'relative'},
  statsStrip: {display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',background:'var(--bg2)'},
  statBox:    {padding:'28px 20px',textAlign:'center'},
  statN:      {fontSize:30,fontWeight:700,fontFamily:'var(--mono)'},
  statL:      {fontSize:11,color:'var(--text3)',marginTop:5,textTransform:'uppercase',letterSpacing:'.07em',fontWeight:600},
  howWrap:    {padding:'72px 24px',maxWidth:860,margin:'0 auto'},
  howEyebrow: {display:'inline-block',background:'var(--purple-bg)',border:'1px solid var(--purple-br)',borderRadius:20,padding:'5px 16px',fontSize:11,fontWeight:700,color:'var(--purple2)',textTransform:'uppercase',letterSpacing:'.09em',marginBottom:14},
  howH2:      {fontSize:'clamp(22px,4vw,30px)',fontWeight:700,letterSpacing:'-.02em'},
  howGrid:    {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18},
  howCard:    {background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:16,padding:'28px 22px',textAlign:'center',position:'relative',cursor:'default'},
  howNum:     {position:'absolute',top:14,left:18,fontSize:11,fontWeight:700,color:'var(--purple)',fontFamily:'var(--mono)',opacity:.5,letterSpacing:'.05em'},
  howCardH:   {fontSize:15,fontWeight:700,marginBottom:8},
  howCardP:   {fontSize:13,color:'var(--text2)',lineHeight:1.65},
  taskCount:  {fontSize:13,color:'var(--text3)',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:20,padding:'4px 14px'},
  searchWrap: {position:'relative',marginBottom:16},
  searchIcon: {position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',width:16,height:16,color:'var(--text3)',pointerEvents:'none',zIndex:1},
  searchInp:  {paddingLeft:42,paddingRight:36},
  chip:       {padding:'7px 16px',borderRadius:20,fontSize:13,fontWeight:500,border:'1px solid var(--border2)',background:'transparent',color:'var(--text2)',cursor:'pointer',fontFamily:'var(--font)',display:'flex',alignItems:'center',gap:6},
  chipOn:     {background:'var(--purple)',color:'#fff',borderColor:'transparent',boxShadow:'0 2px 12px rgba(139,124,248,.35)'},
  spinner:    {width:28,height:28,border:'2px solid rgba(255,255,255,.1)',borderTopColor:'var(--purple)',borderRadius:'50%',animation:'spin .7s linear infinite'},
};