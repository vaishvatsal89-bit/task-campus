import { Link } from 'react-router-dom'

function Home() {
  return (
    <>

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="nav-logo">

          <div className="bolt">⚡</div>

          TaskCampus

        </div>

        <div className="nav-links">

          <Link to="/">Browse</Link>

          <Link to="/post">Post Task</Link>

          <Link to="/mytasks">My Tasks</Link>

        </div>

        <div className="nav-right">

          <Link
            to="/login"
            className="btn btn-sm btn-primary"
          >

            Login

          </Link>

        </div>

      </nav>



      {/* HERO */}

      <section className="hero">

        <div className="hero-badge">

          <span className="dot"></span>

          Campus-only · Verified students

        </div>

        <h1>

          Get things done.

          <br />

          <span className="highlight">

            Earn on campus.

          </span>

        </h1>

        <p className="hero-sub">

          Post a task, someone nearby completes it.

          Earn money between classes doing quick tasks.

        </p>

        <div className="hero-btns">

          <Link
            to="/post"
            className="btn btn-lg btn-primary"
          >

            Post a task

          </Link>

          <a
            href="#task-grid"
            className="btn btn-lg btn-outline"
          >

            Browse tasks

          </a>

        </div>

      </section>



      {/* STATS */}

      <div className="stats-strip">

        <div className="stat">

          <div className="stat-n">

            —

          </div>

          <div className="stat-l">

            Open tasks

          </div>

        </div>

        <div className="stat">

          <div className="stat-n">

            ₹150

          </div>

          <div className="stat-l">

            Avg payout

          </div>

        </div>

        <div className="stat">

          <div className="stat-n">

            20 min

          </div>

          <div className="stat-l">

            Avg completion

          </div>

        </div>

      </div>



      {/* HOW IT WORKS */}

      <section className="how-section">

        <div className="how-inner">

          <h2 className="how-title">

            How TaskCampus Works

          </h2>

          <p className="how-sub">

            Simple, fast, and safe — just for your campus.

          </p>

          <div className="how-steps">

            <div className="how-step">

              <div className="step-num">01</div>

              <div className="step-title">

                Post a task

              </div>

              <div className="step-desc">

                Describe your task and amount.

              </div>

            </div>

            <div className="how-step">

              <div className="step-num">02</div>

              <div className="step-title">

                Someone accepts

              </div>

              <div className="step-desc">

                First accepter gets the task.

              </div>

            </div>

            <div className="how-step">

              <div className="step-num">03</div>

              <div className="step-title">

                Task gets done

              </div>

              <div className="step-desc">

                Complete and verify.

              </div>

            </div>

            <div className="how-step">

              <div className="step-num">04</div>

              <div className="step-title">

                Payment released

              </div>

              <div className="step-desc">

                Safe payment flow.

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* FEED */}

      <section className="feed-section">

        <div className="feed-topbar">

          <h2>

            Open tasks near you

          </h2>

          <span className="task-count">

            Loading...

          </span>

        </div>



        {/* FILTERS */}

        <div className="filter-row">

          <button className="filter-chip active">

            All

          </button>

          <button className="filter-chip">

            Delivery

          </button>

          <button className="filter-chip">

            Study Help

          </button>

          <button className="filter-chip">

            Errand

          </button>

          <button className="filter-chip">

            Tech Help

          </button>

        </div>



        {/* TASK GRID */}

        <div id="task-grid">

          <p>

            Task cards will appear here

          </p>

        </div>

      </section>

    </>
  )
}

export default Home