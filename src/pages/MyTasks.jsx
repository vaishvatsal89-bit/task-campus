import { Link } from 'react-router-dom'
function MyTasks() {

return (

<>

<nav className="navbar">

<div className="nav-logo">

<div className="bolt">

⚡

</div>

TaskCampus

</div>

</nav>


<div className="page-wrap">


<h1>

My Tasks

</h1>

<p>

Track tasks you posted and tasks you accepted.

</p>


<div className="feed-section">


<div className="task-card">

<h3>

Deliver Notes To Block C

</h3>

<p>

Status: Open

</p>

<p>

₹150

</p>

</div>


<div className="task-card">

<h3>

Print Assignment Sheets

</h3>

<p>

Status: Accepted

</p>

<p>

₹200

</p>

</div>


<div className="task-card">

<h3>

Buy Lab Record

</h3>

<p>

Status: Completed

</p>

<p>

₹100

</p>

</div>


</div>


</div>

</>

)

}

export default MyTasks