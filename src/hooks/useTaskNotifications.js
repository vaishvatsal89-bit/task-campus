import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export function useTaskNotifications() {
  const { isLoggedIn, user } = useAuth();

  // Ask for browser notification permission when user logs in
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isLoggedIn]);

  // Subscribe to new task inserts via Realtime
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const channel = supabase
      .channel('new-task-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          const task = payload.new;

          // Don't notify the poster about their own task
          if (task.poster_id === user.id) return;

          // Only show if task is open
          if (task.status !== 'open') return;

          // Show browser notification (works even when tab is minimized)
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const notif = new Notification('New task on TaskCampus ⚡', {
              body: `${task.title} · ₹${task.amount} · ${task.category}`,
              icon: '/favicon.ico',
              tag:  task.id, // prevents duplicate notifications
            });

            // Click → open that task
            notif.onclick = () => {
              window.focus();
              window.location.href = `/task/${task.id}`;
              notif.close();
            };

            // Auto close after 6 seconds
            setTimeout(() => notif.close(), 6000);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isLoggedIn, user]);
}