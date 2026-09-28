<template>
  <div class="card border-0 shadow-sm rounded-4 bg-light p-4">
    <div class="text-center mb-4">
      <div class="d-inline-flex bg-primary bg-opacity-10 text-primary p-3 rounded-circle mb-3">
        <i class="bi bi-shield-lock-fill fs-3"></i>
      </div>
      <h4 class="fw-bold text-dark mb-0">Login</h4>
    </div>

    <div v-if="errorMsg" class="alert alert-danger alert-dismissible fade show rounded-3 small py-2" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ errorMsg }}
      <button type="button" class="btn-close py-2" @click="errorMsg = ''" aria-label="Close"></button>
    </div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <!-- Note: Supabase defaults to Email for login. You may need to enter an email here even though the label says Username -->
        <label class="form-label text-dark fw-semibold small">Username / Email</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-person text-muted"></i></span>
          <input v-model="username" type="text" class="form-control border-start-0 ps-1" placeholder="Enter email..." required />
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label text-dark fw-semibold small">Password</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-key text-muted"></i></span>
          <input v-model="password" type="password" class="form-control border-start-0 ps-1" placeholder="Enter password..." required />
        </div>
      </div>

      <button type="submit" class="btn btn-primary w-100 rounded-pill py-2 fw-semibold shadow-sm" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <i class="bi bi-box-arrow-in-right me-1" v-else></i> Continue
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { setLoggedInUser, triggerPushNotification } from '../state';
// Import your Supabase client. (Verify this path matches where supabase.ts is located)
import { supabase } from '../supabase';

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const emit = defineEmits(['success']);

async function handleLogin() {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    let loginEmail = username.value.trim();
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@coaching.app`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail, 
      password: password.value,
    });
    
    if (error) {
      errorMsg.value = error.message;
    } else if (data.user) {
      // Pull role and name from user_metadata, defaulting to online_student if not set
      const role = data.user.user_metadata?.role || 'online_student';
      const name = data.user.user_metadata?.name || username.value.split('@')[0];

      const appUser = {
        id: data.user.id, // Keep as string format from Supabase
        email: data.user.email,
        name: name,
        role: role
      };

      setLoggedInUser(appUser);
      triggerPushNotification('Logged In successfully', `Welcome back, ${appUser.name}!`);
      emit('success', appUser);
    }
  } catch (err) {
    errorMsg.value = 'Network error. Please try again later.';
  } finally {
    loading.value = false;
  }
}

</script>