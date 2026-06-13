import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Refund() {
  const navigate = useNavigate();
  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <div style={styles.backBtn} onClick={() => navigate('/')}>← Back to home</div>
      <h1 style={styles.h1}>Cancellation & Refund Policy</h1>
      <p style={styles.sub}>Last updated: June 2025 · TaskCampus</p>

      <Section title="1. Task cancellation by poster">
        A task poster may cancel their task at any time before it has been accepted by a doer.
        Once a task has been accepted, the poster must wait for the doer to complete it or
        re-open it via the overdue task flow.
      </Section>

      <Section title="2. Task cancellation by doer">
        If a doer is unable to complete an accepted task, they should inform the poster immediately.
        The poster can then re-open the task for another student to accept. Cancellations by
        doers are recorded and contribute to their warning count.
      </Section>

      <Section title="3. Refund eligibility">
        Refunds are applicable in the following cases:
        <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2 }}>
          <li>Payment was charged but the task was never accepted by any doer.</li>
          <li>A technical error caused a duplicate payment.</li>
          <li>Payment was processed but the task was not created on the platform.</li>
        </ul>
      </Section>

      <Section title="4. Non-refundable cases">
        The 20% platform fee is non-refundable once a task has been marked as completed
        via OTP verification. Refunds will not be issued for completed tasks on the grounds
        of dissatisfaction with the doer's performance — users are encouraged to use the
        rating system to reflect their experience.
      </Section>

      <Section title="5. Refund process">
        To request a refund, email us at vaishvatsal89@gmail.com with your registered email
        address, the task ID, and the reason for the refund. All refund requests are reviewed
        within 3–5 business days. Approved refunds are credited to the original payment
        method within 7–10 business days via Razorpay.
      </Section>

      <Section title="6. Contact">
        For cancellation or refund queries:{' '}
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