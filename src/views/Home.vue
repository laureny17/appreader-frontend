<template>
  <div class="home">
    <div v-if="readerStatsStore.isLoading" class="loading">
      <p>Loading reader statistics...</p>
    </div>

    <div v-else-if="readerStatsStore.error" class="error">
      <p>{{ readerStatsStore.error }}</p>
      <button @click="loadReaderStats" class="btn btn-primary">Retry</button>
    </div>

    <div v-else>
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
              <span class="stat-label">RATIO:</span>
              <span class="stat-value">{{
                getReadToSkipRatio(userReadCount, userSkipCount)
              }}</span>
            </div>
          </div>

          <div class="scatter-plot">
            <h4>Reader Comparison</h4>
            <div class="plot-container">
              <canvas ref="scatterChart" width="400" height="200"></canvas>
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
            </div>
            <div
              class="table-row"
              v-for="(reader, index) in sortedReaders"
              :key="reader.userId"
              :class="{ 'current-user': reader.userId === currentUserId }"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useReaderStatsStore } from "@/stores/readerStats";
import { api } from "@/services/api";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const readerStatsStore = useReaderStatsStore();

const totalApplications = ref(0);
const verifiedReadersCount = ref(0);
const scatterChart = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const currentUserId = computed(() => authStore.user?.id || "");
const currentUser = computed(() => {
  const userId = currentUserId.value;
  if (!userId) return null;

  const user = readerStatsStore.readers.find((r) => r.userId === userId);
  console.log("Current user lookup:", {
    userId,
    found: !!user,
    totalReaders: readerStatsStore.readers.length,
  });
  return user || null;
});
const userReadCount = computed(() => currentUser.value?.readCount || 0);
const userSkipCount = computed(() => currentUser.value?.skipCount || 0);
const averageReadTime = computed(() => currentUser.value?.averageTime || 0);

const requiredReadsPerReader = computed(() => {
  if (!eventsStore.currentEvent || verifiedReadersCount.value === 0) return 0;
  const readsPerApp = eventsStore.currentEvent.requiredReadsPerApp;
  return Math.ceil(
    (readsPerApp * totalApplications.value) / verifiedReadersCount.value
  );
});

const requiredReads = computed(() => requiredReadsPerReader.value);

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

const createScatterChart = () => {
  if (!scatterChart.value || readers.value.length === 0) return;

  // Destroy existing chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = scatterChart.value.getContext("2d");
  if (!ctx) return;

  // Prepare data
  const chartData = readers.value.map((reader) => ({
    x: reader.readCount,
    y:
      reader.skipCount > 0
        ? reader.readCount / reader.skipCount
        : reader.readCount,
    label: reader.name,
    userId: reader.userId,
  }));

  // Separate current user from others
  const currentUserData = chartData.filter(
    (point) => point.userId === currentUserId.value
  );
  const otherUsersData = chartData.filter(
    (point) => point.userId !== currentUserId.value
  );

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: otherUsersData,
          backgroundColor: "rgba(159, 189, 221, 0.8)",
          borderColor: "rgba(159, 189, 221, 1)",
          borderWidth: 1,
          pointRadius: 6,
        },
        {
          data: currentUserData,
          backgroundColor: "rgba(111, 144, 209, 0.8)",
          borderColor: "rgba(111, 144, 209, 1)",
          borderWidth: 2,
          pointRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#f5f0e6",
          titleColor: "#7a7472",
          bodyColor: "#7a7472",
          displayColors: false,
          callbacks: {
            title: (context) => {
              const point = context[0].raw as any;
              return point.label;
            },
            label: (context) => {
              const point = context.raw as any;
              return [
                `Apps Read: ${point.x}`,
                `Avg Time: ${Math.round(point.y)}s`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Number of Apps Read",
            font: {
              family: "Nunito, sans-serif",
              size: 12,
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            stepSize: 1,
            font: {
              family: "Nunito, sans-serif",
              size: 10,
            },
          },
        },
        y: {
          title: {
            display: true,
            text: "Read to Skip Ratio",
            font: {
              family: "Nunito, sans-serif",
              size: 12,
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 5,
            callback: function (value) {
              return Math.round(Number(value) * 10) / 10;
            },
            font: {
              family: "Nunito, sans-serif",
              size: 10,
            },
          },
        },
      },
    },
  });
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

const getReadToSkipRatio = (readCount: number, skipCount: number) => {
  if (skipCount === 0) return readCount > 0 ? "∞" : "0";
  return (readCount / skipCount).toFixed(1);
};

const getRatioClass = (readCount: number, skipCount: number) => {
  if (skipCount === 0) return readCount > 0 ? "good" : "neutral";
  const ratio = readCount / skipCount;
  if (ratio >= 3) return "good";
  if (ratio <= 1) return "bad";
  return "neutral";
};

const startReading = () => {
  router.push("/read");
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

const loadReaderStats = async () => {
  if (eventsStore.currentEvent) {
    const eventId = eventsStore.currentEvent._id;

    // Load applications count
    await loadApplicationsCount(eventId);

    // Load verified readers count
    await loadVerifiedReadersCount(eventId);

    // Use the working reader stats store method
    await readerStatsStore.loadReaderStats(eventId);
  }
};

// Watch for changes in current event and reload reader stats
watch(
  () => eventsStore.currentEvent?._id,
  async (newEventId, oldEventId) => {
    if (newEventId && newEventId !== oldEventId) {
      console.log("Event changed, reloading reader stats for:", newEventId);
      try {
        await loadReaderStats();
        updateCountdown(); // Update countdown for new event
      } catch (err) {
        console.error("Error while loading reader stats for new event:", err);
      }
    }
  },
  { immediate: false }
);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
    return;
  }

  await nextTick();

  // Ensure current event is loaded
  if (!eventsStore.currentEvent?._id) {
    console.warn(
      "Current event not found in store. Attempting to load from storage..."
    );
    if (eventsStore.loadCurrentEvent) {
      await eventsStore.loadCurrentEvent();
    } else {
      console.error(
        "eventsStore.loadCurrentEvent() not defined — add it to your events store if missing."
      );
    }
  }

  const eventId = eventsStore.currentEvent?._id;
  if (!eventId) {
    console.error(
      "No eventId found in eventsStore.currentEvent even after loading."
    );
    router.push("/select-event");
    return;
  }

  try {
    await loadReaderStats(); // uses eventId internally
  } catch (err) {
    console.error("Error while loading reader stats:", err);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Create scatter chart after data is loaded
  await nextTick();
  createScatterChart();
});

// Watch for changes in readers data and recreate chart
watch(
  readers,
  () => {
    if (chartInstance) {
      createScatterChart();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: transparent;
  min-height: 100vh;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
}

.loading p,
.error p {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.error {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.error p {
  color: #dc2626;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.progress-section,
.leaderboard-section {
  background: var(--bg-primary);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.progress-section h3,
.leaderboard-section h3 {
  color: var(--text-primary);
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
  height: 300px;
  background: white;
  padding: 10px;
}

.leaderboard-table {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  min-width: 0;
}

.table-header {
  display: grid;
  grid-template-columns: 50px minmax(120px, 1fr) 60px 60px 80px;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #ecf0f1;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  width: max-content;
  min-width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 50px minmax(120px, 1fr) 60px 60px 80px;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #ecf0f1;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  width: max-content;
  min-width: 100%;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-row.current-user {
  background-color: #faf8f3;
  font-weight: 600;
}

.rank {
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
}

.name {
  color: #2c3e50;
  text-align: left;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-break: break-word;
}

.read-count {
  font-weight: 600;
  text-align: left;
  min-width: 60px;
}

.skip-count {
  font-weight: 600;
  text-align: left;
  min-width: 60px;
}

.time-read {
  font-weight: 600;
  text-align: left;
  min-width: 80px;
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
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: var(--accent-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-large {
  padding: 1.25rem 3rem;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .content-grid {
    gap: 1.5rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 45px minmax(100px, 1fr) 55px 55px 75px;
    gap: 0.5rem 0.75rem;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    width: max-content;
    min-width: 100%;
  }

  .plot-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .content-grid {
    gap: 1rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px minmax(80px, 1fr) 50px 50px 65px;
    gap: 0.25rem 0.5rem;
    font-size: 0.75rem;
    padding: 0.5rem;
    width: max-content;
    min-width: 100%;
  }

  .plot-container {
    height: 200px;
  }
}
</style>
