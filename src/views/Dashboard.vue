<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Reader Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ authStore.user?.name || "Reader" }}!</span>
        <button @click="handleLogout" class="btn btn-secondary">Logout</button>
      </div>
    </div>

    <div v-if="!eventsStore.currentEvent" class="no-event">
      <p>Please select an event to view your dashboard.</p>
      <button @click="$router.push('/select-event')" class="btn btn-primary">
        Select Event
      </button>
    </div>

    <div v-else class="dashboard-content">
      <div class="event-info">
        <h2>{{ eventsStore.currentEvent.name }}</h2>
        <p v-if="eventsStore.currentEvent.description">
          {{ eventsStore.currentEvent.description }}
        </p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Apps Read</h3>
          <p class="stat-number">{{ myStats.readCount }}</p>
          <p class="stat-label">out of {{ requiredReads }} required</p>
        </div>
        <div class="stat-card">
          <h3>Apps Skipped</h3>
          <p class="stat-number">{{ myStats.skipCount }}</p>
        </div>
        <div class="stat-card">
          <h3>Average Time</h3>
          <p class="stat-number">{{ Math.round(myStats.averageTime) }}s</p>
          <p class="stat-label">per application</p>
        </div>
        <div class="stat-card">
          <h3>Progress</h3>
          <p class="stat-number">{{ Math.round(progressPercentage) }}%</p>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="actions-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button
            @click="startReading"
            class="btn btn-primary"
            :disabled="applicationsStore.isLoading"
          >
            {{ applicationsStore.isLoading ? "Loading..." : "Start Reading" }}
          </button>
          <button
            @click="refreshData"
            class="btn btn-secondary"
            :disabled="isRefreshing"
          >
            {{ isRefreshing ? "Refreshing..." : "Refresh Data" }}
          </button>
        </div>
      </div>

      <div class="leaderboard-section">
        <h2>Reader Leaderboard</h2>
        <div v-if="readerStatsStore.isLoading" class="loading">
          <p>Loading leaderboard...</p>
        </div>
        <div
          v-else-if="readerStatsStore.sortedReaders.length === 0"
          class="empty-state"
        >
          <p>No reader stats available yet.</p>
        </div>
        <div v-else class="leaderboard">
          <div
            v-for="(reader, index) in readerStatsStore.sortedReaders"
            :key="reader.userId"
            class="leaderboard-item"
            :class="{ 'current-user': reader.userId === authStore.user?.id }"
          >
            <div class="rank">{{ index + 1 }}</div>
            <div class="reader-info">
              <div class="name">{{ reader.name }}</div>
              <div class="stats">
                {{ reader.readCount }} reads • {{ reader.skipCount }} skips •
                {{ Math.round(reader.averageTime) }}s avg
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="applicationsStore.error" class="error-message">
        <p>{{ applicationsStore.error }}</p>
        <button @click="refreshData" class="btn btn-secondary">Retry</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useApplicationsStore } from "@/stores/applications";
import { useEventsStore } from "@/stores/events";
import { useReaderStatsStore } from "@/stores/readerStats";
import { api } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const applicationsStore = useApplicationsStore();
const eventsStore = useEventsStore();
const readerStatsStore = useReaderStatsStore();

const isRefreshing = ref(false);
const requiredReads = ref(0);

const myStats = computed(() => {
  const myUserId = authStore.user?.id;
  const myReader = readerStatsStore.readers.find((r) => r.userId === myUserId);
  return (
    myReader || {
      userId: myUserId || "",
      name: authStore.user?.name || "You",
      readCount: 0,
      skipCount: 0,
      averageTime: 0,
    }
  );
});

const progressPercentage = computed(() => {
  if (requiredReads.value === 0) return 0;
  return (myStats.value.readCount / requiredReads.value) * 100;
});

const handleLogout = () => {
  authStore.logout();
  router.push("/auth");
};

const startReading = () => {
  router.push("/read");
};

const refreshData = async () => {
  if (!authStore.user || !eventsStore.currentEvent) return;

  isRefreshing.value = true;
  try {
    // Load applications for the current event
    const eventId =
      eventsStore.currentEvent.eventId || eventsStore.currentEvent._id;
    await applicationsStore.loadApplicationsForEvent(eventId);

    // Load user progress to get required reads
    await loadUserProgress();

    // Load reader stats for leaderboard
    await readerStatsStore.loadReaderStats(eventId);
  } catch (err) {
    console.error("Failed to refresh data:", err);
  } finally {
    isRefreshing.value = false;
  }
};

const loadUserProgress = async () => {
  if (!authStore.user || !eventsStore.currentEvent) return;

  try {
    const eventId =
      eventsStore.currentEvent.eventId || eventsStore.currentEvent._id;
    const progress = await api.applications.getUserReviewProgress(
      authStore.user.id,
      eventId
    );
    requiredReads.value = progress.requiredReads;
  } catch (err) {
    console.error("Failed to load user progress:", err);
    requiredReads.value = 0;
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
    return;
  }

  if (!eventsStore.currentEvent) {
    router.push("/select-event");
    return;
  }

  await refreshData();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.dashboard-header h1 {
  color: var(--text-primary);
  margin: 0;
  font-family: "Kufam", sans-serif;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.no-event {
  text-align: center;
  padding: 3rem;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.event-info {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.event-info h2 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-family: "Kufam", sans-serif;
}

.event-info p {
  margin: 0;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  border: 1px solid var(--border-light);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 1rem;
  font-family: "Nunito", sans-serif;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
  font-family: "Kufam", sans-serif;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-light);
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.actions-section {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  border: 1px solid var(--border-light);
}

.actions-section h2 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-family: "Kufam", sans-serif;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.error-message {
  background: rgba(255, 103, 66, 0.1);
  border: 1px solid var(--accent-danger);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--accent-danger);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Nunito", sans-serif;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.btn-primary:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--accent-secondary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent-primary);
}
</style>
