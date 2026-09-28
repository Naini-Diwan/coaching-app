<template>
  <div class="min-h-100 bg-light-gray font-sans pb-5">
    
    <!-- Real-time Push Notification Hub Toaster -->
    <NotificationToast />

    <!-- Confirmation Modal Dialog (Safe for iframe) -->
    <ConfirmModal />

    <!-- Navbar header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3 mb-4 sticky-top">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="#">
          <img
            :src="logoUrl"
            alt="Diwan Sir Logo"
            class="rounded-circle object-fit-cover border border-2 border-warning shadow-sm"
            style="width: 44px; height: 44px;"
            referrerPolicy="no-referrer"
            @error="onLogoError"
            v-if="!logoFailed"
          />
          <div v-else class="bg-warning text-dark p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 44px; height: 44px;">
            <i class="bi bi-person-fill fs-5"></i>
          </div>
          <div>
            <span class="fw-bold fs-5 d-block text-white m-0">Diwan Sir</span>
            <span class="text-warning fw-semibold small uppercase text-opacity-75" style="letter-spacing: 1px; font-size: 0.7rem;">Spoken English Classes</span>
          </div>
        </a>

        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
          <i class="bi bi-list fs-2 text-white"></i>
        </button>

        <div class="collapse navbar-collapse" id="navbarText">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0"></ul>

          <div class="d-flex align-items-center flex-wrap gap-3">
            <!-- Role Badge -->
            <span class="badge rounded-pill bg-light text-dark shadow-sm py-2 px-3 fw-semibold border">
              <span v-if="authState.isLoggedIn">
                <i class="bi bi-person-fill-check text-success me-1"></i>
                {{ authState.user?.name }} ({{ authState.user?.role === 'instructor' ? 'Instructor' : authState.user?.role === 'online_student' ? 'Online Student' : 'Offline Student' }})
              </span>
              <span v-else>
                <i class="bi bi-eye-fill text-muted me-1"></i> Guest View
              </span>
            </span>

            <!-- Auth action -->
            <button v-if="authState.isLoggedIn" @click="handleLogout" class="btn btn-outline-warning rounded-pill px-4 fw-semibold small shadow-sm">
              <i class="bi bi-box-arrow-left me-1"></i> Sign Out
            </button>
            <button v-else class="btn btn-warning rounded-pill px-4 fw-semibold small shadow-sm text-dark" data-bs-toggle="modal" data-bs-target="#loginModalBack">
              <i class="bi bi-box-arrow-in-right me-1"></i> Sign In / Register
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container">
      
      <!-- Announcement / Banner Hero Board -->
      <div class="bg-gradient bg-warning bg-opacity-10 rounded-4 border border-warning border-opacity-25 p-4 mb-4 shadow-sm position-relative overflow-hidden">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h1 class="fw-bold text-dark display-6 mb-2">Speak English with Ultimate Confidence!</h1>
            <p class="text-secondary mb-0">In today’s competitive landscape, the ability to speak English with clarity is your greatest asset. We bridge the gap between basic grammar and executive-level fluency, ensuring your voice is heard and respected in every boardroom.</p>
          </div>
          <div class="col-md-4 text-md-end mt-3 mt-md-0">
            <div class="d-inline-flex bg-warning bg-opacity-15 p-3 rounded-circle shadow-sm">
              <i class="bi bi- megaphone-fill text-warning fs-1"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Setup Banner if Guest -->
      <div v-if="!authState.isLoggedIn" class="row mb-4">
        <div class="col-12">
          <div class="alert alert-info alert-dismissible fade show border-0 shadow-sm rounded-4 p-4 d-flex justify-content-between align-items-center flex-wrap gap-3" role="alert">
            <div>
              <h5 class="fw-bold text-dark mb-1"><i class="bi bi-info-circle-fill me-2 text-info"></i>Looks like you aren't signed in!</h5>
              <p class="text-secondary m-0 small">To get an access to regular classes, study material and ask doubts, please log in. For queries regarding class enrollment and the issuance of login credentials, please contact Mr. Virendra Diwan at <strong>+91-9826531295</strong>.</p>
            </div>
            <button class="btn btn-sm btn-info rounded-pill px-4 fw-bold text-white text-nowrap shadow-sm" data-bs-toggle="modal" data-bs-target="#loginModalBack">
              Sign in
            </button>
          </div>
        </div>
      </div>

      <!-- Registered Main Layout (Instructor / Student) -->
      <template v-if="authState.isLoggedIn">
        <div class="row g-4">
          <!-- Announcements Board Section -->
          <div class="col-lg-4">
            <ClassroomNews
              :announcements="announcements"
              @open-ann-modal="openAnnModal"
              @delete-announcement="deleteAnnouncement"
            />
          </div>

          <!-- Instructor or Student Dashboards -->
          <div class="col-lg-8">
            <!-- Case 1: Instructor View -->
            <InstructorDashboard v-if="authState.user?.role === 'instructor'" />

            <!-- Case 2: Student View -->
            <StudentDashboard v-else />
          </div>
        </div>

        <!-- Practice & Learning Hub: Full horizontal area -->
        <div class="row mt-4">
          <div class="col-12">
            <PracticeSection />
          </div>
        </div>
      </template>

      <!-- Unregistered (Guest) Layout: Classroom News on the left of Practice and Learning Hub -->
      <template v-else>
        <div class="row g-4">
          <div class="col-lg-4">
            <ClassroomNews
              :announcements="announcements"
              @open-ann-modal="openAnnModal"
              @delete-announcement="deleteAnnouncement"
            />
          </div>

          <div class="col-lg-8">
            <PracticeSection />
          </div>
        </div>
      </template>

    </div>

    <!-- Sign In Modal -->
    <div class="modal fade" id="loginModalBack" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header border-0 pb-0">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" ref="closeLoginModalBtn"></button>
          </div>
          <div class="modal-body p-4 pt-0">
            <LoginModal @success="onLoginSuccess" />
          </div>
        </div>
      </div>
    </div>

    <!-- Announcement Add/Edit Modal (Instructor Only) -->
    <div class="modal fade" id="announcementModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold">{{ editingAnnId ? 'Edit Announcement' : 'Post New Announcement' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="saveAnnouncement">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label text-dark fw-semibold small">Title</label>
                <input v-model="annForm.title" type="text" class="form-control" placeholder="e.g. Wednesday Class Cancelled" required />
              </div>
              <div class="mb-3">
                <label class="form-label text-dark fw-semibold small">Announcement Content / Details</label>
                <textarea v-model="annForm.content" class="form-control" rows="4" placeholder="Enter full announcement details here..." required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label text-dark fw-semibold small">Lecture/Video URL (optional)</label>
                <input v-model="annForm.url" type="url" class="form-control" placeholder="https://zoom.us/..." />
              </div>
              <div class="mb-3">
                <label class="form-label text-dark fw-semibold small">Target Audience</label>
                <select v-model="annForm.audience" class="form-select" required>
                  <option value="open">Open (Visible to Everyone)</option>
                  <option value="both">Both Online and Offline Students</option>
                  <option value="online">Online Students Only</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-danger rounded-pill px-4">
                {{ editingAnnId ? 'Save Changes' : 'Post Announcement' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import { authState, triggerPushNotification, openConfirmDialog } from './state';
import { openModal, closeModal } from './utils/modal';
import LoginModal from './components/LoginModal.vue';
import ClassroomNews from './components/ClassroomNews.vue';
import InstructorDashboard from './components/InstructorDashboard.vue';
import StudentDashboard from './components/StudentDashboard.vue';
import PracticeSection from './components/PracticeSection.vue';
import NotificationToast from './components/NotificationToast.vue';
import ConfirmModal from './components/ConfirmModal.vue';

const logoUrl = ref('/diwan-sir-logo.jpg');
const logoFailed = ref(false);
function onLogoError() {
  logoFailed.value = true;
}

const announcements = ref<any[]>([]);
const closeLoginModalBtn = ref<any>(null);

// Forms
const editingAnnId = ref<number | null>(null);
const annForm = reactive({
  title: '',
  content: '',
  url: '',
  audience: 'open'
});

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAudienceClass(audience: string) {
  switch (audience) {
    case 'open': return 'bg-success bg-opacity-10 text-success';
    case 'both': return 'bg-primary bg-opacity-10 text-primary';
    case 'online': return 'bg-info bg-opacity-10 text-dark';
    default: return 'bg-secondary bg-opacity-10 text-secondary';
  }
}

// Fetch Announcements
async function fetchAnnouncements() {
  try {
    const headers: Record<string, string> = {};
    if (authState.isLoggedIn && authState.user) {
      headers['X-User-Id'] = String(authState.user.id);
      headers['X-User-Role'] = authState.user.role;
    }
    const res = await fetch('/api/announcements', { headers });
    announcements.value = await res.json();
  } catch (err) {
    console.error('Error announcements:', err);
  }
}

// Post Announcement
function openAnnModal(ann: any | null) {
  if (ann) {
    editingAnnId.value = ann.id;
    annForm.title = ann.title;
    annForm.content = ann.content;
    annForm.url = ann.url;
    annForm.audience = ann.audience;
  } else {
    editingAnnId.value = null;
    annForm.title = '';
    annForm.content = '';
    annForm.url = '';
    annForm.audience = 'open';
  }
  openModal('announcementModal');
}

async function saveAnnouncement() {
  try {
    const method = editingAnnId.value ? 'PUT' : 'POST';
    const endpoint = editingAnnId.value ? `/api/announcements/${editingAnnId.value}` : '/api/announcements';
    
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      },
      body: JSON.stringify(annForm),
    });

    const data = await res.json();
    if (data.success) {
      await fetchAnnouncements();
      closeModal('announcementModal');
      triggerPushNotification(
        editingAnnId.value ? 'Announcement Updated' : 'Announcement Saved',
        `Broadcast: ${annForm.title}`
      );
    }
  } catch (err) {
    console.error('Error saving announcement:', err);
  }
}

function deleteAnnouncement(id: number) {
  openConfirmDialog({
    title: 'Delete Announcement',
    message: 'Are you sure you want to delete this announcement? It will be removed from the classroom news feed.',
    confirmText: 'Delete Alert',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': String(authState.user?.id),
          'X-User-Role': authState.user?.role || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnnouncements();
        triggerPushNotification('Announcement Removed', 'The alert has been removed from the feed.');
      }
    }
  });
}

// Auth handlers
function onLoginSuccess() {
  if (closeLoginModalBtn.value) {
    closeLoginModalBtn.value.click();
  }
}

function handleLogout() {
  const oldName = authState.user?.name || '';
  authState.user = null;
  authState.isLoggedIn = false;
  triggerPushNotification('Logged Out', `Goodbye ${oldName}! See you next class.`);
}

// Watchers
watch(() => authState.isLoggedIn, () => {
  fetchAnnouncements();
});

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style>
.bg-light-gray {
  background-color: #f6f8fa;
}
.hover-shadow:hover {
  box-shadow: 0 .25rem 1rem rgba(0,0,0,.04) !important;
}
.btn-xs {
  padding: .2rem .5rem;
  font-size: .75rem;
}
.uppercase {
  text-transform: uppercase;
}
</style>
