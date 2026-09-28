<template>
  <div class="position-fixed top-0 end-0 p-3" style="z-index: 1080;">
    <div v-for="notif in activeToasts" :key="notif.id" class="toast show border-0 shadow-lg rounded-4 mb-2 bg-dark text-white" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header bg-dark text-white border-bottom border-secondary border-opacity-20 rounded-top-4">
        <i class="bi bi-bell-fill text-warning me-2"></i>
        <strong class="me-auto">{{ notif.title }}</strong>
        <small class="text-white text-opacity-50">Just Now</small>
        <button type="button" class="btn-close btn-close-white" @click="removeToast(notif.id)" aria-label="Close"></button>
      </div>
      <div class="toast-body p-3">
        {{ notif.message }}
        <div v-if="notif.link" class="mt-2 pt-2 border-top border-secondary border-opacity-20 text-end">
          <a :href="notif.link" target="_blank" class="btn btn-sm btn-outline-warning rounded-pill py-0 px-3 fs-7" @click="removeToast(notif.id)">Open Resource</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { latestToastEvent } from '../state';

interface ToastItem {
  id: number;
  title: string;
  message: string;
  link?: string;
}

const activeToasts = ref<ToastItem[]>([]);
const processedIds = new Set<number>();

// Watch explicit toast events so fetching historical notifications or marking read never re-triggers old toasts
watch(
  () => latestToastEvent.value,
  (latest) => {
    if (latest && !processedIds.has(latest.id)) {
      processedIds.add(latest.id);
      const toast: ToastItem = {
        id: latest.id,
        title: latest.title,
        message: latest.message,
        link: latest.link,
      };
      activeToasts.value.unshift(toast);

      // Auto-expire after 6 seconds
      setTimeout(() => {
        removeToast(toast.id);
      }, 6000);
    }
  }
);

function removeToast(id: number) {
  activeToasts.value = activeToasts.value.filter((t) => t.id !== id);
}
</script>

<style scoped>
.toast {
  max-width: 320px;
}
.fs-7 {
  font-size: 0.75rem;
}
</style>
