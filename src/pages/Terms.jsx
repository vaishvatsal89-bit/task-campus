import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to home</div>
      <h1 style={styles.h1}>Terms & Conditions</h1>
      <p style={styles.sub}>Last updated: June 2025 · TaskCampus</p>

      <Section title="1. Eligibility">
        TaskCampus is exclusively available to students with a valid university email address.
        By creating an account, you confirm that you are a currently enrolled student and that
        the email address you register with is your genuine institutional email.
      </Section>

      <Section title="2. Task posting rules">
        Tasks must be legal, campus-appropriate, and physically achievable within the stated
        deadline. You may not post tasks involving illegal activities, harassment, academic
        dishonesty, or anything that violates your institution's code of conduct.
        The minimum task amount is ₹30.
      </Section>

      <Section title="3. Task acceptance">
        By accepting a task, you commit to completing it within the stated deadline.
        Repeated failure to complete accepted tasks will result in warnings and temporary
        suspension from the platform. Three warnings result in a 7-day ban.
      </Section>

      <Section title="4. OTP verification">
        Task completion is confirmed by a 4-digit OTP shared between the poster and doer.
        The poster must only share the OTP after they are satisfied the task is complete.
        Sharing the OTP without task completion constitutes fraud.
      </Section>

      <Section title="5. Platform fee">
        TaskCampus charges a 20% platform fee on every completed task. This is automatically
        deducted from the task amount before crediting the doer's wallet. The poster pays
        the full amount; the doer receives 80%.
      </Section>

      <Section title="6. Wallet and withdrawals">
        Earnings are credited to your in-app wallet upon task completion. Withdrawal requests
        are processed manually within 24 hours to the UPI ID registered on your profile.
        Minimum withdrawal amount is ₹50.
      </Section>

      <Section title="7. Prohibited conduct">
        Users may not manipulate ratings, create fake tasks, abuse the OTP system, or
        attempt to transact outside the platform to avoid fees. Violations may result in
        permanent account termination.
      </Section>

      <Section title="8. Limitation of liability">
        TaskCampus is a platform connecting students and is not responsible for the quality
        of tasks performed, disputes between users, or any physical harm arising from task
        completion. Users interact at their own risk.
      </Section>

      <Section title="9. Contact">
        For any queries regarding these terms, contact{' '}
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