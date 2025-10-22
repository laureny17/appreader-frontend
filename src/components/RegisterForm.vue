<template>
  <div class="register-form">
    <div class="form-container">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            :disabled="isLoading"
            placeholder="Choose a username"
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

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            :disabled="isLoading"
            placeholder="Confirm your password"
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
          {{ isLoading ? "Creating account..." : "Register" }}
        </button>
      </form>

      <div class="form-footer">
        <p>
          Already have an account?
          <a href="#" @click="$emit('switch-to-login')">Login here</a>
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

const username = ref("");
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
    await authStore.register(username.value, password.value);
    emit("register-success");
  } catch (err) {
    // Error is handled by the store
  }
};
</script>

<style scoped>
.register-form {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-container h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.form-footer a {
  color: #3498db;
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
