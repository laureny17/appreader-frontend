<template>
  <div id="app">
    <nav v-if="!isAuthPage" class="navbar">
      <div class="nav-brand">
        <h1>AppReader</h1>
      </div>
      <div class="nav-links">
        <router-link
          v-if="isAuthenticated && hasSelectedEvent"
          to="/"
          class="nav-link"
          :class="{ active: $route.name === 'home' }"
          >HOME</router-link
        >
        <router-link
          v-if="isAuthenticated && hasSelectedEvent"
          to="/read"
          class="nav-link"
          :class="{ active: $route.name === 'read' }"
          >READ</router-link
        >
        <router-link
          v-if="isAuthenticated && isAdmin"
          to="/admin"
          class="nav-link"
          :class="{ active: $route.name === 'admin' }"
          >ADMIN</router-link
        >
        <router-link v-if="!isAuthenticated" to="/auth" class="nav-link"
          >LOGIN</router-link
        >
        <button
          v-if="isAuthenticated"
          @click="handleLogout"
          class="nav-link logout-btn"
        >
          LOGOUT
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
import { useEventsStore } from "@/stores/events";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

const isAuthPage = computed(() => route.name === "auth");
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.user?.isAdmin || false);
const hasSelectedEvent = computed(() => eventsStore.currentEvent !== null);

const handleLogout = () => {
  if (confirm("Are you sure you want to logout?")) {
    authStore.logout();
    eventsStore.selectEvent(null as any); // Clear selected event
    router.push("/auth");
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-light);
}

.nav-brand h1 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.025em;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.nav-link.active,
.nav-link.router-link-active {
  background: var(--accent-primary);
  color: white;
}

.logout-btn {
  background: var(--accent-danger);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  font-weight: 600;
  min-width: 80px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.main-content {
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background: var(--bg-secondary);
}

.main-content.auth-page {
  padding: 0;
  min-height: 100vh;
}
</style>

<style>
:root {
  /* Centralized Color Scheme */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --accent-primary: #3b82f6;
  --accent-secondary: #6366f1;
  --accent-danger: #ef4444;
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

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
  background: var(--bg-secondary);
  margin: 0;
  padding: 0;
  color: var(--text-primary);
}

#app {
  min-height: 100vh;
}
</style>
