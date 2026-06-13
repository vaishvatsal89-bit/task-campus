import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to home</div>
      <h1 style={styles.h1}>About TaskCampus</h1>
      <p style={styles.sub}>A peer-to-peer task marketplace built for university students.</p>

      <Section title="What is TaskCampus?">
        TaskCampus is an online platform that connects university students who need small tasks done
        with fellow students who are willing to do them for fair pay. Whether it's a food delivery
        to your room, printing notes, getting study help, or running a quick errand — TaskCampus
        makes it easy to post a task and get it done within your campus community.
      </Section>

      <Section title="How it works">
        <ol style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text2)', fontSize: 14 }}>
          <li><strong style={{ color: 'var(--text)' }}>Post a task</strong> — Describe what you need, set a budget and deadline.</li>
          <li><strong style={{ color: 'var(--text)' }}>Get accepted</strong> — A verified student on campus accepts your task.</li>
          <li><strong style={{ color: 'var(--text)' }}>Verify with OTP</strong> — Once done, share a 4-digit OTP to confirm completion.</li>
          <li><strong style={{ color: 'var(--text)' }}>Payment released</strong> — The doer's earnings are credited to their wallet instantly.</li>
        </ol>
      </Section>

      <Section title="Who can use it?">
        TaskCampus is exclusively available to students with a verified university email address.
        This ensures every person on the platform is a real, identifiable member of your campus
        community — making the platform safe and trusted.
      </Section>

      <Section title="Platform fee">
        TaskCampus charges a 20% platform fee on each completed task. This fee covers
        platform operations, payment processing, and future development. The doer receives
        80% of the posted amount directly to their in-app wallet.
      </Section>

      <Section title="Contact us">
        For any questions, reach us at{' '}
        <a href="mailto:vaishvatsal89@gmail.com" style={{ color: 'var(--purple2)' }}>
          vaishvatsal89@gmail.com
        </a>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

const styles = {
  backBtn: { fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 },
  h1:      { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  sub:     { fontSize: 15, color: 'var(--text2)', marginBottom: 40 },
};