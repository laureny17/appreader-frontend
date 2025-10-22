<template>
  <div class="home">
    <div class="countdown-section">
      <h2>READING ENDS IN</h2>
      <div class="countdown-timer">{{ countdownDisplay }}</div>
      <div class="countdown-date">{{ endDateDisplay }}</div>
    </div>

    <div class="content-grid">
      <div class="progress-section">
        <h3>YOUR PROGRESS</h3>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">APPS READ:</span>
            <span class="stat-value"
              >{{ userReadCount }}/{{ requiredReads }}</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label"># SKIPS:</span>
            <span class="stat-value">{{ userSkipCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">TIME/READ:</span>
            <span class="stat-value">{{ averageReadTime }}min</span>
          </div>
        </div>

        <div class="scatter-plot">
          <h4>Reader Comparison</h4>
          <div class="plot-container">
            <div
              class="plot-point"
              v-for="(reader, index) in readers"
              :key="reader.id"
              :style="getPointStyle(reader)"
              :title="`${reader.name}: ${reader.readCount} reads, ${reader.averageTime}min avg`"
            >
              <span v-if="reader.id === currentUserId" class="user-indicator"
                >👁</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="leaderboard-section">
        <h3>LEADERBOARD</h3>
        <div class="leaderboard-table">
          <div class="table-header">
            <span>RANK</span>
            <span>NAME</span>
            <span># READ</span>
            <span># SKIPS</span>
            <span>TIME/READ</span>
          </div>
          <div
            class="table-row"
            v-for="(reader, index) in sortedReaders"
            :key="reader.id"
            :class="{ 'current-user': reader.id === currentUserId }"
          >
            <span class="rank">{{ index + 1 }}</span>
            <span class="name">{{ reader.name }}</span>
            <span
              class="read-count"
              :class="getReadCountClass(reader.readCount)"
              >{{ reader.readCount }}</span
            >
            <span
              class="skip-count"
              :class="getSkipCountClass(reader.skipCount)"
              >{{ reader.skipCount }}</span
            >
            <span
              class="time-read"
              :class="getTimeReadClass(reader.averageTime)"
              >{{ reader.averageTime }}min</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="action-section">
      <button @click="startReading" class="btn btn-primary btn-large">
        Start Reading Applications
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useReaderStatsStore } from "@/stores/readerStats";

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const readerStatsStore = useReaderStatsStore();

const currentUserId = computed(() => authStore.user?.id || "");
const currentUser = computed(
  () =>
    readerStatsStore.readers.find((r) => r.userId === currentUserId.value) ||
    readerStatsStore.readers[0]
);
const userReadCount = computed(() => currentUser.value?.readCount || 0);
const userSkipCount = computed(() => currentUser.value?.skipCount || 0);
const averageReadTime = computed(() => currentUser.value?.averageTime || 0);
const requiredReads = computed(
  () => eventsStore.currentEvent?.requiredReadsPerApp || 200
);

const readers = computed(() => readerStatsStore.readers);
const sortedReaders = computed(() => readerStatsStore.sortedReaders);

// Countdown logic
const countdownDisplay = ref("00:00:00:00");
const endDateDisplay = ref("No end date set");

const updateCountdown = () => {
  const currentEvent = eventsStore.currentEvent;
  if (currentEvent?.endDate) {
    const endDate = new Date(currentEvent.endDate);
    const now = new Date();
    const timeLeft = endDate.getTime() - now.getTime();

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      countdownDisplay.value = `${days.toString().padStart(2, "0")}:${hours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
      endDateDisplay.value = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } else {
      countdownDisplay.value = "00:00:00:00";
      endDateDisplay.value = "Reading period has ended";
    }
  } else {
    countdownDisplay.value = "00:00:00:00";
    endDateDisplay.value = "No end date set";
  }
};

const getPointStyle = (reader: any) => {
  const maxReads = Math.max(...readers.value.map((r) => r.readCount));
  const maxTime = Math.max(...readers.value.map((r) => r.averageTime));

  const x = (reader.readCount / maxReads) * 200;
  const y = 150 - (reader.averageTime / maxTime) * 100;

  return {
    left: `${x}px`,
    top: `${y}px`,
    backgroundColor: reader.id === currentUserId.value ? "#3498db" : "#95a5a6",
  };
};

const getReadCountClass = (count: number) => {
  if (count >= requiredReads.value) return "good";
  if (count < requiredReads.value * 0.5) return "bad";
  return "neutral";
};

const getSkipCountClass = (count: number) => {
  if (count === 0) return "good";
  if (count > 5) return "bad";
  return "neutral";
};

const getTimeReadClass = (time: number) => {
  const avgTime =
    readers.value.reduce((sum, r) => sum + r.averageTime, 0) /
    readers.value.length;
  if (time >= avgTime * 1.2) return "good";
  if (time <= avgTime * 0.8) return "bad";
  return "neutral";
};

const startReading = () => {
  router.push("/read");
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else {
    // Load reader stats for the current event
    if (eventsStore.currentEvent) {
      await readerStatsStore.loadReaderStats(eventsStore.currentEvent.eventId);
    }
    updateCountdown();
    // Update countdown every second
    setInterval(updateCountdown, 1000);
  }
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: transparent;
  min-height: 100vh;
}

.countdown-section {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}

.countdown-section h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.countdown-timer {
  font-size: 3rem;
  font-weight: bold;
  color: var(--accent-primary);
  margin-bottom: 0.5rem;
  font-family: "Courier New", monospace;
}

.countdown-date {
  color: var(--text-secondary);
  font-size: 1rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.progress-section,
.leaderboard-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.2);
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.progress-section h3,
.leaderboard-section h3 {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.stats {
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.stat-label {
  font-weight: 500;
  color: #555;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
}

.scatter-plot {
  margin-top: 2rem;
}

.scatter-plot h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.plot-container {
  position: relative;
  width: 100%;
  height: 200px;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  background: #f8f9fa;
}

.plot-point {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.plot-point:hover {
  transform: scale(1.2);
}

.user-indicator {
  font-size: 0.6rem;
}

.leaderboard-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 100px;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 2px solid #ecf0f1;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 100px;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #ecf0f1;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-row.current-user {
  background-color: #e3f2fd;
  font-weight: 600;
}

.rank {
  font-weight: 600;
  color: #2c3e50;
}

.name {
  color: #2c3e50;
}

.read-count.good {
  color: #27ae60;
  font-weight: 600;
}

.read-count.bad {
  color: #e74c3c;
  font-weight: 600;
}

.read-count.neutral {
  color: #7f8c8d;
}

.skip-count.good {
  color: #27ae60;
  font-weight: 600;
}

.skip-count.bad {
  color: #e74c3c;
  font-weight: 600;
}

.skip-count.neutral {
  color: #7f8c8d;
}

.time-read.good {
  color: #27ae60;
  font-weight: 600;
}

.time-read.bad {
  color: #e74c3c;
  font-weight: 600;
}

.time-read.neutral {
  color: #7f8c8d;
}

.action-section {
  text-align: center;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #e84393 0%, #d63031 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 157, 0.4);
}

.btn-large {
  padding: 1.25rem 3rem;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 50px 1fr 60px 60px 80px;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
