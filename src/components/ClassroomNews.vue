<template>
  <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="fw-bold text-dark m-0"><i class="bi bi-megaphone-fill text-danger me-2"></i>Announcements</h4>
      <button v-if="authState.user?.role === 'instructor'" class="btn btn-sm btn-danger rounded-pill px-3" @click="$emit('openAnnModal', null)">
        <i class="bi bi-plus-lg"></i> Post
      </button>
    </div>

    <p class="text-muted small mb-4">Live lecture feeds, cancelled lectures, and study alerts updated directly by Diwan Sir.</p>

    <div v-if="announcements.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-megaphone display-3 text-secondary"></i>
      <p class="mt-2 mb-0">No announcements found.</p>
    </div>

    <div v-else class="d-flex flex-column gap-3">
      <div v-for="ann in announcements" :key="ann.id" class="card border border-secondary border-opacity-10 bg-light bg-opacity-25 rounded-4 p-3 hover-shadow">
        <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-1">
          <h6 class="fw-bold text-dark mb-0">{{ ann.title }}</h6>
          <span :class="['badge rounded-pill', getAudienceClass(ann.audience)]" style="font-size: 0.65rem;">
            {{ ann.audience === 'open' ? 'Public' : ann.audience === 'both' ? 'All Students' : 'Online Only' }}
          </span>
        </div>
        <p class="text-secondary small mb-2 text-break">{{ ann.content }}</p>
        
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top border-light">
          <span class="text-muted small" style="font-size: 0.72rem;"><i class="bi bi-clock me-1"></i>{{ formatDate(ann.created_at) }}</span>
          <div class="d-flex gap-1 align-items-center">
            <a v-if="ann.url" :href="ann.url" target="_blank" class="btn btn-xs btn-outline-dark rounded-pill px-2 py-0 py-1 small" style="font-size: 0.72rem;">
              Link <i class="bi bi-box-arrow-up-right"></i>
            </a>
            <!-- Instructor Edit Actions -->
            <div v-if="authState.user?.role === 'instructor'" class="btn-group btn-group-sm">
              <button @click="$emit('openAnnModal', ann)" class="btn btn-link p-0 px-1 text-primary shadow-none"><i class="bi bi-pencil-square small"></i></button>
              <button @click="$emit('deleteAnnouncement', ann.id)" class="btn btn-link p-0 px-1 text-danger shadow-none"><i class="bi bi-trash small"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authState } from '../state';

defineProps<{
  announcements: any[];
}>();

defineEmits<{
  (e: 'openAnnModal', ann: any | null): void;
  (e: 'deleteAnnouncement', id: number): void;
}>();

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function getAudienceClass(audience: string) {
  switch (audience) {
    case 'open': return 'bg-success bg-opacity-10 text-success';
    case 'both': return 'bg-primary bg-opacity-10 text-primary';
    case 'online': return 'bg-info bg-opacity-10 text-dark';
    default: return 'bg-secondary bg-opacity-10 text-secondary';
  }
}
</script>
