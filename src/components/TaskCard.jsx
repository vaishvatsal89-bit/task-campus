import { useNavigate } from 'react-router-dom';

const CAT_COLORS = {
  Delivery:     { bg: 'rgba(139,124,248,.12)', color: '#a89dff' },
  'Study help': { bg: 'rgba(96,165,250,.1)',   color: '#60a5fa' },
  Errand:       { bg: 'rgba(251,191,36,.1)',   color: '#fbbf24' },
  'Print job':  { bg: 'rgba(45,212,191,.1)',   color: '#2dd4bf' },
  'Tech help':  { bg: 'rgba(74,222,128,.1)',   color: '#4ade80' },
  Other:        { bg: 'rgba(148,163,184,.1)',  color: '#94a3b8' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Expired', urgent: true };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `${mins}m left`, urgent: true };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m left`, urgent: hrs < 3 };
  return { label: `${Math.floor(hrs / 24)}d left`, urgent: false };
}

export default function TaskCard({ task }) {
  const navigate = useNavigate();
  const col = CAT_COLORS[task.category] || CAT_COLORS.Other;
  const desc = task.description || '';
  const shortDesc = desc.length > 100 ? `${desc.slice(0, 100)}...` : desc;
  const expiry = timeLeft(task.expires_at);

  return (
    <div className="task-card" onClick={() => navigate(`/task/${task.id}`)}>
      <div className="tc-header">
        <div className="tc-title">{task.title}</div>
        <div className="amount-pill">₹{task.amount}</div>
      </div>
      <div className="tc-desc">{shortDesc}</div>
      <div className="tc-footer">
        <span className="badge badge-open">Open</span>
        <span
          className="badge"
          style={{
            background: col.bg,
            color: col.color,
            border: `1px solid ${col.color}33`,
          }}
        >
          {task.category}
        </span>

        {expiry ? (
          <span
            className="badge"
            style={{
              background: expiry.urgent ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.1)',
              color:      expiry.urgent ? '#f87171' : '#94a3b8',
              border:     `1px solid ${expiry.urgent ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.2)'}`,
            }}
          >
            ⏱ {expiry.label}
          </span>
        ) : (
          <span className="badge badge-gray">⏱ {task.deadline || 'ASAP'}</span>
        )}

        <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
          {timeAgo(task.created_at)}
        </span>
      </div>
    </div>
  );
}