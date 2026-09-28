<template>
  <div 
    v-if="confirmDialogState.isOpen" 
    class="modal fade show d-block" 
    tabindex="-1" 
    style="background: rgba(0, 0, 0, 0.65); z-index: 9999;"
    role="dialog"
    aria-modal="true"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
      <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden animate-fade-in">
        <div class="modal-body p-4 text-center">
          <div class="mb-3">
            <div 
              class="d-inline-flex p-3 rounded-circle"
              :class="confirmDialogState.confirmVariant === 'danger' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning'"
              style="width: 64px; height: 64px; display: inline-flex; align-items: center; justify-content: center;"
            >
              <i class="bi bi-trash3-fill fs-2" v-if="confirmDialogState.confirmVariant === 'danger'"></i>
              <i class="bi bi-exclamation-triangle-fill fs-2" v-else></i>
            </div>
          </div>
          <h5 class="fw-bold text-dark mb-2">{{ confirmDialogState.title }}</h5>
          <p class="text-secondary small mb-4 px-2">{{ confirmDialogState.message }}</p>
          <div class="d-flex justify-content-center gap-2">
            <button 
              type="button" 
              class="btn btn-light rounded-pill px-4 fw-semibold border"
              :disabled="confirmDialogState.loading"
              @click="closeConfirmDialog"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn rounded-pill px-4 fw-bold text-white d-flex align-items-center gap-2 shadow-sm"
              :class="confirmDialogState.confirmVariant === 'danger' ? 'btn-danger' : 'btn-warning text-dark'"
              :disabled="confirmDialogState.loading"
              @click="handleConfirm"
            >
              <span v-if="confirmDialogState.loading" class="spinner-border spinner-border-sm"></span>
              {{ confirmDialogState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { confirmDialogState, closeConfirmDialog } from '../state';

async function handleConfirm() {
  if (confirmDialogState.onConfirm) {
    try {
      confirmDialogState.loading = true;
      await confirmDialogState.onConfirm();
    } catch (err) {
      console.error('Error executing confirmed action:', err);
    } finally {
      closeConfirmDialog();
    }
  } else {
    closeConfirmDialog();
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
