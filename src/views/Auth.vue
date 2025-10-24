<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>AppReader</h1>
        <p>Application Review System</p>
      </div>

      <div class="auth-forms">
        <LoginForm
          v-if="showLogin"
          @switch-to-register="showLogin = false"
          @login-success="handleAuthSuccess"
        />
        <RegisterForm
          v-else
          @switch-to-login="showLogin = true"
          @register-success="handleAuthSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";

const router = useRouter();
const showLogin = ref(true);

const handleAuthSuccess = () => {
  // Check if user is admin and redirect accordingly
  const authStore = useAuthStore();
  console.log("=== AUTH SUCCESS DEBUG ===");
  console.log("isAdmin:", authStore.isAdmin);
  console.log("isAdminView:", authStore.isAdminView);
  console.log("viewMode:", authStore.viewMode);
  console.log("User data:", authStore.user);
  console.log("=== END AUTH DEBUG ===");

  if (authStore.isAdmin && authStore.isAdminView) {
    console.log("Redirecting to admin page");
    router.push("/admin");
  } else {
    console.log("Redirecting to event selection");
    router.push("/select-event");
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.auth-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.auth-header p {
  font-size: 1.25rem;
  opacity: 0.9;
}

.auth-forms {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  padding: 2rem;
}
</style>
