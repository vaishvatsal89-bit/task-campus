import { supabase } from './supabase';

const UNIVERSITY_DOMAIN =
  import.meta.env.VITE_UNIVERSITY_DOMAIN || 'university.edu';

     let _cachedDomains = null;

async function assertUniversityEmail(email) {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) throw new Error('Invalid email address');

  if (!_cachedDomains) {
    const { data } = await supabase
      .from('universities')
      .select('domain')
      .eq('active', true);
    _cachedDomains = (data || []).map(u => u.domain);
  }

  if (!_cachedDomains.includes(domain)) {
    throw new Error(
      `Only university emails are accepted. Your domain (@${domain}) is not yet supported.`
    );
  }
}

function assertValidUpiId(upiId) {
  const trimmed = upiId.trim();
  if (!trimmed) throw new Error('UPI ID is required');
  const upiRegex = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{2,}$/;
  if (!upiRegex.test(trimmed)) {
    throw new Error('Invalid UPI ID. Use format: yourname@upi or 9876543210@paytm');
  }
}

/* ── AUTH ───────────────────────────────────────────────────────────────── */

  export async function signUp(email, password, name, upiId, referralCode = '') {
  await assertUniversityEmail(email);
  assertValidUpiId(upiId);

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name:          name.trim(),
        upi_id:        upiId.trim(),
        referral_code: referralCode.trim().toUpperCase(),
      }
    }
  });
  if (error) throw error;
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

  export async function fetchTasks(category = 'All', universityId = null) {
  const now = new Date().toISOString();

  let query = supabase
    .from('tasks_public')
    .select('*')
    .eq('status', 'open')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  if (universityId) query = query.eq('university_id', universityId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchTaskById(id) {
  const { data, error } = await supabase
    .from('tasks_public')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRazorpayOrder(amount) {
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Could not create payment order');
  }
  return res.json();
}

export async function createTaskAfterPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  taskData,
}) {
  const res = await fetch('/api/create-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      taskData,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Task creation failed');
  }
  return res.json();
}

export async function fetchMyTasks(userId) {
  const [doingRes, postedRes] = await Promise.all([
    supabase
      .from('tasks_public')
      .select('*')
      .eq('doer_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks_public')
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

export async function verifyOtp(taskId, enteredOtp) {
  const { data, error } = await supabase
    .rpc('verify_task_otp', {
      p_task_id:     taskId,
      p_entered_otp: enteredOtp,
    });
  if (error) throw error;
  return data;
  // Returns: { success: true, earn: 120 }
  // Or:      { success: false, message: 'Wrong OTP. 3 attempts left.' }
  // Or:      { success: false, message: 'Too many wrong attempts. Contact support.' }
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

   export async function checkIfRated(taskId, raterId) {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('task_id', taskId)
    .eq('rater_id', raterId)
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
    { redirectTo: 'https://taskcampus.in/reset-password' }
  );
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
export async function cancelTaskWithRefund(taskId) {
  const { data, error } = await supabase.functions.invoke('process-refund', {
    body: { task_id: taskId },
  });
  if (error) throw error;
  if (data.error) throw new Error(data.error);
  return data;
}
  export async function searchTasks(query, category = 'All', universityId = null) {
  const now = new Date().toISOString();

  let q = supabase
    .from('tasks')
    .select('*')
    .eq('status', 'open')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (category !== 'All') q = q.eq('category', category);
  if (universityId) query = query.eq('university_id', universityId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
export async function fetchMessages(taskId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(taskId, senderId, senderName, content) {
  const { error } = await supabase
    .from('messages')
    .insert({ task_id: taskId, sender_id: senderId, sender_name: senderName, content: content.trim() });
  if (error) throw error;
}

export function subscribeToMessages(taskId, onNew) {
  const channel = supabase
    .channel(`messages:${taskId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` },
      (payload) => onNew(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
export async function markOnTheWay(taskId, doerId) {
  const { data, error } = await supabase.rpc('mark_on_the_way', {
    p_task_id: taskId,
    p_doer_id: doerId,
  });
  if (error) throw error;
  return data;
}

export async function uploadTaskFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) throw new Error('File too large. Maximum size is 10MB.');

  const allowed = ['pdf','png','jpg','jpeg','doc','docx'];
  const ext     = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    throw new Error('Only PDF, images, and Word documents are allowed.');
  }

  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('task-attachments')
    .upload(path, file, { cacheControl:'3600', upsert:false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(path);

  return { url: publicUrl, name: file.name };
}
export async function fetchAdminStats(userId) {
  const { data, error } = await supabase.rpc('get_admin_stats', {
    p_user_id: userId
  });
  if (error) throw error;
  return data;
}

export async function fetchPendingWithdrawals() {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Fetch profile info separately
  const userIds = [...new Set(data.map(w => w.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', userIds);

  return data.map(w => ({
    ...w,
    profiles: profiles?.find(p => p.id === w.user_id) || null
  }));
}

export async function fetchBannedUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, warning_count, banned_until')
    .not('banned_until', 'is', null)
    .gt('banned_until', new Date().toISOString())
    .order('banned_until', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminUpdateWithdrawal(withdrawalId, status, userId) {
  const { data, error } = await supabase.rpc('admin_update_withdrawal', {
    p_withdrawal_id: withdrawalId,
    p_status:        status,
    p_user_id:       userId,
  });
  if (error) throw error;
  return data;
}

export async function adminUnbanUser(targetUserId, adminUserId) {
  const { data, error } = await supabase.rpc('admin_unban_user', {
    p_user_id:  targetUserId,
    p_admin_id: adminUserId,
  });
  if (error) throw error;
  return data;
}
export async function fetchUniversities() {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminAddUniversity(adminId, name, domain, city) {
  const { data, error } = await supabase.rpc('admin_add_university', {
    p_admin_id: adminId,
    p_name:     name,
    p_domain:   domain,
    p_city:     city,
  });
  if (error) throw error;
  return data;
}

export async function adminToggleUniversity(adminId, universityId, active) {
  const { data, error } = await supabase.rpc('admin_toggle_university', {
    p_admin_id:      adminId,
    p_university_id: universityId,
    p_active:        active,
  });
  if (error) throw error;
  return data;
}
export async function fetchMyOtp(taskId) {
  const { data, error } = await supabase
    .rpc('get_my_otp', { p_task_id: taskId });
  if (error) throw error;
  return data;
}