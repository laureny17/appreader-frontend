<template>
  <div id="app">
    <nav v-if="!isAuthPage" class="navbar">
      <div class="nav-brand">
        <h1>AppReader</h1>
        <!-- Admin/Reader View Toggle -->
        <div v-if="isAuthenticated && isAdmin" class="view-toggle">
          <button
            @click="handleViewModeSwitch('admin')"
            :class="{ active: authStore.isAdminView }"
            class="toggle-btn"
          >
            ADMIN VIEW
          </button>
          <button
            @click="handleViewModeSwitch('reader')"
            :class="{ active: authStore.isReaderView }"
            class="toggle-btn"
          >
            READER VIEW
          </button>
        </div>
      </div>
      <div class="nav-links">
        <!-- Reader view navigation -->
        <template v-if="isAuthenticated && authStore.isReaderView">
          <router-link
            v-if="hasSelectedEvent"
            to="/"
            class="nav-link"
            :class="{ active: $route.name === 'home' }"
            >HOME</router-link
          >
          <router-link
            v-if="hasSelectedEvent"
            to="/read"
            class="nav-link"
            :class="{ active: $route.name === 'read' }"
            >READ</router-link
          >
        </template>

        <!-- Admin view navigation -->
        <template v-if="isAuthenticated && isAdmin && authStore.isAdminView">
          <router-link
            to="/admin"
            class="nav-link"
            :class="{ active: $route.name === 'admin' }"
            >ADMIN DASHBOARD</router-link
          >
        </template>
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

const handleViewModeSwitch = (mode: "admin" | "reader") => {
  if (mode === "reader") {
    authStore.switchToReaderView();
    router.push("/select-event");
  } else {
    authStore.switchToAdminView();
    router.push("/admin");
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

.nav-brand {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-brand h1 {
  font-family: "Kufam", sans-serif;
  color: var(--text-primary);
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.toggle-btn.active {
  background: var(--accent-primary);
  color: white;
}

.toggle-btn.active:hover {
  background: var(--accent-secondary);
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.025em;
  position: relative;
  border-radius: var(--radius-sm);
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active,
.nav-link.router-link-active {
  color: var(--accent-primary);
}

.nav-link.active::after,
.nav-link.router-link-active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 1px;
  transition: background 0.2s ease;
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
  font-weight: 500;
  min-width: 80px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: #ff5432;
  transform: translateY(-1px);
  color: white !important;
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
@import url("https://fonts.googleapis.com/css2?family=Kufam:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800&display=swap");

:root {
  /* Custom Color Scheme from Image */
  --bg-primary: #ffffff;
  --bg-secondary: #faf8f3; /* slightly lighter beige */
  --bg-tertiary: #f5f0e6;
  --text-primary: #211c1b; /* off-black-brown */
  --text-secondary: #4a4442;
  --text-muted: #7a7472;
  --accent-primary: #6f90d1; /* blue */
  --accent-secondary: #9fbddd; /* light blue */
  --accent-danger: #ff6742; /* reddish-orange for flag */
  --accent-success: #8bbd59;
  --accent-warning: #fcb05a; /* orange for skip */
  --accent-info: #819ad2;
  --border-light: #e8e2d8;
  --border-medium: #ddd6cb;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-md: 0 2px 4px -1px rgb(0 0 0 / 0.06);
  --shadow-lg: 0 4px 8px -2px rgb(0 0 0 / 0.08);
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-secondary);
  margin: 0;
  padding: 0;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.6;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: "Kufam", sans-serif;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

/* Global Button Styles - Notion-inspired */
button.btn,
a.btn,
input[type="submit"].btn {
  font-family: "Nunito", sans-serif;
  padding: 0.65rem 1.5rem;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-secondary);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--accent-secondary);
  color: white;
}

.btn-secondary:hover {
  background: var(--accent-primary);
  transform: translateY(-1px);
}

.btn-warning {
  background: var(--accent-warning);
  color: var(--text-primary);
}

.btn-warning:hover {
  background: #fba747;
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--accent-danger);
  color: white;
}

.btn-danger:hover {
  background: #ff5432;
  transform: translateY(-1px);
}

.btn-success {
  background: var(--accent-success);
  color: white;
}

.btn-success:hover {
  background: #7fc680;
  transform: translateY(-1px);
}

.btn-neutral {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
}

.btn-neutral:hover {
  background: var(--border-medium);
}

#app {
  min-height: 100vh;
}
</style>
