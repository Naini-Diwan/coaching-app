import { reactive, ref } from 'vue';
import { supabase } from './supabase';;

export interface UserProfile {
  id: string;
  username: string;
  role: 'instructor' | 'online_student' | 'offline_student' | string;
  name: string;
}

export const authState = reactive<{
  isLoggedIn: boolean;
  user: UserProfile | null;
}>({
  isLoggedIn: false,
  user: null,
});

export const notifications = ref<any[]>([]);
export const latestToastEvent = ref<{
  id: number;
  title: string;
  message: string;
  link?: string;
} | null>(null);

export function setLoggedInUser(user: UserProfile) {
  authState.user = user;
  authState.isLoggedIn = true;
}

// Updated to use Supabase instead of fetch('/api/notifications')
export async function fetchNotifications() {
  if (!authState.isLoggedIn || !authState.user) {
    notifications.value = [];
    return;
  }
  try {
    const { data: serverData, error } = await supabase
      .from('notifications')
      .select('*'); 
      // Note: If you only want notifications for this user, you can chain: .eq('user_id', authState.user.id)

    if (error) throw error;

    if (serverData && Array.isArray(serverData)) {
      // Keep any local session notifications that aren't in the DB yet
      const serverIds = new Set(serverData.map((n: any) => n.id));
      const localOnly = notifications.value.filter(
        (n) => n.isLocal && !serverIds.has(n.id) && n.user_id === authState.user?.id
      );
      notifications.value = [...localOnly, ...serverData];
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
}

export function triggerPushNotification(title: string, message: string, link: string = '') {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const newNotif = {
    id,
    user_id: authState.user?.id ?? null,
    title,
    message,
    link,
    read: 0,
    isLocal: true,
    created_at: new Date().toISOString(),
  };

  if (authState.isLoggedIn) {
    notifications.value.unshift(newNotif);
  }

  latestToastEvent.value = { id, title, message, link };

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body: message });
    } catch {
      // Ignore notification errors in restricted contexts
    }
  }
}

export const confirmDialogState = reactive<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant: 'danger' | 'warning' | string;
  loading: boolean;
  onConfirm: (() => Promise<void> | void) | null;
}>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  confirmVariant: 'danger',
  loading: false,
  onConfirm: null,
});

export function openConfirmDialog(options: {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | string;
  onConfirm?: () => Promise<void> | void;
}) {
  confirmDialogState.title = options.title;
  confirmDialogState.message = options.message;
  confirmDialogState.confirmText = options.confirmText || 'Confirm';
  confirmDialogState.confirmVariant = options.confirmVariant || 'danger';
  confirmDialogState.loading = false;
  confirmDialogState.onConfirm = options.onConfirm || null;
  confirmDialogState.isOpen = true;
}

export function closeConfirmDialog() {
  confirmDialogState.isOpen = false;
  confirmDialogState.loading = false;
  confirmDialogState.onConfirm = null;
}

// ==========================================
// DOUBTS
// ==========================================
export const doubts = ref<any[]>([]);

export async function fetchDoubts() {
  const { data, error } = await supabase
    .from('doubts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching doubts:', error);
  } else {
    doubts.value = data || [];
  }
}

export async function addDoubt(student_name: string, doubt_text: string) {
  const { data, error } = await supabase
    .from('doubts')
    .insert([{ student_name, doubt_text }])
    .select();

  if (error) {
    console.error('Error adding doubt:', error);
  } else if (data) {
    doubts.value.unshift(data[0]);
  }
}

// ==========================================
// ATTENDANCE
// ==========================================
export const attendanceList = ref<any[]>([]);

export async function fetchAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance:', error);
  } else {
    attendanceList.value = data || [];
  }
}

export async function markAttendance(student_id: string, status: string, date: string) {
  const { data, error } = await supabase
    .from('attendance')
    .insert([{ student_id, status, date }])
    .select();

  if (error) {
    console.error('Error marking attendance:', error);
  } else if (data) {
    attendanceList.value.push(data[0]);
  }
}