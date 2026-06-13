import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to home</div>
      <h1 style={styles.h1}>Privacy Policy</h1>
      <p style={styles.sub}>Last updated: June 2025 · TaskCampus (task-campus-three.vercel.app)</p>

      <Section title="1. Information we collect">
        When you create an account, we collect your university email address, full name, and UPI ID.
        When you post or accept tasks, we store the task details, amounts, and completion status.
        We do not collect any payment card information — all payments are processed securely via Razorpay.
      </Section>

      <Section title="2. How we use your information">
        Your information is used solely to operate the TaskCampus platform — to verify your university
        identity, display your name to other users on tasks you post or accept, and to process
        wallet credits and withdrawal requests. We do not use your information for advertising.
      </Section>

      <Section title="3. Data storage">
        All user data is stored securely on Supabase infrastructure with row-level security policies
        that ensure each user can only access their own private data. Task data visible to other
        users is limited to your name, initials, and rating.
      </Section>

      <Section title="4. UPI ID">
        Your UPI ID is stored solely for the purpose of processing withdrawal requests. It is
        never shared with other users and is only accessible to platform administrators for
        processing manual payouts.
      </Section>

      <Section title="5. Third-party services">
        We use Razorpay for payment processing. When you make a payment, you are subject to
        Razorpay's privacy policy in addition to ours. We use Supabase for database and
        authentication services.
      </Section>

      <Section title="6. Data deletion">
        You may request deletion of your account and all associated data by emailing us at
        vaishvatsal89@gmail.com. We will process deletion requests within 7 business days.
      </Section>

      <Section title="7. Contact">
        For privacy-related queries, contact us at{' '}
        <a href="mailto:vaishvatsal89@gmail.com" style={{ color: 'var(--purple2)' }}>
          vaishvatsal89@gmail.com
        </a>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.9 }}>{children}</div>
    </div>
  );
}

const styles = {
  backBtn: { fontSize: 13, color: 'var(--text3)', cursor: 'pointer', marginBottom: 28, display: 'inline-flex', alignItems: 'center', gap: 6 },
  h1:      { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  sub:     { fontSize: 13, color: 'var(--text3)', marginBottom: 40 },
};