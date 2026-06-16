export function SkeletonCard() {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
        <div className="skel" style={{ width:'60%', height:16 }} />
        <div className="skel" style={{ width:50, height:24, borderRadius:20 }} />
      </div>
      <div className="skel" style={{ width:'90%', height:12, marginBottom:8 }} />
      <div className="skel" style={{ width:'75%', height:12, marginBottom:20 }} />
      <div style={{ display:'flex', gap:8 }}>
        <div className="skel" style={{ width:60, height:22, borderRadius:20 }} />
        <div className="skel" style={{ width:80, height:22, borderRadius:20 }} />
        <div className="skel" style={{ width:70, height:22, borderRadius:20 }} />
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="page-wrap">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r3)', padding:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div className="skel" style={{ width:80, height:24, borderRadius:20 }} />
            <div className="skel" style={{ width:80, height:32, borderRadius:8 }} />
          </div>
          <div className="skel" style={{ width:'70%', height:24, marginBottom:16 }} />
          <div className="skel" style={{ width:'100%', height:13, marginBottom:8 }} />
          <div className="skel" style={{ width:'90%', height:13, marginBottom:8 }} />
          <div className="skel" style={{ width:'80%', height:13, marginBottom:28 }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[1,2,3].map(i => <div key={i} className="skel" style={{ height:64 }} />)}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="skel" style={{ height:180, borderRadius:'var(--r2)' }} />
          <div className="skel" style={{ height:60, borderRadius:'var(--r)' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:18, display:'flex', alignItems:'center', gap:14 }}>
          <div className="skel" style={{ width:44, height:44, borderRadius:13, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div className="skel" style={{ width:'50%', height:14, marginBottom:8 }} />
            <div className="skel" style={{ width:'30%', height:12 }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <div className="skel" style={{ width:70, height:22, borderRadius:20 }} />
            <div className="skel" style={{ width:50, height:14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid-3" style={{ marginBottom:28 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', padding:'20px 22px' }}>
          <div className="skel" style={{ width:'40%', height:11, marginBottom:12 }} />
          <div className="skel" style={{ width:'60%', height:34, marginBottom:8 }} />
          <div className="skel" style={{ width:'50%', height:11 }} />
        </div>
      ))}
    </div>
  );
}