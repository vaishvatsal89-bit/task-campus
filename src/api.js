import { supabase } from './supabase';

const UNIVERSITY_DOMAIN =
  import.meta.env.VITE_UNIVERSITY_DOMAIN || 'university.edu';

function assertUniversityEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith(`@${UNIVERSITY_DOMAIN}`)) {
    throw new Error(`Only @${UNIVERSITY_DOMAIN} emails are allowed`);
  }
}

/* ── AUTH ───────────────────────────────────────────────────────────────── */

export async function signUp(email, password, name, upiId) {
  assertUniversityEmail(email);

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      upi_id: upiId.trim(),
    });
    if (profileError) throw profileError;
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/* ── TASKS ──────────────────────────────────────────────────────────────── */

export async function fetchTasks(category = 'All') {
  const now = new Date().toISOString();

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'open')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchTaskById(id) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyTasks(userId) {
  const [doingRes, postedRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('doer_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('*')
      .eq('poster_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (doingRes.error) throw doingRes.error;
  if (postedRes.error) throw postedRes.error;

  return {
    doing: doingRes.data ?? [],
    posted: postedRes.data ?? [],
  };
}

export async function acceptTask(taskId, doerId, doerName) {
  const { data, error } = await supabase.rpc('accept_task', {
    p_task_id: taskId,
    p_doer_id: doerId,
    p_doer_name: doerName,
  });
  if (error) throw error;
  return data;
}

export async function verifyOtp(taskId, otp) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('amount, otp_code, status')
    .eq('id', taskId)
    .single();
  if (error) throw error;

  if (task.status !== 'accepted' || task.otp_code !== otp) {
    return { success: false };
  }

  const earn = Math.round(task.amount * 0.8);

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)
    .eq('otp_code', otp);

  if (updateError) throw updateError;
  return { success: true, earn };
}

export async function cancelTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'cancelled' })
    .eq('id', taskId);
  if (error) throw error;
}

/* ── REALTIME ─────────────────────────────────────────────────────────────── */

export function subscribeToTasks(onInsert) {
  const channel = supabase
    .channel('public:tasks:insert')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tasks' },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToTask(taskId, onUpdate) {
  const channel = supabase
    .channel(`task:${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${taskId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
export async function submitRating(taskId, raterId, ratedId, score) {
  const { data, error } = await supabase.rpc('submit_rating', {
    p_task_id:  taskId,
    p_rater_id: raterId,
    p_rated_id: ratedId,
    p_score:    score,
  });
  if (error) throw error;
  return data;
}

export async function checkIfRated(taskId) {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('task_id', taskId)
    .maybeSingle();
  return !!data;
}