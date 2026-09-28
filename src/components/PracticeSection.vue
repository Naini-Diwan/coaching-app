<template>
  <div class="card shadow-sm border-0 rounded-4">
    <div class="card-header bg-white border-bottom-0 pt-4 px-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 class="fw-bold text-dark m-0">Practice & Learning Hub</h3>
          <p class="text-muted mb-0">Master your pronunciation, vocabulary, grammar, and literature</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs nav-fill mt-4 border-0 bg-light p-1 rounded-3" id="practiceTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active rounded-3 border-0 py-2 fw-semibold" id="materials-tab" data-bs-toggle="tab" data-bs-target="#materials-pane" type="button" role="tab" aria-controls="materials-pane" aria-selected="true">
            <i class="bi bi-book me-2 text-primary"></i>Study Materials
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link rounded-3 border-0 py-2 fw-semibold" id="idioms-tab" data-bs-toggle="tab" data-bs-target="#idioms-pane" type="button" role="tab" aria-controls="idioms-pane" aria-selected="false">
            <i class="bi bi-chat-quote me-2 text-success"></i>Idioms & Phrasal Verbs
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link rounded-3 border-0 py-2 fw-semibold" id="speaking-tab" data-bs-toggle="tab" data-bs-target="#speaking-pane" type="button" role="tab" aria-controls="speaking-pane" aria-selected="false">
            <i class="bi bi-mic me-2 text-danger"></i>Speaking Practice Feedback
          </button>
        </li>
      </ul>
    </div>

    <div class="card-body p-4">
      <div class="tab-content" id="practiceTabsContent">
        
        <!-- Tab 1: Study Materials -->
        <div class="tab-pane fade show active" id="materials-pane" role="tabpanel" aria-labelledby="materials-tab">
          <!-- Filter Buttons and Search -->
          <div class="row g-3 mb-4 align-items-center">
            <div class="col-md-7 d-flex flex-wrap gap-2">
              <button @click="materialCategory = 'all'" :class="['btn btn-sm rounded-pill px-3 fw-semibold', materialCategory === 'all' ? 'btn-dark' : 'btn-outline-dark']">All</button>
              <button @click="materialCategory = 'accent'" :class="['btn btn-sm rounded-pill px-3 fw-semibold', materialCategory === 'accent' ? 'btn-primary' : 'btn-outline-primary']">Pronunciation & Accent</button>
              <button @click="materialCategory = 'vocabulary'" :class="['btn btn-sm rounded-pill px-3 fw-semibold', materialCategory === 'vocabulary' ? 'btn-success' : 'btn-outline-success']">Vocabulary</button>
              <button @click="materialCategory = 'grammar'" :class="['btn btn-sm rounded-pill px-3 fw-semibold', materialCategory === 'grammar' ? 'btn-info' : 'btn-outline-info']">Grammar</button>
              <button @click="materialCategory = 'literature'" :class="['btn btn-sm rounded-pill px-3 fw-semibold', materialCategory === 'literature' ? 'btn-warning' : 'btn-outline-warning']">Literature</button>
            </div>
            <div class="col-md-5 d-flex gap-2">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                <input v-model="materialSearch" type="text" class="form-control border-start-0 ps-0" placeholder="Search lessons...">
              </div>
              <!-- Add Button if Instructor or if Student Editing permitted -->
              <button v-if="canEdit" class="btn btn-primary d-flex align-items-center gap-1 text-nowrap" @click="openMaterialModal(null)">
                <i class="bi bi-plus-lg"></i> Add Content
              </button>
            </div>
          </div>

          <!-- Materials Grid -->
          <div v-if="filteredMaterials.length === 0" class="text-center py-5 bg-light rounded-4">
            <i class="bi bi-journal-x display-3 text-muted"></i>
            <p class="text-muted mt-2 mb-0">No study materials found.</p>
          </div>
          <div v-else class="row g-4">
            <div v-for="item in filteredMaterials" :key="item.id" class="col-12 col-md-6 col-xxl-4">
              <div class="card h-100 border border-secondary border-opacity-10 shadow-sm rounded-4 hover-lift overflow-hidden bg-white">
                <div class="position-relative">
                  <img v-if="item.image_url" :src="item.image_url" class="card-img-top object-fit-cover" style="height: 150px; width: 100%;" alt="Lesson Image" @error="item.image_url = ''">
                  <div v-else class="card-img-top bg-gradient text-white d-flex align-items-center justify-content-center" :class="getCategoryBg(item.category)" style="height: 150px; width: 100%;">
                    <i class="bi display-5" :class="getCategoryIcon(item.category)"></i>
                  </div>
                  <!-- Public / Enrolled Status Badge -->
                  <div class="position-absolute top-0 end-0 p-2 d-flex gap-1">
                    <span v-if="item.is_public !== 0" class="badge bg-success bg-opacity-90 shadow-sm rounded-pill px-2 py-1 small">
                      <i class="bi bi-globe me-1"></i>Public
                    </span>
                    <span v-else class="badge bg-dark bg-opacity-80 shadow-sm rounded-pill px-2 py-1 small">
                      <i class="bi bi-lock-fill me-1"></i>Enrolled Only
                    </span>
                  </div>
                </div>

                <div class="card-body p-3 p-md-4 d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge rounded-pill py-1 px-3 fw-semibold text-uppercase" :class="getBadgeClass(item.category)">
                      {{ item.category === 'accent' ? 'Pronunciation' : item.category }}
                    </span>
                  </div>
                  <h5 class="card-title fw-bold text-dark mb-2 text-break">{{ item.title }}</h5>
                  <p class="card-text text-muted flex-grow-1 small line-clamp-3 mb-3">{{ item.content }}</p>
                  
                  <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <a v-if="item.url" :href="item.url" target="_blank" class="btn btn-sm btn-outline-dark rounded-pill px-3">
                      <i class="bi bi-box-arrow-up-right me-1"></i> Open Link
                    </a>
                    <span v-else class="text-muted small italic">No external link</span>
                    
                    <!-- Instructor Edit Actions & Public Toggle -->
                    <div v-if="canEdit" class="d-flex align-items-center gap-1">
                      <button
                        v-if="authState.user?.role === 'instructor'"
                        @click="toggleMaterialPublic(item)"
                        type="button"
                        class="btn btn-sm rounded-pill px-2 py-0 border-0"
                        :class="item.is_public !== 0 ? 'btn-outline-success' : 'btn-outline-secondary'"
                        :title="item.is_public !== 0 ? 'Click to make Enrolled Only' : 'Click to make Public'"
                      >
                        <i class="bi" :class="item.is_public !== 0 ? 'bi-globe' : 'bi-lock-fill'"></i>
                        <span class="small ms-1" style="font-size: 0.72rem;">{{ item.is_public !== 0 ? 'Public' : 'Private' }}</span>
                      </button>
                      <div class="btn-group btn-group-sm">
                        <button @click="openMaterialModal(item)" class="btn btn-light border-0" title="Edit"><i class="bi bi-pencil text-primary"></i></button>
                        <button @click="deleteMaterial(item.id)" class="btn btn-light border-0" title="Delete"><i class="bi bi-trash text-danger"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Idioms & Phrasal Verbs -->
        <div class="tab-pane fade" id="idioms-pane" role="tabpanel" aria-labelledby="idioms-tab">
          <!-- Search & Add -->
          <div class="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
            <div class="input-group max-w-md">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model="idiomSearch" type="text" class="form-control border-start-0 ps-0" placeholder="Search idiom decks...">
            </div>
            <button v-if="canEdit" class="btn btn-success d-flex align-items-center gap-1 text-nowrap" @click="openIdiomModal(null)">
              <i class="bi bi-plus-lg"></i> Add Idiom Card
            </button>
          </div>

          <!-- Idioms Grid -->
          <div v-if="filteredIdioms.length === 0" class="text-center py-5 bg-light rounded-4">
            <i class="bi bi-chat-quote display-3 text-muted"></i>
            <p class="text-muted mt-2 mb-0">No idiom decks found.</p>
          </div>
          <div v-else class="row g-3">
            <div v-for="item in filteredIdioms" :key="item.id" class="col-12 col-md-6 col-xxl-6">
              <div class="card h-100 border-0 bg-light p-3 p-md-4 rounded-4 hover-shadow d-flex flex-column">
                <!-- Header row: Icon + Idiom Deck Pill at top-right -->
                <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                  <div class="bg-white p-2 rounded-3 shadow-sm border border-secondary border-opacity-10 text-success d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                    <i class="bi bi-chat-quote-fill fs-5"></i>
                  </div>
                  <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-bold">Idiom Deck</span>
                </div>

                <!-- Phrase, Meaning & Usage -->
                <div class="flex-grow-1">
                  <h5 class="fw-bold text-dark mb-2 text-break">{{ item.phrase }}</h5>
                  <p class="text-muted mb-3 small lh-base">
                    <strong class="text-dark">Meaning:</strong> {{ item.meaning }}
                  </p>
                  <div class="bg-white p-3 rounded-3 border border-secondary border-opacity-10 small text-secondary">
                    <div class="d-flex align-items-start gap-2">
                      <i class="bi bi-info-circle-fill text-success mt-1"></i>
                      <div>
                        <strong class="text-dark d-block mb-1">Example:</strong>
                        <span>"{{ item.usage }}"</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Instructor Action Row -->
                <div v-if="canEdit" class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                  <button
                    v-if="authState.user?.role === 'instructor'"
                    @click="toggleIdiomPublic(item)"
                    type="button"
                    class="btn btn-sm rounded-pill px-2 py-0 border-0"
                    :class="item.is_public !== 0 ? 'btn-outline-success' : 'btn-outline-secondary'"
                    :title="item.is_public !== 0 ? 'Click to make Enrolled Only' : 'Click to make Public'"
                  >
                    <i class="bi" :class="item.is_public !== 0 ? 'bi-globe' : 'bi-lock-fill'"></i>
                    <span class="small ms-1" style="font-size: 0.72rem;">{{ item.is_public !== 0 ? 'Public' : 'Private' }}</span>
                  </button>
                  <div class="ms-auto d-flex gap-1">
                    <button @click="openIdiomModal(item)" class="btn btn-sm btn-white border shadow-sm rounded-circle p-1 px-2" title="Edit"><i class="bi bi-pencil text-primary"></i></button>
                    <button @click="deleteIdiom(item.id)" class="btn btn-sm btn-white border shadow-sm rounded-circle p-1 px-2" title="Delete"><i class="bi bi-trash text-danger"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Speaking Practice Feedback -->
        <div class="tab-pane fade" id="speaking-pane" role="tabpanel" aria-labelledby="speaking-tab">
          <!-- Unregistered view warning -->
          <div v-if="!authState.isLoggedIn" class="text-center py-5 bg-light rounded-4">
            <i class="bi bi-shield-lock display-3 text-muted"></i>
            <h5 class="fw-bold mt-3">Authentication Required</h5>
            <p class="text-muted mb-4 max-w-md mx-auto">Only registered students can upload speaking exercises and receive private feedbacks from Diwan Sir.</p>
          </div>
          
          <div v-else>
            <!-- Header with upload button for students -->
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h5 class="fw-bold m-0 text-dark">
                {{ authState.user.role === 'instructor' ? 'Speaking Submissions from Students' : 'My English Speaking Practice Logs' }}
              </h5>
              <button v-if="authState.user?.role !== 'instructor'" class="btn btn-danger d-flex align-items-center gap-1" @click="openUploadVideoModal">
                <i class="bi bi-cloud-arrow-up"></i> Upload Speaking Exercise
              </button>
            </div>

            <div v-if="videos.length === 0" class="text-center py-5 bg-light rounded-4">
              <i class="bi bi-play-btn display-3 text-muted"></i>
              <p class="text-muted mt-2 mb-0">No speaking submissions log yet.</p>
            </div>
            
            <div v-else class="row g-4">
              <div v-for="video in videos" :key="video.id" class="col-12">
                <div class="card border border-secondary border-opacity-10 rounded-4 overflow-hidden shadow-sm">
                  <div class="row g-0">
                    <div class="col-md-5 bg-dark d-flex flex-column align-items-center justify-content-center p-4 text-center border-md-end text-white min-h-200">
                      <i class="bi bi-file-earmark-play display-4 text-danger mb-2"></i>
                      <h5 class="fw-bold text-wrap mb-1">{{ video.title }}</h5>
                      <span class="badge bg-secondary mb-3">By {{ video.student_name }}</span>
                      <a :href="video.video_url" target="_blank" class="btn btn-sm btn-danger rounded-pill px-4">
                        <i class="bi bi-youtube me-1"></i> Watch Student's Video
                      </a>
                    </div>
                    <div class="col-md-7 p-4 d-flex flex-column">
                      <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <span class="text-muted small"><i class="bi bi-clock me-1"></i>Submitted: {{ formatDate(video.created_at) }}</span>
                        <div class="d-flex align-items-center gap-2">
                          <span v-if="video.feedback_text" class="badge bg-success rounded-pill px-3 py-1">Feedback Provided</span>
                          <span v-else class="badge bg-warning text-dark rounded-pill px-3 py-1">Pending Feedback</span>
                          <div v-if="canManageVideo(video)" class="btn-group btn-group-sm">
                            <button @click="openEditVideoModal(video)" class="btn btn-light border-0 py-0 px-2" title="Edit Video Details">
                              <i class="bi bi-pencil text-primary"></i>
                            </button>
                            <button @click="deleteVideo(video.id)" class="btn btn-light border-0 py-0 px-2" title="Delete Video">
                              <i class="bi bi-trash text-danger"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <p class="text-dark small mb-3">
                        <strong>Description:</strong> {{ video.description || 'No description provided.' }}
                      </p>
                      
                      <div class="bg-light p-3 rounded-3 flex-grow-1 border">
                        <h6 class="fw-bold mb-2 text-primary d-flex align-items-center gap-1">
                          <i class="bi bi-chat-left-heart"></i> Diwan Sir's Feedback
                        </h6>
                        <div v-if="video.feedback_text">
                          <p class="mb-0 text-dark small italic">"{{ video.feedback_text }}"</p>
                        </div>
                        <p v-else class="text-muted small m-0 italic">Waiting for Diwan Sir's assessment and speaking feedback.</p>
                      </div>

                      <!-- Instructor leaves feedback form -->
                      <div v-if="authState.user?.role === 'instructor'" class="mt-3 pt-3 border-top">
                        <form @submit.prevent="submitFeedback(video.id)">
                          <div class="mb-2">
                            <textarea v-model="feedbackForm[video.id]" class="form-control form-control-sm" rows="2" placeholder="Write spoken/grammar improvement tips here..." required></textarea>
                          </div>
                          <div class="text-end">
                            <button type="submit" class="btn btn-sm btn-primary px-4">Submit Assessment</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Material Edit/Add Modal -->
    <div class="modal fade" id="materialModal" tabindex="-1" aria-hidden="true" ref="materialModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold">{{ editingMaterialId ? 'Edit Study Material' : 'Add Study Material' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="saveMaterial">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Category</label>
                <select v-model="materialForm.category" class="form-select" required>
                  <option value="accent">Accent & Pronunciation</option>
                  <option value="vocabulary">Vocabulary & Phrases</option>
                  <option value="grammar">Grammar Rules</option>
                  <option value="literature">Literature & Contexts</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Title</label>
                <input v-model="materialForm.title" type="text" class="form-control" placeholder="Enter lesson title..." required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Content Detail</label>
                <textarea v-model="materialForm.content" class="form-control" rows="4" placeholder="Explain rules, tips or descriptions..."></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Resource URL (optional)</label>
                <input v-model="materialForm.url" type="url" class="form-control" placeholder="https://...">
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Image URL (optional)</label>
                <input v-model="materialForm.image_url" type="url" class="form-control" placeholder="https://images.unsplash.com/...">
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Access Visibility</label>
                <select v-model="materialForm.is_public" class="form-select">
                  <option :value="1">Public (Accessible to everyone including unregistered guests)</option>
                  <option :value="0">Enrolled Students Only (Requires login)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary rounded-pill px-4">
                {{ editingMaterialId ? 'Save Changes' : 'Save Material' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Idiom Edit/Add Modal -->
    <div class="modal fade" id="idiomModal" tabindex="-1" aria-hidden="true" ref="idiomModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold">{{ editingIdiomId ? 'Edit Idiom Deck' : 'Add Idiom Deck' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="saveIdiom">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Phrase / Idiom</label>
                <input v-model="idiomForm.phrase" type="text" class="form-control" placeholder="e.g., Hit the sack" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Meaning</label>
                <input v-model="idiomForm.meaning" type="text" class="form-control" placeholder="Explain the meaning..." required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Usage / Example Sentence</label>
                <textarea v-model="idiomForm.usage" class="form-control" rows="3" placeholder="Write a real-life usage example..." required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Access Visibility</label>
                <select v-model="idiomForm.is_public" class="form-select">
                  <option :value="1">Public (Accessible to everyone including unregistered guests)</option>
                  <option :value="0">Enrolled Students Only (Requires login)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-success rounded-pill px-4">
                {{ editingIdiomId ? 'Save Changes' : 'Save Idiom' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Video Submission Upload Modal (Students) -->
    <div class="modal fade" id="uploadVideoModal" tabindex="-1" aria-hidden="true" ref="uploadVideoModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-danger text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-mic-fill me-2"></i>
              {{ editingVideoId ? 'Edit Speaking Practice' : 'Submit Your Speaking Practice' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="submitVideo">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Topic / Title of Video</label>
                <input v-model="videoForm.title" type="text" class="form-control" placeholder="e.g., My daily routine speaking" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Video link (Google Drive / YouTube / Cloud Link)</label>
                <input v-model="videoForm.video_url" type="url" class="form-control" placeholder="https://youtube.com/... or Google Drive URL" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Description / Challenges you faced</label>
                <textarea v-model="videoForm.description" class="form-control" rows="3" placeholder="Tell Diwan sir if you felt nervous, had pacing issues, etc."></textarea>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-danger rounded-pill px-4">
                {{ editingVideoId ? 'Save Changes' : 'Submit Speaking Exercise' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { authState, triggerPushNotification, openConfirmDialog } from '../state';
import { openModal, closeModal } from '../utils/modal';

// State refs
const materials = ref<any[]>([]);
const idioms = ref<any[]>([]);
const videos = ref<any[]>([]);

const materialCategory = ref('all');
const materialSearch = ref('');
const idiomSearch = ref('');

// Forms
const editingMaterialId = ref<number | null>(null);
const materialForm = reactive({
  category: 'accent',
  title: '',
  content: '',
  url: '',
  image_url: '',
  is_public: 1
});

const editingIdiomId = ref<number | null>(null);
const idiomForm = reactive({
  phrase: '',
  meaning: '',
  usage: '',
  is_public: 1
});

const editingVideoId = ref<number | null>(null);
const videoForm = reactive({
  title: '',
  video_url: '',
  description: ''
});

const feedbackForm = ref<Record<number, string>>({});

// Edit Perms (Instructor only)
const canEdit = computed(() => {
  return authState.isLoggedIn && authState.user?.role === 'instructor';
});

function canManageVideo(video: any): boolean {
  if (!authState.isLoggedIn || !authState.user) return false;
  if (authState.user?.role === 'instructor') return true;
  return video.student_id === authState.user.id;
}

// Category classes & helpers
function getCategoryBg(category: string) {
  switch (category) {
    case 'accent': return 'bg-primary text-white';
    case 'vocabulary': return 'bg-success text-white';
    case 'grammar': return 'bg-info text-white';
    case 'literature': return 'bg-warning text-dark';
    default: return 'bg-secondary text-white';
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'accent': return 'bi-megaphone';
    case 'vocabulary': return 'bi-translate';
    case 'grammar': return 'bi-body-text';
    case 'literature': return 'bi-book';
    default: return 'bi-journal-text';
  }
}

function getBadgeClass(category: string) {
  switch (category) {
    case 'accent': return 'bg-primary bg-opacity-10 text-primary';
    case 'vocabulary': return 'bg-success bg-opacity-10 text-success';
    case 'grammar': return 'bg-info bg-opacity-10 text-info';
    case 'literature': return 'bg-warning bg-opacity-10 text-warning';
    default: return 'bg-secondary bg-opacity-10 text-secondary';
  }
}

// Format date helper
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

// Computed filters
const filteredMaterials = computed(() => {
  return materials.value.filter(item => {
    // Unregistered guest: ONLY accessible if enabled as Public
    if (!authState.isLoggedIn && item.is_public === 0) return false;
    const matchesCat = materialCategory.value === 'all' || item.category === materialCategory.value;
    const matchesSearch = item.title.toLowerCase().includes(materialSearch.value.toLowerCase()) ||
                          (item.content || '').toLowerCase().includes(materialSearch.value.toLowerCase());
    return matchesCat && matchesSearch;
  });
});

const filteredIdioms = computed(() => {
  return idioms.value.filter(item => {
    // Unregistered guest: ONLY accessible if enabled as Public
    if (!authState.isLoggedIn && item.is_public === 0) return false;
    return item.phrase.toLowerCase().includes(idiomSearch.value.toLowerCase()) ||
           item.meaning.toLowerCase().includes(idiomSearch.value.toLowerCase()) ||
           item.usage.toLowerCase().includes(idiomSearch.value.toLowerCase());
  });
});

// Fetch APIs
async function fetchMaterials() {
  try {
    const headers: Record<string, string> = {};
    if (authState.isLoggedIn && authState.user) {
      headers['X-User-Id'] = String(authState.user.id);
      headers['X-User-Role'] = authState.user.role || '';
    }
    const res = await fetch('/api/practice-materials', { headers });
    materials.value = await res.json();
  } catch (err) {
    console.error('Error materials:', err);
  }
}

async function fetchIdioms() {
  try {
    const headers: Record<string, string> = {};
    if (authState.isLoggedIn && authState.user) {
      headers['X-User-Id'] = String(authState.user.id);
      headers['X-User-Role'] = authState.user.role || '';
    }
    const res = await fetch('/api/idioms', { headers });
    idioms.value = await res.json();
  } catch (err) {
    console.error('Error idioms:', err);
  }
}

async function fetchVideos() {
  if (!authState.isLoggedIn) return;
  try {
    const headers: Record<string, string> = {
      'X-User-Id': String(authState.user?.id),
      'X-User-Role': authState.user?.role || '',
    };
    const res = await fetch('/api/practice-videos', { headers });
    videos.value = await res.json();
  } catch (err) {
    console.error('Error videos:', err);
  }
}

// 1-Click Visibility Toggles for Instructor
async function toggleMaterialPublic(item: any) {
  try {
    const res = await fetch(`/api/practice-materials/${item.id}/toggle-public`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      }
    });
    const data = await res.json();
    if (data.success) {
      item.is_public = data.is_public;
      triggerPushNotification(
        'Access Updated',
        `"${item.title}" is now ${data.is_public === 1 ? 'Public' : 'Enrolled Students Only'}`
      );
    }
  } catch (err) {
    console.error('Error toggling material public:', err);
  }
}

async function toggleIdiomPublic(item: any) {
  try {
    const res = await fetch(`/api/idioms/${item.id}/toggle-public`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      }
    });
    const data = await res.json();
    if (data.success) {
      item.is_public = data.is_public;
      triggerPushNotification(
        'Access Updated',
        `"${item.phrase}" is now ${data.is_public === 1 ? 'Public' : 'Enrolled Students Only'}`
      );
    }
  } catch (err) {
    console.error('Error toggling idiom public:', err);
  }
}

// CRUD Materials
function openMaterialModal(item: any | null) {
  if (item) {
    editingMaterialId.value = item.id;
    materialForm.category = item.category;
    materialForm.title = item.title;
    materialForm.content = item.content;
    materialForm.url = item.url;
    materialForm.image_url = item.image_url;
    materialForm.is_public = item.is_public !== 0 ? 1 : 0;
  } else {
    editingMaterialId.value = null;
    materialForm.category = 'accent';
    materialForm.title = '';
    materialForm.content = '';
    materialForm.url = '';
    materialForm.image_url = '';
    materialForm.is_public = 1;
  }
  openModal('materialModal');
}

async function saveMaterial() {
  try {
    const method = editingMaterialId.value ? 'PUT' : 'POST';
    const endpoint = editingMaterialId.value ? `/api/practice-materials/${editingMaterialId.value}` : '/api/practice-materials';
    
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      },
      body: JSON.stringify(materialForm),
    });

    const data = await res.json();
    if (data.success) {
      await fetchMaterials();
      closeModal('materialModal');
      triggerPushNotification(
        editingMaterialId.value ? 'Material Updated' : 'Material Added',
        `Lesson topic saved: ${materialForm.title}`
      );
    }
  } catch (err) {
    console.error('Error saving material:', err);
  }
}

function deleteMaterial(id: number) {
  openConfirmDialog({
    title: 'Delete Study Material',
    message: 'Are you sure you want to delete this study lesson? This content will be permanently removed.',
    confirmText: 'Delete Lesson',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const res = await fetch(`/api/practice-materials/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': String(authState.user?.id),
          'X-User-Role': authState.user?.role || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchMaterials();
        triggerPushNotification('Material Deleted', 'The lesson record has been removed.');
      }
    }
  });
}

// CRUD Idioms
function openIdiomModal(item: any | null) {
  if (item) {
    editingIdiomId.value = item.id;
    idiomForm.phrase = item.phrase;
    idiomForm.meaning = item.meaning;
    idiomForm.usage = item.usage;
    idiomForm.is_public = item.is_public !== 0 ? 1 : 0;
  } else {
    editingIdiomId.value = null;
    idiomForm.phrase = '';
    idiomForm.meaning = '';
    idiomForm.usage = '';
    idiomForm.is_public = 1;
  }
  openModal('idiomModal');
}

async function saveIdiom() {
  try {
    const method = editingIdiomId.value ? 'PUT' : 'POST';
    const endpoint = editingIdiomId.value ? `/api/idioms/${editingIdiomId.value}` : '/api/idioms';
    
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      },
      body: JSON.stringify(idiomForm),
    });

    const data = await res.json();
    if (data.success) {
      await fetchIdioms();
      closeModal('idiomModal');
      triggerPushNotification(
        editingIdiomId.value ? 'Idiom Updated' : 'Idiom Added',
        `Idiom deck saved: ${idiomForm.phrase}`
      );
    }
  } catch (err) {
    console.error('Error saving idiom:', err);
  }
}

function deleteIdiom(id: number) {
  openConfirmDialog({
    title: 'Delete Idiom Card',
    message: 'Are you sure you want to delete this idiom card? It will be removed from the deck.',
    confirmText: 'Delete Idiom',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const res = await fetch(`/api/idioms/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': String(authState.user?.id),
          'X-User-Role': authState.user?.role || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchIdioms();
        triggerPushNotification('Idiom Deleted', 'The idiom card has been deleted.');
      }
    }
  });
}

// Student & Instructor Speaking Video Methods
function openUploadVideoModal() {
  editingVideoId.value = null;
  videoForm.title = '';
  videoForm.video_url = '';
  videoForm.description = '';
  openModal('uploadVideoModal');
}

function openEditVideoModal(video: any) {
  editingVideoId.value = video.id;
  videoForm.title = video.title;
  videoForm.video_url = video.video_url;
  videoForm.description = video.description || '';
  openModal('uploadVideoModal');
}

async function submitVideo() {
  try {
    const method = editingVideoId.value ? 'PUT' : 'POST';
    const endpoint = editingVideoId.value ? `/api/practice-videos/${editingVideoId.value}` : '/api/practice-videos';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      },
      body: JSON.stringify(videoForm),
    });

    const data = await res.json();
    if (data.success) {
      videoForm.title = '';
      videoForm.video_url = '';
      videoForm.description = '';
      editingVideoId.value = null;
      await fetchVideos();
      closeModal('uploadVideoModal');
      triggerPushNotification('Exercise Saved', 'Speaking practice record successfully saved!');
    }
  } catch (err) {
    console.error('Error submitting video:', err);
  }
}

function deleteVideo(id: number) {
  openConfirmDialog({
    title: 'Delete Practice Video',
    message: 'Are you sure you want to remove this speaking exercise submission?',
    confirmText: 'Delete Submission',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const res = await fetch(`/api/practice-videos/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': String(authState.user?.id),
          'X-User-Role': authState.user?.role || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchVideos();
        triggerPushNotification('Video Removed', 'The speaking exercise has been deleted.');
      }
    }
  });
}

// Instructor submits video feedback
async function submitFeedback(videoId: number) {
  try {
    const res = await fetch(`/api/practice-videos/${videoId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(authState.user?.id),
        'X-User-Role': authState.user?.role || '',
      },
      body: JSON.stringify({
        feedback_text: feedbackForm.value[videoId],
      }),
    });

    const data = await res.json();
    if (data.success) {
      feedbackForm.value[videoId] = '';
      await fetchVideos();
      triggerPushNotification('Feedback Sent', 'Spoken English evaluation submitted and notification broadcasted!');
    }
  } catch (err) {
    console.error('Error submitting feedback:', err);
  }
}

// Trigger load on state change
watch(() => authState.isLoggedIn, () => {
  fetchMaterials();
  fetchIdioms();
  fetchVideos();
});

onMounted(() => {
  fetchMaterials();
  fetchIdioms();
  fetchVideos();
});
</script>

<style scoped>
.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important;
}
.hover-shadow:hover {
  box-shadow: 0 .25rem .75rem rgba(0,0,0,.05) !important;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.italic {
  font-style: italic;
}
.min-h-200 {
  min-height: 200px;
}
.max-w-md {
  max-width: 480px;
}
</style>
