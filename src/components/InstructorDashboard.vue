<template>
  <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
    <div class="card-header bg-dark text-white p-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0"><i class="bi bi-person-badge me-2 text-warning"></i>Instructor Dashboard</h2>
          <p class="mb-0 text-white text-opacity-75 small">Welcome back, Diwan Sir. Manage student profiles, mark attendance calendar, clear doubts, and publish schedules.</p>
        </div>
      </div>
    </div>

    <div class="card-body p-4 bg-light">
      
      <!-- Dashboard Mini Stats -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-md-3">
          <div class="card border-0 bg-white shadow-sm p-3 rounded-4 h-100">
            <span class="text-muted small fw-bold uppercase">Total Students</span>
            <div class="d-flex align-items-center justify-content-between mt-2">
              <h3 class="fw-bold text-dark m-0">{{ students.length }}</h3>
              <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-3"><i class="bi bi-people fs-4"></i></div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border-0 bg-white shadow-sm p-3 rounded-4 h-100">
            <span class="text-muted small fw-bold uppercase">Unresolved Doubts</span>
            <div class="d-flex align-items-center justify-content-between mt-2">
              <h3 class="fw-bold text-danger m-0">{{ doubts.filter(d => !d.solution).length }}</h3>
              <div class="bg-danger bg-opacity-10 text-danger p-2 rounded-3"><i class="bi bi-chat-dots fs-4"></i></div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border-0 bg-white shadow-sm p-3 rounded-4 h-100">
            <span class="text-muted small fw-bold uppercase">Online / Offline split</span>
            <div class="d-flex align-items-center justify-content-between mt-2">
              <div>
                <span class="badge bg-info text-dark me-1">{{ onlineStudentsCount }} On</span>
                <span class="badge bg-success text-white">{{ offlineStudentsCount }} Off</span>
              </div>
              <div class="bg-info bg-opacity-10 text-info p-2 rounded-3"><i class="bi bi-grid-fill fs-4"></i></div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-3">
          <div class="card border-0 bg-white shadow-sm p-3 rounded-4 h-100">
            <span class="text-muted small fw-bold uppercase">Scheduled Slots</span>
            <div class="d-flex align-items-center justify-content-between mt-2">
              <h3 class="fw-bold text-warning m-0">{{ schedules.length }}</h3>
              <div class="bg-warning bg-opacity-10 text-warning p-2 rounded-3"><i class="bi bi-calendar-event fs-4"></i></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Nav Sub-tabs -->
      <ul class="nav nav-pills gap-2 mb-4 border-bottom pb-3" id="instructorTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active rounded-pill fw-semibold px-4" id="studs-tab" data-bs-toggle="tab" data-bs-target="#studs-pane" type="button" role="tab" aria-controls="studs-pane" aria-selected="true">
            <i class="bi bi-people-fill me-1"></i> Students & Registration
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link rounded-pill fw-semibold px-4" id="attendance-tab" data-bs-toggle="tab" data-bs-target="#attendance-pane" type="button" role="tab" aria-controls="attendance-pane" aria-selected="false" @click="fetchAttendanceLogs">
            <i class="bi bi-calendar-check me-1"></i> Attendance Calendar
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link rounded-pill fw-semibold px-4" id="doubts-tab" data-bs-toggle="tab" data-bs-target="#doubts-pane" type="button" role="tab" aria-controls="doubts-pane" aria-selected="false" @click="fetchDoubts">
            <i class="bi bi-question-circle me-1"></i> Student Doubts ({{ doubts.filter(d => !d.solution).length }})
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link rounded-pill fw-semibold px-4" id="schedule-tab" data-bs-toggle="tab" data-bs-target="#schedule-pane" type="button" role="tab" aria-controls="schedule-pane" aria-selected="false" @click="fetchSchedules">
            <i class="bi bi-clock-history me-1"></i> Class Scheduling
          </button>
        </li>
      </ul>

      <div class="tab-content" id="instructorTabContent">
        
        <!-- Tab 1: Student Profiles & Registration -->
        <div class="tab-pane fade show active" id="studs-pane" role="tabpanel" aria-labelledby="studs-tab">
          <div class="row g-4">
            <!-- Left: Add New Student Form -->
            <div class="col-lg-4">
              <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
                <h5 class="fw-bold mb-3 text-dark"><i class="bi bi-person-plus me-1 text-primary"></i>Register Student</h5>
                
                <div v-if="regError" class="alert alert-danger py-2 small rounded-3">{{ regError }}</div>
                <div v-if="regSuccess" class="alert alert-success py-2 small rounded-3">{{ regSuccess }}</div>

                <form @submit.prevent="registerStudent">
                  <div class="mb-3">
                    <label class="form-label text-dark small fw-semibold">Full Name</label>
                    <input v-model="regForm.name" type="text" class="form-control" placeholder="e.g. Ramesh Kumar" required />
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label text-dark small fw-semibold">Username / Email (Unique)</label>
                    <input v-model="regForm.username" type="text" class="form-control" placeholder="e.g. ramesh_spoken" required />
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-dark small fw-semibold">Password</label>
                    <input v-model="regForm.password" type="password" class="form-control" placeholder="e.g. secure123" required />
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-dark small fw-semibold">Class Type</label>
                    <select v-model="regForm.role" class="form-select" required>
                      <option value="offline_student">Offline Student</option>
                      <option value="online_student">Online Student</option>
                    </select>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-semibold">
                    Register Student Account
                  </button>
                </form>
              </div>
            </div>

            <!-- Right: Registered Student Profiles -->
            <div class="col-lg-8">
              <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
                <h5 class="fw-bold mb-3 text-dark d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-people me-1 text-primary"></i>Student Accounts</span>
                  <span class="badge bg-light text-dark border fw-normal">{{ students.length }} total</span>
                </h5>

                <div v-if="students.length === 0" class="text-center py-5 text-muted">
                  <i class="bi bi-people display-4 text-secondary mb-2"></i>
                  <p>No student accounts registered yet.</p>
                </div>

                <div v-else class="table-responsive">
                  <table class="table align-middle table-hover">
                    <thead class="table-light">
                      <tr>
                        <th scope="col">Student Name</th>
                        <th scope="col">Username</th>
                        <th scope="col">Type</th>
                        <th scope="col">Joined Date</th>
                        <th scope="col" class="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="student in students" :key="student.id">
                        <td>
                          <div class="fw-bold text-dark">{{ student.name }}</div>
                        </td>
                        <td><code>{{ student.username }}</code></td>
                        <td>
                          <span :class="['badge rounded-pill py-1 px-3 fw-bold', student.role === 'online_student' ? 'bg-info text-dark' : 'bg-success text-white']">
                            {{ student.role === 'online_student' ? 'Online' : 'Offline' }}
                          </span>
                        </td>
                        <td><span class="text-muted small">{{ formatDate(student.created_at) }}</span></td>
                        <td class="text-end">
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-sm btn-outline-primary border-0 rounded-circle" @click="openEditStudentModal(student)" title="Edit Student Profile">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" @click="deleteStudentProfile(student.id)" title="Delete Student">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Attendance Calendar Sheet -->
        <div class="tab-pane fade" id="attendance-pane" role="tabpanel" aria-labelledby="attendance-tab">
          <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h5 class="fw-bold m-0 text-dark"><i class="bi bi-calendar-check-fill text-success me-1"></i>Mark Attendance Sheet</h5>
                <p class="text-muted mb-0 small">Select a date to log or review student presence</p>
              </div>
              <div class="d-flex align-items-center gap-2 bg-light p-2 rounded-3 border">
                <label class="fw-semibold small text-dark mb-0 text-nowrap"><i class="bi bi-calendar2-date"></i> Select Date:</label>
                <input v-model="attendanceDate" type="date" class="form-control form-control-sm border-0 bg-transparent fw-bold text-dark p-0 ps-1" @change="refreshAttendanceGrid" />
              </div>
            </div>

            <div v-if="students.length === 0" class="text-center py-5 text-muted">
              <p>Please register students first before marking attendance.</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Student Name</th>
                    <th>Course Type</th>
                    <th>Status for {{ attendanceDate }}</th>
                    <th class="text-end">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.id">
                    <td>
                      <div class="fw-bold text-dark">{{ student.name }}</div>
                    </td>
                    <td>
                      <span :class="['badge rounded-pill', student.role === 'online_student' ? 'bg-info bg-opacity-10 text-dark' : 'bg-success bg-opacity-10 text-success']">
                        {{ student.role === 'online_student' ? 'Online Student' : 'Offline Student' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="getAttendanceStatus(student.id) === 'present'" class="badge bg-success px-3 py-2 rounded-pill">
                        <i class="bi bi-check-circle-fill me-1"></i> Present
                      </span>
                      <span v-else-if="getAttendanceStatus(student.id) === 'absent'" class="badge bg-danger px-3 py-2 rounded-pill">
                        <i class="bi bi-x-circle-fill me-1"></i> Absent
                      </span>
                      <span v-else class="badge bg-secondary px-3 py-2 rounded-pill">
                        <i class="bi bi-dash-circle me-1"></i> Unmarked
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm">
                        <button @click="markAttendance(student.id, 'present')" :class="['btn rounded-pill px-3 me-1', getAttendanceStatus(student.id) === 'present' ? 'btn-success' : 'btn-outline-success']">
                          Present
                        </button>
                        <button @click="markAttendance(student.id, 'absent')" :class="['btn rounded-pill px-3', getAttendanceStatus(student.id) === 'absent' ? 'btn-danger' : 'btn-outline-danger']">
                          Absent
                        </button>
                        <button v-if="getAttendanceRecord(student.id)" @click="deleteAttendance(student.id)" class="btn btn-outline-secondary rounded-pill px-2 ms-1" title="Reset/Clear attendance for this date">
                          <i class="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 3: Student Doubts Clearance -->
        <div class="tab-pane fade" id="doubts-pane" role="tabpanel" aria-labelledby="doubts-tab">
          <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 class="fw-bold mb-3 text-dark"><i class="bi bi-question-circle text-danger me-1"></i>Student Doubts</h5>

            <div v-if="doubts.length === 0" class="text-center py-5 text-muted bg-light rounded-4">
              <i class="bi bi-chat-heart display-4 text-muted"></i>
              <p class="mt-2 mb-0">No active doubts posted by students yet. Fantastic!</p>
            </div>

            <div v-else class="row g-3">
              <div v-for="doubt in doubts" :key="doubt.id" class="col-12">
                <div class="card border border-secondary border-opacity-10 rounded-4 p-4 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <span class="badge bg-dark rounded-pill me-2">{{ doubt.student_name }}</span>
                      <span class="text-muted small"><i class="bi bi-clock me-1"></i>Asked: {{ formatDate(doubt.created_at) }}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span v-if="doubt.solution" class="badge bg-success rounded-pill px-3 py-1">Solved</span>
                      <span v-else class="badge bg-danger rounded-pill px-3 py-1">Awaiting Solution</span>
                      <button @click="deleteDoubt(doubt.id)" class="btn btn-sm btn-outline-danger border-0 py-0 px-2" title="Delete Doubt">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <p class="fw-semibold text-dark fs-5 mt-2 mb-3">Q: "{{ doubt.question }}"</p>
                  
                  <div v-if="doubt.solution" class="bg-light p-3 rounded-3 mb-2 border border-secondary border-opacity-10">
                    <p class="text-muted small mb-1 fw-bold"><i class="bi bi-check-circle text-success me-1"></i>Diwan Sir's Solution (Published):</p>
                    <p class="text-dark small m-0 italic">"{{ doubt.solution }}"</p>
                  </div>

                  <div class="pt-3 border-top mt-2">
                    <form @submit.prevent="submitDoubtSolution(doubt.id)">
                      <div class="input-group">
                        <input v-model="solutionsForm[doubt.id]" type="text" class="form-control" placeholder="Write spoken tips or answers for this doubt..." required />
                        <button type="submit" class="btn btn-primary d-flex align-items-center gap-1">
                          <i class="bi bi-send-fill"></i> Send Response
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Class Scheduling Availability -->
        <div class="tab-pane fade" id="schedule-pane" role="tabpanel" aria-labelledby="schedule-tab">
          <div class="row g-4">
            <div class="col-md-5">
              <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
                <h5 class="fw-bold mb-3 text-dark"><i class="bi bi-calendar-plus text-warning me-1"></i>Publish Upcoming Class Schedule</h5>
                
                <form @submit.prevent="createScheduleSlot">
                  <div class="mb-3">
                    <label class="form-label text-dark small fw-semibold">Class Day, Date & Time</label>
                    <input v-model="newSlotTime" type="text" class="form-control" placeholder="e.g. Wednesday 4:00 PM - 5:00 PM" required />
                  </div>
                  <button type="submit" class="btn btn-warning w-100 rounded-pill py-2 fw-semibold text-dark">
                    Publish Upcoming Class
                  </button>
                </form>
              </div>
            </div>

            <div class="col-md-7">
              <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
                <h5 class="fw-bold mb-3 text-dark">Upcoming Classes Schedule</h5>

                <div v-if="schedules.length === 0" class="text-center py-5 text-muted">
                  <i class="bi bi-calendar-x display-4 text-muted"></i>
                  <p class="mt-2 mb-0">No upcoming classes scheduled yet.</p>
                </div>

                <div v-else class="list-group list-group-flush">
                  <div v-for="slot in schedules" :key="slot.id" class="list-group-item d-flex justify-content-between align-items-center flex-wrap py-3 border-bottom border-light">
                    <div>
                      <h6 class="fw-bold text-dark mb-1"><i class="bi bi-clock me-2 text-warning"></i>{{ slot.slot_time }}</h6>
                      <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
                        Scheduled Class
                      </span>
                    </div>
                    <div class="d-flex align-items-center gap-1">
                      <button class="btn btn-sm btn-outline-primary border-0 rounded-circle" @click="openEditScheduleModal(slot)" title="Edit Slot">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" @click="deleteScheduleSlot(slot.id)" title="Delete Slot">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Edit Student Profile Modal -->
    <div class="modal fade" id="editStudentModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold"><i class="bi bi-pencil-square me-2 text-warning"></i>Edit Student Profile</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="saveStudentProfile">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label text-dark small fw-semibold">Full Name</label>
                <input v-model="editStudentForm.name" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label text-dark small fw-semibold">Username / Email</label>
                <input v-model="editStudentForm.username" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label text-dark small fw-semibold">New Password (leave blank to keep current)</label>
                <input v-model="editStudentForm.password" type="password" class="form-control" placeholder="Optional new password" />
              </div>
              <div class="mb-3">
                <label class="form-label text-dark small fw-semibold">Class Type</label>
                <select v-model="editStudentForm.role" class="form-select" required>
                  <option value="offline_student">Offline Student</option>
                  <option value="online_student">Online Student</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary rounded-pill px-4">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Schedule Slot Modal -->
    <div class="modal fade" id="editScheduleModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow-lg">
          <div class="modal-header bg-dark text-white rounded-top-4 border-0">
            <h5 class="modal-title fw-bold"><i class="bi bi-clock-history me-2 text-warning"></i>Edit Availability Slot</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form @submit.prevent="saveScheduleSlot">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label text-dark small fw-semibold">Date and Time Slot</label>
                <input v-model="editScheduleForm.slot_time" type="text" class="form-control" required />
              </div>
              <div class="mb-3 form-check form-switch">
                <input class="form-check-input" type="checkbox" id="isBookedCheck" v-model="editScheduleForm.is_booked" />
                <label class="form-check-label text-dark small fw-semibold" for="isBookedCheck">Mark as Booked</label>
              </div>
              <div class="mb-3" v-if="editScheduleForm.is_booked">
                <label class="form-label text-dark small fw-semibold">Booked Student Name</label>
                <input v-model="editScheduleForm.booked_by_name" type="text" class="form-control" placeholder="Student name" />
              </div>
            </div>
            <div class="modal-footer bg-light rounded-bottom-4 border-0">
              <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-warning rounded-pill px-4 text-dark fw-bold">Save Slot</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { supabase, registrationClient } from '../supabase';
import { authState, triggerPushNotification, openConfirmDialog } from '../state';
import { openModal, closeModal } from '../utils/modal';

const students = ref<any[]>([]);
const attendanceLogs = ref<any[]>([]);
const doubts = ref<any[]>([]);
const schedules = ref<any[]>([]);

const attendanceDate = ref(new Date().toISOString().substring(0, 10));
const newSlotTime = ref('');

const regForm = reactive({
  name: '',
  username: '',
  password: '',
  role: 'offline_student'
});
const regError = ref('');
const regSuccess = ref('');

const editingStudentId = ref<string | null>(null);
const editStudentForm = reactive({
  name: '',
  username: '',
  password: '',
  role: 'offline_student'
});

const editingScheduleId = ref<number | null>(null);
const editScheduleForm = reactive({
  slot_time: '',
  is_booked: false,
  booked_by_name: ''
});

const solutionsForm = ref<Record<number, string>>({});

const onlineStudentsCount = computed(() => students.value.filter(s => s.role === 'online_student').length);
const offlineStudentsCount = computed(() => students.value.filter(s => s.role === 'offline_student').length);

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

async function fetchStudents() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['online_student', 'offline_student']);
    if (error) throw error;
    students.value = data || [];
  } catch (err) {
    console.error('Error students:', err);
  }
}

async function fetchAttendanceLogs() {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');
    if (error) throw error;
    attendanceLogs.value = data || [];
  } catch (err) {
    console.error('Error attendance:', err);
  }
}

async function fetchDoubts() {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .select('*')
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

async function registerStudent() {
  regError.value = '';
  regSuccess.value = '';
  try {
    let email = regForm.username.trim();
    if (!email.includes('@')) {
      email = `${email}@coaching.app`;
    }

    // 1. Create the user in Supabase Auth silently
    const { data: authData, error: authError } = await registrationClient.auth.signUp({
      email: email,
      password: regForm.password,
      options: {
        data: { name: regForm.name, role: regForm.role }
      }
    });

    if (authError) {
      regError.value = authError.message;
      return;
    }

    // 2. Immediately link the new Auth ID to your Profiles table
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          name: regForm.name,
          username: regForm.username,
          role: regForm.role
        }]);

      if (profileError) throw profileError;

      regSuccess.value = `Student ${regForm.name} registered successfully!`;
      regForm.name = '';
      regForm.username = '';
      regForm.password = '';
      await fetchStudents();
      triggerPushNotification('New Student Registered', 'Account credentials created successfully.');
    }
  } catch (err: any) {
    regError.value = err.message || 'Database error.';
  }
}

function openEditStudentModal(student: any) {
  editingStudentId.value = student.id;
  editStudentForm.name = student.name;
  editStudentForm.username = student.username;
  editStudentForm.password = '';
  editStudentForm.role = student.role;
  openModal('editStudentModal');
}

async function saveStudentProfile() {
  if (!editingStudentId.value) return;
  try {
    const updatePayload: any = {
      name: editStudentForm.name,
      username: editStudentForm.username,
      role: editStudentForm.role
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', editingStudentId.value);

    if (error) throw error;

    await fetchStudents();
    closeModal('editStudentModal');
    triggerPushNotification('Student Updated', `Profile updated for ${editStudentForm.name}`);
  } catch (err) {
    console.error('Error updating student profile:', err);
  }
}

function deleteStudentProfile(id: string) {
  openConfirmDialog({
    title: 'Delete Student Account',
    message: 'Are you sure you want to delete this student account? All their logs and attendance records will be removed.',
    confirmText: 'Delete Account',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (!error) {
        await fetchStudents();
        triggerPushNotification('Profile Deleted', 'Student account removed.');
      }
    }
  });
}

function getAttendanceStatus(studentId: string): string {
  const record = attendanceLogs.value.find(log => log.student_id === studentId && log.date === attendanceDate.value);
  return record ? record.status : '';
}

function getAttendanceRecord(studentId: string) {
  return attendanceLogs.value.find(log => log.student_id === studentId && log.date === attendanceDate.value);
}

async function markAttendance(studentId: string, status: 'present' | 'absent') {
  try {
    const existingRecord = getAttendanceRecord(studentId);
    let error;

    if (existingRecord) {
      const res = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existingRecord.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: attendanceDate.value,
          status,
          marked_by: authState.user?.id
        }]);
      error = res.error;
    }

    if (error) throw error;

    await fetchAttendanceLogs();
    triggerPushNotification('Attendance Logged', `Student marked ${status} for ${attendanceDate.value}`);
  } catch (err) {
    console.error('Error marking attendance:', err);
  }
}

function deleteAttendance(studentId: string) {
  const record = getAttendanceRecord(studentId);
  if (!record) return;
  openConfirmDialog({
    title: 'Reset Attendance',
    message: `Clear attendance record for this student on ${attendanceDate.value}?`,
    confirmText: 'Reset',
    confirmVariant: 'warning',
    onConfirm: async () => {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', record.id);

      if (!error) {
        await fetchAttendanceLogs();
        triggerPushNotification('Attendance Cleared', `Attendance record reset for ${attendanceDate.value}`);
      }
    }
  });
}

function refreshAttendanceGrid() {
  fetchAttendanceLogs();
}

async function submitDoubtSolution(doubtId: number) {
  try {
    const { error } = await supabase
      .from('doubts')
      .update({ solution: solutionsForm.value[doubtId], solved_at: new Date().toISOString() })
      .eq('id', doubtId);

    if (error) throw error;

    solutionsForm.value[doubtId] = '';
    await fetchDoubts();
    triggerPushNotification('Doubt Resolved', 'English speech answer sent successfully to student dashboard.');
  } catch (err) {
    console.error('Error solving doubt:', err);
  }
}

function deleteDoubt(id: number) {
  openConfirmDialog({
    title: 'Delete Student Doubt',
    message: 'Are you sure you want to delete this doubt?',
    confirmText: 'Delete Doubt',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const { error } = await supabase
        .from('doubts')
        .delete()
        .eq('id', id);

      if (!error) {
        await fetchDoubts();
        triggerPushNotification('Doubt Removed', 'The student doubt was deleted.');
      }
    }
  });
}

async function createScheduleSlot() {
  try {
    const { error } = await supabase
      .from('schedules')
      .insert([{ slot_time: newSlotTime.value }]);

    if (error) throw error;

    newSlotTime.value = '';
    await fetchSchedules();
    triggerPushNotification('Slot Published', 'Teaching availability slot posted.');
  } catch (err) {
    console.error('Error creating slot:', err);
  }
}

function openEditScheduleModal(slot: any) {
  editingScheduleId.value = slot.id;
  editScheduleForm.slot_time = slot.slot_time;
  editScheduleForm.is_booked = !!slot.is_booked;
  editScheduleForm.booked_by_name = slot.booked_by_name || '';
  openModal('editScheduleModal');
}

async function saveScheduleSlot() {
  if (!editingScheduleId.value) return;
  try {
    const { error } = await supabase
      .from('schedules')
      .update({
        slot_time: editScheduleForm.slot_time,
        is_booked: editScheduleForm.is_booked,
        booked_by_name: editScheduleForm.booked_by_name
      })
      .eq('id', editingScheduleId.value);

    if (error) throw error;

    await fetchSchedules();
    closeModal('editScheduleModal');
    triggerPushNotification('Slot Updated', 'Teaching slot updated successfully.');
  } catch (err) {
    console.error('Error saving schedule slot:', err);
  }
}

function deleteScheduleSlot(id: number) {
  openConfirmDialog({
    title: 'Delete Availability Slot',
    message: 'Are you sure you want to remove this schedule slot?',
    confirmText: 'Delete Slot',
    confirmVariant: 'danger',
    onConfirm: async () => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (!error) {
        await fetchSchedules();
        triggerPushNotification('Slot Removed', 'Availability slot deleted.');
      }
    }
  });
}

onMounted(() => {
  fetchStudents();
  fetchAttendanceLogs();
  fetchDoubts();
  fetchSchedules();
});
</script>

<style scoped>
.italic {
  font-style: italic;
}
.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}
</style>