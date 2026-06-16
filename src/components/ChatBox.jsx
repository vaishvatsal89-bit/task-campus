import React, { useState, useEffect, useRef } from 'react';
import { fetchMessages, sendMessage, subscribeToMessages } from '../api';

export default function ChatBox({ taskId, userId, userName, otherName }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMessages(taskId)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));

    const unsub = subscribeToMessages(taskId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => unsub();
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage(taskId, userId, userName, text);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <div style={S.headerTitle}>Chat with {otherName}</div>
          <div style={S.headerSub}>Only visible to you and {otherName}</div>
        </div>
      </div>

      <div style={S.msgList}>
        {loading ? (
          <div style={S.center}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={S.center}>No messages yet. Say something!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} style={{ ...S.msgRow, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                {!isOwn && (
                  <div style={S.avatar}>{msg.sender_name?.[0]?.toUpperCase() || '?'}</div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  {!isOwn && <div style={S.senderName}>{msg.sender_name}</div>}
                  <div style={{ ...S.bubble, ...(isOwn ? S.own : S.other) }}>
                    {msg.content}
                  </div>
                  <div style={{ ...S.time, textAlign: isOwn ? 'right' : 'left' }}>
                    {timeAgo(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={S.inputRow}>
        <input
          style={S.input}
          placeholder="Type a message… (Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          style={{ ...S.sendBtn, opacity: (!input.trim() || sending) ? 0.4 : 1 }}
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const S = {
  wrap:        { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', overflow:'hidden', marginTop:24 },
  header:      { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg3)' },
  headerTitle: { fontSize:14, fontWeight:600 },
  headerSub:   { fontSize:11, color:'var(--text3)', marginTop:2 },
  msgList:     { padding:16, display:'flex', flexDirection:'column', gap:12, minHeight:180, maxHeight:300, overflowY:'auto' },
  msgRow:      { display:'flex', gap:8, alignItems:'flex-end' },
  avatar:      { width:28, height:28, borderRadius:'50%', background:'var(--purple-bg)', color:'var(--purple2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 },
  senderName:  { fontSize:11, color:'var(--text3)', marginBottom:3 },
  bubble:      { padding:'9px 12px', borderRadius:12, fontSize:14, lineHeight:1.5, wordBreak:'break-word' },
  own:         { background:'var(--purple)', color:'white', borderBottomRightRadius:4 },
  other:       { background:'var(--bg3)', color:'var(--text)', border:'1px solid var(--border2)', borderBottomLeftRadius:4 },
  time:        { fontSize:10, color:'var(--text3)', marginTop:3 },
  inputRow:    { display:'flex', gap:8, padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg3)' },
  input:       { flex:1, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 14px', fontSize:14, color:'var(--text)', outline:'none', fontFamily:'var(--font)' },
  sendBtn:     { width:40, height:40, borderRadius:10, background:'var(--purple)', border:'none', color:'white', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'opacity .15s' },
  center:      { textAlign:'center', color:'var(--text3)', fontSize:13, padding:20 },
};