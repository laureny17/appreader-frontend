<template>
  <div id="app">
    <nav v-if="!isAuthPage" class="navbar">
      <div class="nav-brand">
        <h1>AppReader</h1>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link v-if="isAuthenticated" to="/dashboard" class="nav-link"
          >Dashboard</router-link
        >
        <router-link v-if="!isAuthenticated" to="/auth" class="nav-link"
          >Login</router-link
        >
        <button
          v-if="isAuthenticated"
          @click="handleLogout"
          class="nav-link logout-btn"
        >
          Logout
        </button>
      </div>
    </nav>

    <main class="main-content" :class="{ 'auth-page': isAuthPage }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isAuthPage = computed(() => route.name === "auth");
const isAuthenticated = computed(() => authStore.isAuthenticated);

const handleLogout = () => {
  authStore.logout();
  router.push("/");
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: #3498db;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.main-content {
  min-height: calc(100vh - 80px);
  padding: 2rem;
}

.main-content.auth-page {
  padding: 0;
  min-height: 100vh;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
}
</style>
