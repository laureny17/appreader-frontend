<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>EVENTS</h1>
    </div>

    <div class="events-section">
      <div class="active-events">
        <h2>ACTIVE</h2>
        <div class="event-list">
          <div
            class="event-item"
            v-for="event in activeEvents"
            :key="event._id"
          >
            <div class="event-info" @click="viewEventDetails(event._id)">
              <h3 class="event-name">{{ event.name }}</h3>
              <p class="event-details">
                {{ event.requiredReadsPerApp }} reads per app •
                {{
                  event.endDate
                    ? new Date(event.endDate).toLocaleDateString()
                    : "No end date"
                }}
              </p>
            </div>
            <button @click="archiveEvent(event._id)" class="btn btn-archive">
              ARCHIVE
            </button>
          </div>
        </div>
      </div>

      <div class="inactive-events">
        <h2>INACTIVE</h2>
        <div class="event-list">
          <div
            class="event-item"
            v-for="event in inactiveEvents"
            :key="event._id"
          >
            <div class="event-info" @click="viewEventDetails(event._id)">
              <h3 class="event-name">{{ event.name }}</h3>
              <p class="event-details">
                {{ event.requiredReadsPerApp }} reads per app •
                {{
                  event.endDate
                    ? new Date(event.endDate).toLocaleDateString()
                    : "No end date"
                }}
              </p>
            </div>
            <button @click="activateEvent(event._id)" class="btn btn-activate">
              SET ACTIVE
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-actions">
      <button @click="createNewEvent" class="btn btn-primary">
        Create New Event
      </button>
    </div>

    <!-- Event Details Modal -->
    <div v-if="showEventDetails" class="event-details-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Event Details</h2>
          <button @click="closeEventDetails" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="reader-stats">
            <h3>Reader Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <h4>Total Readers</h4>
                <p class="stat-number">{{ readerStatsStore.readers.length }}</p>
              </div>
              <div class="stat-card">
                <h4>Total Reads</h4>
                <p class="stat-number">
                  {{
                    readerStatsStore.readers.reduce(
                      (sum, r) => sum + r.readCount,
                      0
                    )
                  }}
                </p>
              </div>
              <div class="stat-card">
                <h4>Average Reads per Reader</h4>
                <p class="stat-number">
                  {{
                    readerStatsStore.readers.length > 0
                      ? Math.round(
                          readerStatsStore.readers.reduce(
                            (sum, r) => sum + r.readCount,
                            0
                          ) / readerStatsStore.readers.length
                        )
                      : 0
                  }}
                </p>
              </div>
            </div>

            <div class="leaderboard">
              <h4>Top Readers</h4>
              <div class="leaderboard-list">
                <div
                  v-for="(
                    reader, index
                  ) in readerStatsStore.sortedReaders.slice(0, 10)"
                  :key="reader.userId"
                  class="leaderboard-item"
                >
                  <span class="rank">#{{ index + 1 }}</span>
                  <span class="name">{{ reader.name }}</span>
                  <span class="reads">{{ reader.readCount }} reads</span>
                  <span class="time"
                    >{{ reader.averageTime.toFixed(1) }}min avg</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAdminEventsStore } from "@/stores/adminEvents";
import { useReaderStatsStore } from "@/stores/readerStats";
import { api } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const adminEventsStore = useAdminEventsStore();
const readerStatsStore = useReaderStatsStore();

const activeEvents = computed(() => adminEventsStore.activeEvents);
const inactiveEvents = computed(() => adminEventsStore.inactiveEvents);
const selectedEvent = ref<string | null>(null);
const showEventDetails = ref(false);

const viewEventDetails = async (eventId: string) => {
  // Navigate to event configuration page
  router.push(`/admin/event/${eventId}`);
};

const closeEventDetails = () => {
  showEventDetails.value = false;
  selectedEvent.value = null;
};

const archiveEvent = async (eventId: string) => {
  try {
    const event = adminEventsStore.activeEvents.find((e) => e._id === eventId);
    if (!event || !authStore.user) return;

    await api.eventDirectory.inactivateEvent(authStore.user.id, event.name);
    await adminEventsStore.loadAllEvents(); // Refresh the events list
    console.log("Event archived successfully");
  } catch (err) {
    console.error("Failed to archive event:", err);
    alert("Failed to archive event. Please try again.");
  }
};

const activateEvent = async (eventId: string) => {
  try {
    const event = adminEventsStore.inactiveEvents.find(
      (e) => e._id === eventId
    );
    if (!event || !authStore.user) return;

    await api.eventDirectory.activateEvent(authStore.user.id, event.name);
    await adminEventsStore.loadAllEvents(); // Refresh the events list
    console.log("Event activated successfully");
  } catch (err) {
    console.error("Failed to activate event:", err);
    alert("Failed to activate event. Please try again.");
  }
};

const createNewEvent = () => {
  // Navigate to event creation page or open modal
  router.push("/admin/create-event");
};

const handleViewModeSwitch = (mode: "admin" | "reader") => {
  if (mode === "reader") {
    authStore.switchToReaderView();
    router.push("/select-event");
  } else {
    authStore.switchToAdminView();
    // Already on admin page
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!authStore.isAdmin) {
    router.push("/");
  } else {
    await adminEventsStore.loadAllEvents();
  }
});
</script>

<style scoped>
.admin-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
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
  font-weight: 600;
  font-size: 0.9rem;
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
  background: #2563eb;
}

.events-section {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin-bottom: 3rem;
}

.active-events,
.inactive-events {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.active-events h2,
.inactive-events h2 {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.event-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.event-info {
  flex: 1;
  cursor: pointer;
  padding: 0.5rem;
}

.event-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.event-details {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-archive {
  background: #e74c3c;
  color: white;
}

.btn-archive:hover {
  background: #c0392b;
}

.btn-activate {
  background: #27ae60;
  color: white;
}

.btn-activate:hover {
  background: #229954;
}

.btn-primary {
  background: #3498db;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-primary:hover {
  background: #2980b9;
}

.admin-actions {
  text-align: center;
}

/* Event Details Modal */
.event-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 2rem;
}

.reader-stats h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  text-align: center;
  border: 1px solid var(--border-light);
}

.stat-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-number {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.leaderboard h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 3rem 1fr auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.rank {
  font-weight: 700;
  color: var(--accent-primary);
  font-size: 0.9rem;
}

.name {
  font-weight: 500;
  color: var(--text-primary);
}

.reads {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.time {
  color: var(--text-muted);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .event-item {
    flex-direction: column;
    align-items: stretch;
  }

  .event-name {
    margin-bottom: 0.5rem;
  }

  .event-details-modal {
    padding: 1rem;
  }

  .modal-content {
    max-height: 90vh;
  }

  .modal-header,
  .modal-body {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .leaderboard-item {
    grid-template-columns: 2rem 1fr;
    gap: 0.5rem;
  }

  .reads,
  .time {
    grid-column: 1 / -1;
    font-size: 0.8rem;
  }
}
</style>
