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
  const { data, error } = await supabase.rpc('complete_task_and_credit', {
    p_task_id: taskId,
    p_otp:     otp,
  });
  if (error) throw error;
  return data;
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
export async function fetchWalletData(userId) {
  const [profileRes, tasksRes, withdrawalsRes] = await Promise.all([
    supabase.from('profiles').select('wallet_balance, rating').eq('id', userId).single(),
    supabase.from('tasks').select('*').eq('doer_id', userId).eq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('withdrawal_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  if (profileRes.error) throw profileRes.error;

  return {
    walletBalance:  profileRes.data.wallet_balance ?? 0,
    rating:         profileRes.data.rating ?? 5.0,
    completedTasks: tasksRes.data ?? [],
    withdrawals:    withdrawalsRes.data ?? [],
  };
}
export async function requestWithdrawal(userId, amount, upiId) {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_user_id: userId,
    p_amount:  amount,
    p_upi_id:  upiId,
  });
  if (error) throw error;
  return data;
}
export async function reopenTask(taskId, posterId) {
  const { data, error } = await supabase.rpc('reopen_task', {
    p_task_id:   taskId,
    p_poster_id: posterId,
  });
  if (error) throw error;
  return data;
}
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}
export async function createRazorpayOrder(amount) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount },
  });
  if (error) throw error;
  if (data.error) throw new Error(data.error);
  return data; // { order_id, key_id }
}
  export async function updateUpiId(userId, upiId) {
  const { error } = await supabase
    .from('profiles')
    .update({ upi_id: upiId.trim() })
    .eq('id', userId);
  if (error) throw error;
}

export async function fetchTransactions(userId) {
  const [tasksRes, withdrawalsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, amount, created_at, poster_name')
      .eq('doer_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (tasksRes.error) throw tasksRes.error;

  return {
    deposits:    tasksRes.data ?? [],
    withdrawals: withdrawalsRes.data ?? [],
  };
}
export async function doerCancelTask(taskId, doerId) {
  const { data, error } = await supabase.rpc('doer_cancel_task', {
    p_task_id: taskId,
    p_doer_id: doerId,
  });
  if (error) throw error;
  return data;
}
export async function verifyAndCreateTask(paymentId, orderId, signature, taskData) {
  const { data, error } = await supabase.functions.invoke('verify-and-create-task', {
    body: {
      payment_id: paymentId,
      order_id:   orderId,
      signature:  signature,
      task:       taskData,
    }
  });
  if (error) throw error;
  if (data.error) throw new Error(data.error);
  return data;
}
export async function fetchHomeStats() {
  const [profilesRes, completedRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('amount').eq('status', 'completed'),
  ]);
  const students      = profilesRes.count || 0;
  const completedTasks = completedRes.data || [];
  const totalEarned   = completedTasks.reduce((s, t) => s + Math.round(t.amount * 0.8), 0);
  return { students, completed: completedTasks.length, totalEarned };
}
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    { redirectTo: 'https://task-campus-three.vercel.app/reset-password' }
  );
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}