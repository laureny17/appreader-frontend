<template>
  <div class="register-form">
    <div class="form-container">
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            :disabled="isLoading"
            placeholder="Enter your name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            :disabled="isLoading"
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            :disabled="isLoading"
            placeholder="Choose a password"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="passwordMismatch" class="error-message">
          Passwords do not match
        </div>

        <button
          type="submit"
          :disabled="isLoading || passwordMismatch"
          class="btn btn-primary"
        >
          {{ isLoading ? "Creating account..." : "REGISTER" }}
        </button>
      </form>

      <div class="form-footer">
        <p>
          HAVE AN ACCOUNT?
          <a href="#" @click="$emit('switch-to-login')">LOGIN</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{
  "switch-to-login": [];
  "register-success": [];
}>();

const authStore = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const isLoading = computed(() => authStore.isLoading);
const error = computed(() => authStore.error);
const passwordMismatch = computed(
  () => password.value !== confirmPassword.value && confirmPassword.value !== ""
);

const handleRegister = async () => {
  if (passwordMismatch.value) return;

  try {
    await authStore.register(name.value, email.value, password.value);
    emit("register-success");
  } catch (err) {
    // Error is handled by the store
  }
};
</script>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logo {
  width: 60px;
  height: 60px;
  background: var(--accent-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border-radius: var(--radius-md);
  font-weight: bold;
  font-size: 0.9rem;
}

.form-container h1 {
  text-align: center;
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: border-color 0.2s;
  background: var(--bg-primary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.event-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.event-select:focus {
  outline: none;
  border-color: #3498db;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.form-footer a {
  color: var(--accent-primary);
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
