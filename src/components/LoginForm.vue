<template>
  <div class="login-form">
    <div class="form-container">
      <div class="logo">LOGO</div>
      <h1>APPREADER</h1>

      <form @submit.prevent="handleLogin">
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
            placeholder="Enter your password"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="isLoading" class="btn btn-primary">
          {{ isLoading ? "Logging in..." : "LOG IN" }}
        </button>
      </form>

      <div class="form-footer">
        <p>
          NOT A USER?
          <a href="#" @click="$emit('switch-to-register')">REGISTER</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{
  "switch-to-register": [];
  "login-success": [];
}>();

const authStore = useAuthStore();

const email = ref("");
const password = ref("");

const isLoading = computed(() => authStore.isLoading);
const error = computed(() => authStore.error);

const handleLogin = async () => {
  try {
    console.log("LoginForm: Attempting login with:", {
      email: email.value,
      password: password.value,
    });
    await authStore.login(email.value, password.value);
    console.log("LoginForm: Login successful");
    emit("login-success");
  } catch (err) {
    console.log("LoginForm: Login failed with error:", err);
    // Error is handled by the store
  }
};
</script>

<style scoped>
.login-form {
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
