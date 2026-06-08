import { Link } from 'react-router-dom'

function Post() {

return (

<>

<nav className="navbar">

<div className="nav-logo">

<div className="bolt">

⚡

</div>

TaskCampus

</div>


<div className="nav-right">

<Link
to="/"
className="btn btn-sm btn-secondary"
>

Home

</Link>

</div>


</nav>


<div className="page-wrap">


<Link
to="/"
style={{
fontSize:"13px",
display:"inline-block",
marginBottom:"20px"
}}
>

← Back To Tasks

</Link>


<div className="detail-layout">


{/* MAIN */}

<div className="detail-main">


<div className="detail-top">

<span className="badge">

Open

</span>

<div className="detail-amount">

₹150

</div>

</div>


<h1 className="detail-title">

Deliver Notes To Block C

</h1>


<p className="detail-desc">

Need someone to deliver notes.

Room C214.

</p>


<div className="meta-grid">


<div className="meta-box">

<div className="meta-box-label">

Category

</div>

<div className="meta-box-val">

Delivery

</div>

</div>


<div className="meta-box">

<div className="meta-box-label">

Deadline

</div>

<div className="meta-box-val">

30 min

</div>

</div>


<div className="meta-box">

<div className="meta-box-label">

Posted

</div>

<div className="meta-box-val">

5 min ago

</div>

</div>


</div>


<div className="poster-card">

<div className="avatar">

VT

</div>


<div>

<h3>

Vatsal

</h3>

<p>

⭐ 4.8 Verified Student

</p>

</div>

</div>


</div>


{/* SIDEBAR */}

<div className="detail-sidebar">


<div className="action-card">


<div className="action-earn">

<p>

You Earn

</p>

<h1>

₹120

</h1>

<p>

20% platform fee

</p>

</div>


<button className="btn btn-lg btn-primary btn-full">

Accept Task

</button>


</div>


<div className="trust-box">

Safe payment with OTP verification

</div>


<div className="action-card">

<p>📍 Delivery Task</p>

<p>⏱ 30 min deadline</p>

<p>💰 Platform Fee 20%</p>

</div>


</div>


</div>


</div>

</>

)

}

export default Post