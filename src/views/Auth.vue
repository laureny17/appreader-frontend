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
import LoginForm from "@/components/LoginForm.vue";
import RegisterForm from "@/components/RegisterForm.vue";

const router = useRouter();
const showLogin = ref(true);

const handleAuthSuccess = () => {
  router.push("/dashboard");
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 500px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
</style>
