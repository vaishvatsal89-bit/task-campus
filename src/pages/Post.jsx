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
import { createRazorpayOrder, verifyAndCreateTask, uploadTaskFile } from '../api';
import { supabase } from '../supabase';
const CATEGORIES = ['Delivery', 'Study help', 'Errand', 'Tech help', 'Print job', 'Other'];

export default function Post({ showToast }) {
  const navigate = useNavigate();
  const { user, profile, isLoggedIn } = useAuth();

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState('Delivery');
  const DEADLINES = ['30 min', '1 hour', '3 hours', 'Tomorrow'];
  const [deadline, setDeadline] = useState('1 hour');
  const [amount,   setAmount]   = useState('');
  const [location, setLocation] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,   setLoading] = useState(false);
  const [taskFile,    setTaskFile]    = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const amtNum = parseInt(amount) || 0;
  const fee    = Math.round(amtNum * 0.2);
  const earn   = amtNum - fee;
  const [aiPrice,      setAiPrice]      = useState(null);
  const [aiLoading,    setAiLoading]    = useState(false);

  function getExpiresAt(preset) {
  const now = Date.now();
  if (preset === '30 min')  return new Date(now + 30 * 60_000).toISOString();
  if (preset === '1 hour')  return new Date(now + 60 * 60_000).toISOString();
  if (preset === '3 hours') return new Date(now + 3 * 60 * 60_000).toISOString();
  if (preset === 'Tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  }
  return null;
}
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

// Upload file first if one was attached
let fileUrl  = null;
let fileName = null;

if (taskFile) {
  setUploadingFile(true);
  try {
    const result = await uploadTaskFile(taskFile, user.id);
    fileUrl  = result.url;
    fileName = result.name;
  } catch (err) {
    showToast('File upload failed. Try again.', 'error');
    setLoading(false);
    setUploadingFile(false);
    return;
  }
  setUploadingFile(false);
}

const taskData = {
  title:           title.trim(),
  description:     desc.trim() + (location ? ` | Location: ${location}` : ''),
  category,
  amount:          amtNum,
  deadline:        deadline || '1 hr',
  expires_at:      getExpiresAt(deadline),
  poster_id:       user.id,
  poster_name:     profile?.name || user.email,
  poster_initials: initials,
  poster_rating:   profile?.rating || 5.0,
  file_url:        fileUrl,
  file_name:       fileName,
};

// Step 1 — create Razorpay order on backend
const order = await createRazorpayOrder(amtNum);

    // Step 2 — open Razorpay payment popup
    const options = {
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      order.amount,
      currency:    order.currency,
      order_id:    order.order_id,
      name:        'TaskCampus',
      description: `Pay for: ${title}`,
      theme:       { color: '#8b7cf8' },

      handler: async function (response) {
        // Step 3 — payment done, verify and create task on backend
        try {
          await verifyAndCreateTask({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            taskData,
          });
          showToast('Task posted! Students are being notified.', 'success');
          navigate('/');
        } catch (err) {
          showToast(err.message || 'Task creation failed after payment', 'error');
          setLoading(false);
        }
      },

      modal: {
        ondismiss: function () {
          showToast('Payment cancelled. Task not posted.', 'info');
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    showToast(err.message || 'Something went wrong', 'error');
    setLoading(false);
  }
}

async function getSuggestedPrice() {
  if (!title.trim() || !desc.trim()) {
    showToast('Fill in title and description first', 'error');
    return;
  }
  setAiLoading(true);
  setAiPrice(null);
  try {
    const { data, error } = await supabase.functions.invoke('ai-price-suggest', {
      body: {
        title:       title.trim(),
        description: desc.trim(),
        category,
        deadline,
      }
    });
    if (error) throw error;
    setAiPrice(data);
  } catch {
    showToast('Could not get AI suggestion', 'error');
  } finally {
    setAiLoading(false);
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
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {DEADLINES.map(d => (
              <button
               key={d}
              type="button"
              onClick={() => setDeadline(d)}
              style={{
              padding: '8px 14px',
              borderRadius: 8,
              border:      deadline === d ? '1.5px solid var(--purple)' : '1px solid var(--border2)',
              background:  deadline === d ? 'var(--purple-bg)' : 'var(--bg3)',
              color:       deadline === d ? 'var(--purple)' : 'var(--text2)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: deadline === d ? 600 : 400,
              transition: 'all 0.15s',
             }}
      >
            {d}
           </button>
            ))}
          </div>
         </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount you'll pay (₹) *</label>
            <input className={`inp ${errors.amount ? 'error':''}`} type="number" min="30" max="5000"
              placeholder="150" value={amount}
              onChange={e => { setAmount(e.target.value); setErrors({}); }} />
            {errors.amount && <span style={styles.err}>{errors.amount}</span>}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
  <span style={{ fontSize:11, color:'var(--text3)' }}>Fair pay = faster acceptance.</span>
  <button
    type="button"
    onClick={getSuggestedPrice}
    disabled={aiLoading || !title.trim() || !desc.trim()}
    style={{
      background:'var(--purple-bg)', border:'1px solid var(--purple-br)',
      borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:600,
      color:'var(--purple2)', cursor:'pointer', fontFamily:'var(--font)',
      opacity: (!title.trim() || !desc.trim()) ? 0.5 : 1,
      transition:'opacity .15s',
    }}
  >
    {aiLoading ? '✨ Thinking...' : '✨ Suggest price'}
  </button>
</div>

{aiPrice && (
  <div style={{
    marginTop:10, padding:'12px 14px',
    background:'var(--purple-bg)', border:'1px solid var(--purple-br)',
    borderRadius:'var(--r2)',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--purple2)' }}>
        ✨ AI suggests: ₹{aiPrice.min}–₹{aiPrice.max}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button
          type="button"
          onClick={() => { setAmount(String(aiPrice.min)); setAiPrice(null); }}
          style={{ padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid var(--purple-br)', background:'var(--bg2)', color:'var(--purple2)', cursor:'pointer' }}
        >
          ₹{aiPrice.min}
        </button>
        <button
          type="button"
          onClick={() => { setAmount(String(Math.round((aiPrice.min + aiPrice.max) / 2))); setAiPrice(null); }}
          style={{ padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, border:'none', background:'var(--purple)', color:'white', cursor:'pointer' }}
        >
          ₹{Math.round((aiPrice.min + aiPrice.max) / 2)} (mid)
        </button>
        <button
          type="button"
          onClick={() => { setAmount(String(aiPrice.max)); setAiPrice(null); }}
          style={{ padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, border:'1px solid var(--purple-br)', background:'var(--bg2)', color:'var(--purple2)', cursor:'pointer' }}
        >
          ₹{aiPrice.max}
        </button>
      </div>
    </div>
    <div style={{ fontSize:12, color:'var(--text2)' }}>💡 {aiPrice.reason}</div>
  </div>
)}
          </div>

          <div className="form-group">
            <label className="form-label">Location / pickup point</label>
            <input className="inp" placeholder="e.g. Block A Room 101" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div className="form-group">
  <label className="form-label">
    Attach a file
    <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400, marginLeft:8 }}>
      optional · PDF, image, Word · max 10MB
    </span>
  </label>

  {!taskFile ? (
    <label style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      gap:10, padding:'20px', borderRadius:'var(--r2)',
      border:'2px dashed var(--border2)', background:'var(--bg3)',
      cursor:'pointer', color:'var(--text2)', fontSize:14,
      transition:'border-color .15s',
    }}>
      <span style={{ fontSize:22 }}>📎</span>
      <span>Click to attach a file</span>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        style={{ display:'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) setTaskFile(f);
          e.target.value = '';
        }}
      />
    </label>
  ) : (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      background:'var(--bg3)', border:'1px solid var(--border2)',
      borderRadius:'var(--r2)',
    }}>
      <span style={{ fontSize:22 }}>
        {taskFile.name.endsWith('.pdf') ? '📄' : taskFile.name.match(/\.(png|jpg|jpeg)$/i) ? '🖼️' : '📝'}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {taskFile.name}
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
          {(taskFile.size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
      <button
        type="button"
        onClick={() => setTaskFile(null)}
        style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18, padding:0 }}
      >
        ×
      </button>
    </div>
  )}
</div>

          <button className="btn btn-lg btn-primary btn-full" type="submit" disabled={loading}>
            {uploadingFile ? 'Uploading file...' : loading ? 'Opening payment...' : `Pay ₹${amtNum || '—'} & Post →`}
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