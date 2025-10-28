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
          <p class="stat-label">out of {{ requiredReadsPerReader }} required</p>
        </div>
        <div class="stat-card">
          <h3>Apps Skipped</h3>
          <p class="stat-number">{{ myStats.skipCount }}</p>
          <p class="stat-label">applications skipped</p>
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

      <div class="scatter-plot-section">
        <h2>Reader Comparison</h2>
        <div class="plot-container">
          <div
            class="plot-point"
            v-for="reader in readerStatsStore.readers"
            :key="reader.userId"
            :style="getPointStyle(reader)"
            :title="`${reader.name}: ${reader.readCount} reads, ${Math.round(reader.averageTime)}s avg`"
          >
            <span v-if="reader.userId === authStore.user?.id" class="user-indicator"
              >👁</span
            >
          </div>
        </div>
        <div class="plot-axes">
          <div class="axis-label axis-x"># Reads</div>
          <div class="axis-label axis-y">Avg Time</div>
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
          <div class="leaderboard-header">
            <div class="rank-header">Rank</div>
            <div class="name-header">Reader</div>
            <div class="stats-header">Apps Read</div>
            <div class="stats-header">Apps Skipped</div>
            <div class="stats-header">Avg Time</div>
            <div class="progress-header">Progress</div>
          </div>
          <div
            v-for="(reader, index) in readerStatsStore.sortedReaders"
            :key="reader.userId"
            class="leaderboard-item"
            :class="{ 'current-user': reader.userId === authStore.user?.id }"
          >
            <div class="rank">{{ index + 1 }}</div>
            <div class="reader-info">
              <div class="name">{{ reader.name }}</div>
            </div>
            <div class="stats">{{ reader.readCount }}</div>
            <div class="stats">{{ reader.skipCount }}</div>
            <div class="stats">{{ Math.round(reader.averageTime) }}s</div>
            <div class="progress">
              <div class="progress-bar-small">
                <div
                  class="progress-fill-small"
                  :style="{ width: getReaderProgress(reader) + '%' }"
                ></div>
              </div>
              <span class="progress-text"
                >{{ Math.round(getReaderProgress(reader)) }}%</span
              >
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
const totalApplications = ref(0);
const verifiedReadersCount = ref(0);

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

const requiredReadsPerReader = computed(() => {
  if (!eventsStore.currentEvent || verifiedReadersCount.value === 0) return 0;
  const readsPerApp = eventsStore.currentEvent.requiredReadsPerApp;
  return Math.ceil(
    (readsPerApp * totalApplications.value) / verifiedReadersCount.value
  );
});

const progressPercentage = computed(() => {
  if (requiredReadsPerReader.value === 0) return 0;
  return (myStats.value.readCount / requiredReadsPerReader.value) * 100;
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
    const eventId =
      eventsStore.currentEvent.eventId || eventsStore.currentEvent._id;

    // Load applications for the current event
    await applicationsStore.loadApplicationsForEvent(eventId);

    // Load total applications count
    await loadApplicationsCount(eventId);

    // Load verified readers count
    await loadVerifiedReadersCount(eventId);

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

const loadApplicationsCount = async (eventId: string) => {
  try {
    const applications = await api.applicationStorage.getApplicationsByEvent(
      eventId
    );
    totalApplications.value = applications.length;
  } catch (err) {
    console.error("Failed to load applications count:", err);
    totalApplications.value = 0;
  }
};

const loadVerifiedReadersCount = async (eventId: string) => {
  try {
    const verifiedReaders = await api.eventDirectory.getVerifiedReadersForEvent(
      eventId
    );
    verifiedReadersCount.value = verifiedReaders.length;
  } catch (err) {
    console.error("Failed to load verified readers count:", err);
    verifiedReadersCount.value = 0;
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
    requiredReads.value = progress.totalNeeded;
  } catch (err) {
    console.error("Failed to load user progress:", err);
    requiredReads.value = 0;
  }
};

const getReaderProgress = (reader: any) => {
  if (requiredReadsPerReader.value === 0) return 0;
  return (reader.readCount / requiredReadsPerReader.value) * 100;
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

.leaderboard-section {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  border: 1px solid var(--border-light);
}

.leaderboard-section h2 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-family: "Kufam", sans-serif;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 120px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 80px 120px;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  margin-bottom: 0.5rem;
  align-items: center;
  transition: all 0.2s;
}

.leaderboard-item:hover {
  background: var(--bg-secondary);
}

.leaderboard-item.current-user {
  background: rgba(255, 103, 66, 0.1);
  border-color: var(--accent-primary);
}

.rank {
  font-weight: bold;
  color: var(--text-primary);
  text-align: center;
}

.reader-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
  color: var(--text-primary);
}

.stats {
  text-align: center;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-small {
  flex: 1;
  height: 6px;
  background: var(--border-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 35px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>
