import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  return (
    <div className="page-wrap" style={{ maxWidth: 620 }}>
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to home</div>
      <h1 style={styles.h1}>Contact Us</h1>
      <p style={styles.sub}>We typically respond within 24 hours.</p>

      <div style={styles.card}>
        <div style={styles.row}>
          <div style={styles.icon}>✉️</div>
          <div>
            <div style={styles.label}>Email</div>
            <a href="mailto:vaishvatsal89@gmail.com" style={styles.val}>
              vaishvatsal89@gmail.com
            </a>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.icon}>🌐</div>
          <div>
            <div style={styles.label}>Website</div>
            <a href="https://task-campus-three.vercel.app" style={styles.val}>
              task-campus-three.vercel.app
            </a>
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.icon}>⏱</div>
          <div>
            <div style={styles.label}>Response time</div>
            <div style={styles.valText}>Within 24 hours on business days</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--purple-bg)', border: '1px solid var(--purple-br)', borderRadius: 'var(--r2)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--purple2)' }}>For payment issues or disputes</strong> — please email us with your registered email address and task ID. We resolve all payment disputes within 3–5 business days.
      </div>
    </div>
  );
}

const styles = {
  backBtn:  { fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 },
  h1:       { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  sub:      { fontSize: 15, color: 'var(--text2)', marginBottom: 32 },
  card:     { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 0 },
  row:      { display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--border)' },
  icon:     { fontSize: 20, width: 36, flexShrink: 0, marginTop: 2 },
  label:    { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: 4 },
  val:      { fontSize: 14, color: 'var(--purple2)', textDecoration: 'none', fontWeight: 500 },
  valText:  { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
};