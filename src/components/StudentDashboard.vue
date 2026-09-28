<template>
  <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
    <div class="card-header bg-dark text-white p-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0"><i class="bi bi-speedometer2 me-2 text-info"></i>Student Dashboard</h2>
          <p class="mb-0 text-white text-opacity-75 small">Welcome, {{ authState.user ? authState.user.name : 'Guest Student' }}. View upcoming classes, check attendance logs, and ask questions.</p>
        </div>
        <span class="badge bg-info text-dark fs-6 rounded-pill px-4 py-2 shadow-sm">
          <i class="bi bi-person-fill-check me-1"></i> {{ authState.user?.role === 'online_student' ? 'Online Student' : 'Offline Student' }}
        </span>
      </div>
    </div>

    <div class="card-body p-4 bg-light">
      <div class="row g-4">
        
        <!-- Left: Upcoming classes (Read-only for students) -->
        <div class="col-lg-6">
          <div class="card border-0 bg-white p-4 rounded-4 shadow-sm h-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="fw-bold text-dark m-0">
                <i class="bi bi-calendar3-event text-warning me-2"></i>Upcoming classes
              </h5>
              <span class="badge bg-warning bg-opacity-15 text-dark rounded-pill px-3 py-1 small fw-semibold">
                {{ schedules.length }} Scheduled
              </span>
            </div>
            <p class="text-muted small mb-3">Check here regularly for your live class timings</p>
            
            <div v-if="schedules.length === 0" class="text-center py-5 text-muted small bg-light rounded-4">
              <i class="bi bi-calendar-x display-5 text-secondary d-block mb-2"></i>
              No upcoming classes scheduled right now. Check back soon!
            </div>
            <div v-else class="d-flex flex-column gap-2" style="max-height: 280px; overflow-y: auto;">
              <div v-for="slot in schedules" :key="slot.id" class="p-3 rounded-3 border bg-light bg-opacity-50 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="bg-warning bg-opacity-15 text-warning p-2 rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                    <i class="bi bi-clock-fill"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">{{ slot.slot_time }}</h6>
                    <small class="text-muted"><i class="bi bi-person-video3 me-1"></i>Conducted by Diwan Sir</small>
                  </div>
                </div>
                <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small fw-semibold">
                  <i class="bi bi-calendar-check me-1"></i>Upcoming
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Attendance Logs -->
        <div class="col-lg-6">
          <div class="card border-0 bg-white p-4 rounded-4 shadow-sm h-100">
            <h5 class="fw-bold text-dark mb-3"><i class="bi bi-calendar-check text-success me-1"></i>My Attendance Tracker</h5>
            
            <div class="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 mb-3 border">
              <div>
                <span class="text-muted small text-uppercase">My Present Rate</span>
                <h3 class="fw-bold text-dark m-0">{{ attendancePercentage }}%</h3>
              </div>
              <div class="text-end">
                <span class="badge bg-success rounded-pill px-3 py-1 mb-1">{{ attendanceLogs.filter(l => l.status === 'present').length }} Days Present</span>
                <br/>
                <span class="badge bg-danger rounded-pill px-3 py-1">{{ attendanceLogs.filter(l => l.status === 'absent').length }} Days Absent</span>
              </div>
            </div>

            <div v-if="attendanceLogs.length === 0" class="text-center py-4 text-muted small italic">
              No attendance logs marked by Diwan Sir for your account yet.
            </div>
            <div v-else class="list-group list-group-flush" style="max-height: 200px; overflow-y: auto;">
              <div v-for="log in attendanceLogs" :key="log.id" class="list-group-item d-flex justify-content-between align-items-center py-2 px-1">
                <span class="text-dark small"><i class="bi bi-calendar3 me-2"></i>{{ log.date }}</span>
                <span :class="['badge rounded-pill px-3 py-1 fw-bold', log.status === 'present' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger']">
                  {{ log.status === 'present' ? 'Present' : 'Absent' }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Doubt Clearing Section (Ask & view private doubts) -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card border-0 bg-white p-4 rounded-4 shadow-sm">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <div>
                <h5 class="fw-bold text-dark m-0"><i class="bi bi-question-circle text-info me-1"></i>Clear your doubts</h5>
                <p class="text-muted small mb-0">Ask Diwan Sir questions regarding accent, vocabulary, or grammar rules.</p>
              </div>
              <button class="btn btn-primary rounded-pill d-flex align-items-center gap-1" @click="openAskDoubtModal">
                <i class="bi bi-plus-circle"></i> Ask New Doubt
              </button>
            </div>

            <div v-if="doubts.length === 0" class="text-center py-5 bg-light rounded-4">
              <i class="bi bi-chat-right-text display-3 text-secondary"></i>
              <p class="text-muted mt-2 mb-0">You haven't asked any doubts yet. Click the button above to ask Diwan Sir!</p>
            </div>

            <div v-else class="row g-3">
              <div v-for="doubt in doubts" :key="doubt.id" class="col-md-6">
                <div class="card h-100 border border-secondary border-opacity-10 rounded-4 p-4 shadow-sm bg-light bg-opacity-25">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted small"><i class="bi bi-clock me-1"></i>Asked: {{ formatDate(doubt.created_at) }}</span>
                    <div class="d-flex align-items-center gap-1">
                      <span v-if="doubt.solution" class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1">Resolved</span>
                      <span v-else class="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-1">Awaiting</span>
                      <div v-if="!doubt.solution" class="btn-group btn-group-sm ms-2">
                        <button @click="openEditDoubt(doubt)" class="btn btn-sm btn-light border-0 py-0 px-2" title="Edit Question">
                          <i class="bi bi-pencil text-primary"></i>
                        </button>
                        <button @click="deleteDoubt(doubt.id)" class="btn btn-sm btn-light border-0 py-0 px-2" title="Delete Question">
                          <i class="bi bi-trash text-danger"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p class="fw-bold text-dark mb-3">Q: "{{ doubt.question }}"</p>
                  
                  <div class="p-3 rounded-3 bg-white border border-secondary border-opacity-10">
                    <h6 class="fw-bold text-info mb-2"><i class="bi bi-patch-question me-1 text-info"></i>Elucidation</h6>
                    <p class="text-secondary small mb-0 italic" v-if="doubt.solution">"{{ doubt.solution }}"</p>
                    <p class="text-muted small mb-0 italic" v-else>Hang tight! We’ll soon answer your question</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Ask / Edit Doubt Modal -->
    <div class="modal fade" id="askDoubtModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-chat-text me-2 text-warning"></i>
              {{ editingDoubtId ? 'Edit Your Doubt' : 'Ask Diwan Sir a Doubt' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="askDoubt">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label text-dark fw-semibold small">What is your question or confusion?</label>
                <textarea v-model="newDoubtQuestion" class="form-control" rows="4" placeholder="e.g. Sir, when do we use 'since' vs 'for' in present perfect tense?" required></textarea>
                <div class="form-text small text-muted">Be specific while asking your doubt and maintain a polite tone</div>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary rounded-pill px-4">
                {{ editingDoubtId ? 'Save Changes' : 'Submit Question' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { supabase } from './supabase';
import { authState, triggerPushNotification, openConfirmDialog } from '../state';
import { openModal, closeModal } from '../utils/modal';

const attendanceLogs = ref<any[]>([]);
const doubts = ref<any[]>([]);
const schedules = ref<any[]>([]);
const newDoubtQuestion = ref('');
const editingDoubtId = ref<number | null>(null);

function openAskDoubtModal() {
  editingDoubtId.value = null;
  newDoubtQuestion.value = '';
  openModal('askDoubtModal');
}

function openEditDoubt(doubt: any) {
  editingDoubtId.value = doubt.id;
  newDoubtQuestion.value = doubt.question;
  openModal('askDoubtModal');
}

// Computed present rate
const attendancePercentage = computed(() => {
  if (attendanceLogs.value.length === 0) return 100;
  const presentCount = attendanceLogs.value.filter(l => l.status === 'present').length;
  return Math.round((presentCount / attendanceLogs.value.length) * 100);
});

// Format date helper
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

// Fetch Supabase data
async function fetchAttendance() {
  if (!authState.user?.id) return;
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', authState.user.id);
    if (error) throw error;
    attendanceLogs.value = data || [];
  } catch (err) {
    console.error('Error attendance:', err);
  }
}

async function fetchDoubts() {
  if (!authState.user?.id) return;
  try {
    const { data, error } = await supabase
      .from('doubts')
      .select('*')
      .eq('student_id', authState.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    doubts.value = data || [];
  } catch (err) {
    console.error('Error doubts:', err);
  }
}

async function fetchSchedules() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    schedules.value = data || [];
  } catch (err) {
    console.error('Error schedules:', err);
  }
}

// Student asks or edits doubt
async function askDoubt() {
  try {
    let error;
    const wasEdit = !!editingDoubtId.value;

    if (wasEdit) {
      const res = await supabase
        .from('doubts')
        .update({ question: newDoubtQuestion.value })
        .eq('id', editingDoubtId.value);
      error = res.error;
    } else {
      const res = await supabase
        .from('doubts')
        .insert([{
          question: newDoubtQuestion.value,
          student_id: authState.user?.id,
          student_name: authState.user?.name || 'Student'
        }]);
      error = res.error;
    }

    if (error) throw error;

    newDoubtQuestion.value = '';
    editingDoubtId.value = null;
    await fetchDoubts();
    closeModal('askDoubtModal');
    triggerPushNotification(
      wasEdit ? 'Doubt Updated' : 'Doubt Submitted',
      wasEdit ? 'Your updated question has been sent to Diwan Sir.' : 'Your doubt is posted privately to Diwan Sir.'
    );
  } catch (err) {
    console.error('Error asking doubt:', err);
  }
}

function deleteDoubt(id: number) {
  openConfirmDialog({
    title: 'Delete Question',
    message: 'Are you sure you want to delete this doubt?',
    confirmText: 'Delete Question',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const { error } = await supabase
        .from('doubts')
        .delete()
        .eq('id', id);

      if (!error) {
        await fetchDoubts();
        triggerPushNotification('Question Removed', 'Your doubt was deleted.');
      }
    }
  });
}

watch(() => authState.isLoggedIn, () => {
  fetchAttendance();
  fetchDoubts();
  fetchSchedules();
});

onMounted(() => {
  fetchAttendance();
  fetchDoubts();
  fetchSchedules();
});
</script>

<style scoped>
.italic {
  font-style: italic;
}
.btn-xs {
  padding: .25rem .4rem;
  font-size: .875rem;
  line-height: .5;
  border-radius: .2rem;
}
</style>
