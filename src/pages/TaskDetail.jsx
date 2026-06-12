/*
  TaskDetail.jsx — UPDATED FOR PHASE 4
  ───────────────────────────────────────
  WHAT CHANGED FROM PHASE 3:
  - fetchTaskById() loads from Supabase database
  - acceptTask() calls the SQL function (race-condition safe)
  - verifyOtp() checks OTP stored in database
  - subscribeToTask() shows real-time status changes to BOTH users:
    when doer accepts, poster's page updates instantly
    when OTP is verified, both pages update instantly
  - useAuth() for current user instead of getUser()
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTaskById, acceptTask, verifyOtp, cancelTask, subscribeToTask, submitRating, checkIfRated } from '../api';
export default function TaskDetail({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();

  const [task,    setTask]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);
  const [otp,     setOtp]     = useState('');
  const [otpErr,  setOtpErr]  = useState(false);
  const [rating,  setRating]  = useState(0);
  const [done,    setDone]    = useState(false);
  const [hasRated, setHasRated] = useState(false);
  /* Load task on mount */
  useEffect(() => {
  loadTask();
}, [id]);

useEffect(() => {
  if (task?.status === 'completed') {
    checkIfRated(task.id).then(setHasRated);
  }
}, [task?.status]);

  /* Subscribe to real-time changes on this specific task */
  useEffect(() => {
    if (!task) return;
    /*
      When anyone updates this task row in Supabase,
      both the poster AND the doer see it instantly.
      e.g. poster sees "Accepted by Rahul" immediately.
    */
    const unsubscribe = subscribeToTask(id, (updated) => {
      setTask(updated);
    });
    return () => unsubscribe();
  }, [task?.id]);

  async function loadTask() {
    try {
      const data = await fetchTaskById(id);
      setTask(data);
    } catch {
      showToast('Task not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-wrap" style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!task) return null;

  const earn      = Math.round(task.amount * 0.8);
  const isMyPost  = isLoggedIn && task.poster_id  === user?.id;
  const isMyTask  = isLoggedIn && task.doer_id    === user?.id;

  const statusMap = {
    open:      { label:'Open',        cls:'badge-open'   },
    accepted:  { label:'In progress', cls:'badge-active' },
    completed: { label:'Completed',   cls:'badge-done'   },
    cancelled: { label:'Cancelled',   cls:'badge-gray'   },
  };
  const sb = statusMap[task.status] || statusMap.open;

  async function handleRatingSubmit() {
  if (!rating) { showToast('Pick a star rating first', 'error'); return; }
  try {
    await submitRating(task.id, user.id, task.doer_id, rating);
    setHasRated(true);
    showToast(`Rated ${task.doer_name} ⭐`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to submit rating', 'error');
  }
}

  /* Accept task */
  async function handleAccept() {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (isMyPost) { showToast("Can't accept your own task!", 'error'); return; }
    setActing(true);
    try {
      const result = await acceptTask(id, user.id, profile?.name || user.email);
      if (result.success) {
        showToast('Task accepted! 🎉', 'success');
        loadTask(); // refresh to get updated status
      } else {
        showToast(result.message || 'Task already taken', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to accept', 'error');
    } finally {
      setActing(false);
    }
  }

  /* Cancel task (poster only) */
  async function handleCancel() {
    if (!window.confirm('Cancel and delete this task?')) return;
    try {
      await cancelTask(id);
      showToast('Task cancelled', 'info');
      navigate('/');
    } catch (err) {
      showToast('Failed to cancel', 'error');
    }
  }

  /* OTP entry */
  function otpKey(digit) {
    if (otp.length >= 4) return;
    const next = otp + digit;
    setOtp(next);
    setOtpErr(false);
    if (next.length === 4) {
      setTimeout(() => checkOtp(next), 200);
    }
  }

  function otpDel() { setOtp(otp.slice(0,-1)); setOtpErr(false); }

  /* Verify OTP with database */
  async function checkOtp(entered) {
    try {
      const result = await verifyOtp(id, entered);
      if (result.success) {
        setDone(true);
        showToast(`OTP verified! ₹${result.earn} credited 🎉`, 'success', 4000);
        loadTask();
      } else {
        setOtpErr(true);
        showToast('Wrong OTP. Try again.', 'error');
        setTimeout(() => { setOtp(''); setOtpErr(false); }, 800);
      }
    } catch (err) {
      showToast(err.message || 'OTP check failed', 'error');
      setOtp('');
    }
  }

  return (
    <div className="page-wrap">
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to tasks</div>

      <div style={styles.layout}>
        {/* MAIN */}
        <div style={styles.main}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span className={`badge ${sb.cls}`}>{sb.label}</span>
            <div style={{ fontFamily:'var(--mono)', fontSize:26, fontWeight:700, color:'var(--green)' }}>₹{task.amount}</div>
          </div>

          <h1 style={{ fontSize:22, fontWeight:700, lineHeight:1.3, marginBottom:10 }}>{task.title}</h1>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7, marginBottom:20 }}>{task.description}</p>

          <div style={styles.metaGrid}>
            {[
              { label:'Category', val: task.category },
              { label:'Deadline', val: task.deadline },
              { label:'You earn', val: `₹${earn}`, color:'var(--green)' },
            ].map(m => (
              <div key={m.label} style={styles.metaBox}>
                <div style={styles.metaLbl}>{m.label}</div>
                <div style={{ fontSize:14, fontWeight:600, marginTop:5, color: m.color || 'var(--text)' }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Poster info */}
          <div className="section-label" style={{ marginTop:20 }}>Posted by</div>
          <div style={styles.posterCard}>
            <div style={{ ...styles.av, background:'rgba(139,124,248,.15)', color:'var(--purple2)' }}>
              {task.poster_initials || '??'}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{task.poster_name}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>⭐ {task.poster_rating} · Verified student</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>Verified ✓</div>
          </div>

          {/* OTP section — only for doer when accepted */}
          {isMyTask && task.status === 'accepted' && !done && (
            <div style={{ marginTop:24, borderTop:'1px solid var(--border)', paddingTop:20 }}>
              <div className="section-label">Enter OTP from poster</div>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:8 }}>
                Ask <strong>{task.poster_name}</strong> for the 4-digit code on their screen.
              </p>
              <div className="otp-boxes">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`otp-box${otp[i]?' filled':''}${otpErr?' error':''}`}>
                    {otp[i] || ''}
                  </div>
                ))}
              </div>
              <div className="numpad">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i) => (
                  <button key={i}
                    className={`num-key${k===''?' empty':''}`}
                    onClick={() => k==='⌫' ? otpDel() : k!=='' ? otpKey(String(k)) : null}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OTP shown to POSTER (so they can share it with doer) */}
          {isMyPost && task.status === 'accepted' && task.otp_code && (
            <div style={{ marginTop:24, background:'var(--purple-bg)', border:'1px solid var(--purple-br)', borderRadius:'var(--r2)', padding:20 }}>
              <div className="section-label">Your OTP — share this with the doer</div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:12 }}>
                {task.otp_code.split('').map((d,i) => (
                  <div key={i} style={{ width:54, height:60, borderRadius:12, background:'rgba(139,124,248,.15)', border:'1.5px solid var(--purple)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, fontFamily:'var(--mono)', color:'var(--purple2)' }}>
                    {d}
                  </div>
                ))}
              </div>
              <p style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginTop:10 }}>Show this to {task.doer_name} to confirm they've completed the task.</p>
            </div>
          )}

         {/* Rating prompt — shown to poster after task is completed */}
{isMyPost && task.status === 'completed' && task.doer_id && (
  <div style={{ marginTop:24, borderTop:'1px solid var(--border)', paddingTop:20 }}>
    <div className="section-label">Rate the doer</div>
    {hasRated ? (
      <div style={{ textAlign:'center', padding:'16px 0', color:'var(--green)', fontSize:14, fontWeight:600 }}>
        ✓ You've rated {task.doer_name}
      </div>
    ) : (
      <>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>
          How well did <strong>{task.doer_name}</strong> do?
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', fontSize:36, marginBottom:16 }}>
          {[1,2,3,4,5].map(n => (
            <span
              key={n}
              style={{ cursor:'pointer', color: n <= rating ? 'var(--amber)' : 'var(--bg4)', transition:'color .15s' }}
              onClick={() => setRating(n)}
            >★</span>
          ))}
        </div>
        <button
          className="btn btn-md btn-primary btn-full"
          onClick={handleRatingSubmit}
          disabled={!rating}
        >
          Submit rating
          </button>
          </>
          )}
          </div>
        )}


          {/* Success */}
          {done && (
          <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-br)', borderRadius:'var(--r2)', padding:24, textAlign:'center', marginTop:24 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Task completed!</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>₹{earn} credited to your wallet.</div>
          <button className="btn btn-md btn-primary btn-full" onClick={() => navigate('/mytasks')}>View my tasks →</button>
          </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.actionCard}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>You earn</div>
              <div style={{ fontSize:34, fontWeight:700, fontFamily:'var(--mono)', color:'var(--green)', marginTop:4 }}>₹{earn}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>₹{task.amount} · 20% platform fee</div>
            </div>

            {!isLoggedIn && (
              <button className="btn btn-lg btn-primary btn-full" onClick={() => navigate('/login')}>Login to accept</button>
            )}
            {isLoggedIn && isMyPost && task.status === 'open' && (
              <button className="btn btn-md btn-secondary btn-full" style={{ color:'var(--red)', borderColor:'var(--red-br)' }} onClick={handleCancel}>
                Cancel task
              </button>
            )}
            {isLoggedIn && isMyPost && task.status === 'accepted' && (
              <div style={{ textAlign:'center', fontSize:13, color:'var(--purple2)', fontWeight:600 }}>
                ✓ Task accepted by {task.doer_name}
              </div>
            )}
            {isLoggedIn && !isMyPost && task.status === 'open' && (
              <button className="btn btn-lg btn-green btn-full" onClick={handleAccept} disabled={acting}>
                {acting ? 'Accepting...' : `⚡ Accept · Earn ₹${earn}`}
              </button>
            )}
            {isLoggedIn && !isMyPost && !isMyTask && task.status === 'accepted' && (
              <div style={{ textAlign:'center', fontSize:13, color:'var(--text3)' }}>Already accepted by someone else.</div>
            )}
            {isMyTask && task.status === 'accepted' && (
              <div style={{ textAlign:'center', fontSize:13, color:'var(--purple2)', fontWeight:600 }}>
                ✓ You accepted this task<br/>
                <span style={{ fontWeight:400, color:'var(--text3)', fontSize:12 }}>Enter the OTP on the left when done</span>
              </div>
            )}
            {task.status === 'completed' && (
              <div style={{ textAlign:'center', fontSize:13, color:'var(--green)', fontWeight:600 }}>✓ Completed</div>
            )}
          </div>

          <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-br)', borderRadius:'var(--r)', padding:'12px 14px', fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
            🔒 <strong>Safe.</strong> Payment released only after OTP verification.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backBtn:   { fontSize:13, color:'var(--text3)', cursor:'pointer', marginBottom:20, display:'inline-flex', alignItems:'center', gap:6 },
  layout:    { display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' },
  main:      { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r3)', padding:28 },
  metaGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  metaBox:   { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px' },
  metaLbl:   { fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text3)' },
  posterCard:{ display:'flex', alignItems:'center', gap:12, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:14, marginTop:10 },
  av:        { width:40, height:40, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  sidebar:   { position:'sticky', top:80, display:'flex', flexDirection:'column', gap:14 },
  actionCard:{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:22 },
  spinner:   { width:28, height:28, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin .7s linear infinite' },
};