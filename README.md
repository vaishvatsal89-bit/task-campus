# TaskCampus

Campus-only task marketplace for university students. Post errands, study help, deliveries, and more — fellow students accept tasks, complete them, and get paid.

**Live demo:** [https://task-campus-three.vercel.app](https://task-campus-three.vercel.app)

## Features

- University email signup (`@galgotiasuniversity.ac.in` only)
- Post and browse open tasks
- Accept tasks (first accepter wins)
- OTP verification when a task is completed
- My Tasks — track tasks you posted and tasks you're doing
- Realtime feed updates via Supabase

## Tech stack

- **Frontend:** React, Vite, React Router
- **Backend / database:** Supabase (PostgreSQL, Auth, Realtime)
- **Hosting:** Vercel

## Run locally

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_UNIVERSITY_DOMAIN=galgotiasuniversity.ac.in
```

Set up the database by running `supabase/setup.sql` in the Supabase SQL Editor.

```bash
npm run dev
```

## Project structure

```
src/
  pages/       Home, Login, Post, MyTasks, TaskDetail
  components/  Navbar, TaskCard
  context/     AuthContext
  api.js       Supabase API calls
  supabase.js  Supabase client
```
