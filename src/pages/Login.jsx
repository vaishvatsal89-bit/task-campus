import { Link } from 'react-router-dom'

function Login() {

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

← Back To Home

</Link>

</div>

</nav>


<div className="auth-wrap">

<div className="auth-box">


<div className="auth-logo">

<div className="bolt">

⚡

</div>

TaskCampus

</div>


<div className="auth-sub">

Campus-only task marketplace.

Verified students only.

</div>


{/* TABS */}

<div className="auth-tabs">

<button className="auth-tab active">

Login

</button>

<button className="auth-tab">

Sign Up

</button>

</div>


{/* LOGIN FORM */}

<div className="auth-form">

<div className="form-group">

<label className="form-label">

University Email

</label>

<input
className="inp"
type="email"
placeholder="yourname@university.edu"
/>

</div>


<div className="form-group">

<label className="form-label">

Password

</label>

<input
className="inp"
type="password"
placeholder="••••••"
/>

</div>


<button className="btn btn-md btn-primary btn-full">

Login

</button>


<div className="form-note">

Don't have an account?

Sign up here

</div>

</div>


<hr style={{margin:"20px 0"}} />


{/* SIGNUP */}

<div className="auth-form">

<div className="info-box">

🎓 Only university emails accepted

</div>


<div className="form-group">

<label className="form-label">

Full Name

</label>

<input
className="inp"
placeholder="Arjun Singh"
/>

</div>


<div className="form-group">

<label className="form-label">

University Email

</label>

<input
className="inp"
placeholder="yourname@university.edu"
/>

</div>


<div className="form-group">

<label className="form-label">

UPI ID

</label>

<input
className="inp"
placeholder="yourname@upi"
/>

</div>


<div className="form-group">

<label className="form-label">

Password

</label>

<input
className="inp"
type="password"
placeholder="Minimum 8 characters"
/>

</div>


<button className="btn btn-md btn-primary btn-full">

Create Account

</button>

</div>


</div>

</div>

</>

)

}

export default Login