<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>ADMIN DASHBOARD</h1>
    </div>

    <div class="dashboard-container">
      <div class="events-section">
        <div class="active-events">
          <h2>ACTIVE EVENTS</h2>
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
          <h2>INACTIVE EVENTS</h2>
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
              <button
                @click="activateEvent(event._id)"
                class="btn btn-activate"
              >
                SET ACTIVE
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-management-section">
        <h2>ADMIN MANAGEMENT</h2>

        <!-- Current Admins List -->
        <div class="admins-list">
          <h3>CURRENT ADMINS</h3>
          <div v-if="loadingAdmins" class="loading-state">
            Loading admins...
          </div>
          <div v-else-if="currentAdmins.length === 0" class="empty-state">
            No admins found
          </div>
          <div v-else class="admin-list">
            <div
              v-for="admin in visibleAdmins"
              :key="admin.id"
              class="admin-item"
            >
              <div class="admin-info">
                <span class="admin-name">{{ admin.name }}</span>
                <span class="admin-email">{{ admin.email }}</span>
              </div>
              <button
                @click="handleRemoveAdmin(admin.id, admin.name)"
                class="btn btn-remove"
                :disabled="
                  admin.id === authStore.user?.id || loadingAdminAction
                "
                :title="
                  admin.id === authStore.user?.id
                    ? 'Cannot remove yourself'
                    : ''
                "
              >
                REMOVE
              </button>
            </div>
            <div v-if="currentAdmins.length > 0" class="user-count">
              Showing {{ Math.min(currentAdmins.length, 10) }} of
              {{ currentAdmins.length }} admin{{
                currentAdmins.length !== 1 ? "s" : ""
              }}
            </div>
          </div>
        </div>

        <!-- Add Admin Section -->
        <div class="add-admin-section">
          <h3>ADD ADMIN</h3>
          <input
            v-model="userSearchTerm"
            type="text"
            placeholder="Search by name or email..."
            class="search-input"
          />
          <div class="user-search-results">
            <div v-for="user in visibleUsers" :key="user._id" class="user-item">
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              <button
                @click="handleAddAdmin(user._id, user.name)"
                class="btn btn-add-admin"
                :disabled="isUserAdmin(user._id) || loadingAdminAction"
              >
                ADD AS ADMIN
              </button>
            </div>
            <div
              v-if="userSearchTerm && filteredUsers.length === 0"
              class="empty-state"
            >
              No users found matching "{{ userSearchTerm }}"
            </div>
            <div
              v-else-if="!userSearchTerm && allUsers.length === 0"
              class="empty-state"
            >
              No users available
            </div>
            <div v-else-if="filteredUsers.length > 0" class="user-count">
              Showing {{ Math.min(filteredUsers.length, 10) }} of
              {{ filteredUsers.length }} user{{
                filteredUsers.length !== 1 ? "s" : ""
              }}
            </div>
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
import { api, ApiError } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const adminEventsStore = useAdminEventsStore();
const readerStatsStore = useReaderStatsStore();

const activeEvents = computed(() => adminEventsStore.activeEvents);
const inactiveEvents = computed(() => adminEventsStore.inactiveEvents);
const selectedEvent = ref<string | null>(null);
const showEventDetails = ref(false);

// Admin management state
const allUsers = ref<Array<{ _id: string; name: string; email: string }>>([]);
const adminStatuses = ref<Record<string, boolean>>({});
const userSearchTerm = ref("");
const loadingAdmins = ref(false);
const loadingAdminAction = ref(false);

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

    const confirmed = confirm(
      `Are you sure you want to archive "${event.name}"?\n\nThis will set the event to inactive.`
    );
    if (!confirmed) return;

    await api.eventDirectory.inactivateEvent(authStore.user.id, event.name);
    await adminEventsStore.loadAllEvents(authStore.user.id); // Refresh the events list
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

    const confirmed = confirm(
      `Are you sure you want to activate "${event.name}"?\n\nThis will set the event to active.`
    );
    if (!confirmed) return;

    await api.eventDirectory.activateEvent(authStore.user.id, event.name);
    await adminEventsStore.loadAllEvents(authStore.user.id); // Refresh the events list
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

// Admin management functions
const loadAllUsers = async () => {
  if (!authStore.user?.id) return;

  try {
    loadingAdmins.value = true;
    const users = await api.auth.getAllUsers(authStore.user.id);
    allUsers.value = users;

    // Check admin status for each user
    await Promise.all(
      users.map(async (user) => {
        try {
          const adminCheck = await api.admin.checkAdminStatus(user._id);
          adminStatuses.value[user._id] = adminCheck[0]?.isAdmin ?? false;
        } catch (err) {
          console.error(
            `Failed to check admin status for user ${user._id}:`,
            err
          );
          adminStatuses.value[user._id] = false;
        }
      })
    );
  } catch (err) {
    console.error("Failed to load users:", err);
    alert("Failed to load users. Please try again.");
  } finally {
    loadingAdmins.value = false;
  }
};

const currentAdmins = computed(() => {
  return allUsers.value
    .filter((user) => adminStatuses.value[user._id])
    .map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
    }));
});

const filteredUsers = computed(() => {
  const nonAdminUsers = allUsers.value.filter(
    (user) => !adminStatuses.value[user._id]
  );

  if (!userSearchTerm.value) {
    return nonAdminUsers;
  }

  const search = userSearchTerm.value.toLowerCase();
  return nonAdminUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user._id.toLowerCase().includes(search)
  );
});

// Show up to 10 admins (simple limit like EventConfiguration)
const visibleAdmins = computed(() => {
  return currentAdmins.value.slice(0, 10);
});

// Show up to 10 filtered users (same as EventConfiguration)
const visibleUsers = computed(() => {
  return filteredUsers.value.slice(0, 10);
});

const isUserAdmin = (userId: string): boolean => {
  return adminStatuses.value[userId] ?? false;
};

const handleAddAdmin = async (userId: string, userName: string) => {
  if (!authStore.user?.id) return;

  const confirmed = confirm(
    `Are you sure you want to add "${userName}" as an admin?`
  );
  if (!confirmed) return;

  try {
    loadingAdminAction.value = true;
    await api.eventDirectory.addAdmin(authStore.user.id, userId);

    // Update admin status
    adminStatuses.value[userId] = true;

    alert(`✅ "${userName}" has been added as an admin successfully!`);
    userSearchTerm.value = ""; // Clear search
  } catch (err) {
    console.error("Failed to add admin:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    alert(`Failed to add admin: ${errorMessage}`);
  } finally {
    loadingAdminAction.value = false;
  }
};

const handleRemoveAdmin = async (userId: string, userName: string) => {
  if (!authStore.user?.id) return;

  // Prevent removing yourself
  if (userId === authStore.user.id) {
    alert("You cannot remove your own admin status.");
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to remove "${userName}" as an admin?`
  );
  if (!confirmed) return;

  try {
    loadingAdminAction.value = true;
    await api.eventDirectory.removeAdmin(authStore.user.id, userId);

    // Update admin status
    adminStatuses.value[userId] = false;

    alert(`✅ "${userName}" has been removed as an admin successfully!`);
  } catch (err) {
    console.error("Failed to remove admin:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    alert(`Failed to remove admin: ${errorMessage}`);
  } finally {
    loadingAdminAction.value = false;
  }
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
  console.log("Admin page mounted");
  console.log("authStore.isAuthenticated:", authStore.isAuthenticated);
  console.log("authStore.isAdmin:", authStore.isAdmin);

  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!authStore.isAdmin) {
    console.log("User is not admin, redirecting");
    router.push("/");
  } else {
    console.log("Loading events...");
    console.log("Auth store user:", authStore.user);
    try {
      await adminEventsStore.loadAllEvents(authStore.user?.id);
      console.log("Loaded events:", adminEventsStore.events.length);
      console.log("Active events:", adminEventsStore.activeEvents.length);
      console.log("Inactive events:", adminEventsStore.inactiveEvents.length);

      // Load users and admin statuses
      await loadAllUsers();
    } catch (err) {
      console.error("Error loading events:", err);

      // Check if it's a 404 error (endpoint not implemented)
      if (err instanceof ApiError && err.status === 404) {
        alert(
          "The getAllEvents backend endpoint is not implemented yet.\n\n" +
            "Please implement POST /api/EventDirectory/getAllEvents in your backend.\n\n" +
            "See api-spec.md lines 944-982 for the API specification."
        );
      } else {
        alert(
          "Failed to load events. Please check your connection and try refreshing the page."
        );
      }
    }
  }
});
</script>

<style scoped>
.admin-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-secondary);
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
  background: var(--accent-secondary);
}

.dashboard-container {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  margin-bottom: 3rem;
}

.events-section {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  flex: 1;
}

.admin-management-section {
  flex: 1;
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.admin-management-section h2 {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.admin-management-section h3 {
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.admins-list {
  display: flex;
  flex-direction: column;
}

.add-admin-section {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.admin-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.admin-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.admin-email {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-remove {
  background: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-remove:hover:not(:disabled) {
  background: #c82333;
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  flex-shrink: 0;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.user-search-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.user-email {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-add-admin {
  background: var(--accent-success);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-add-admin:hover:not(:disabled) {
  background: #7aa94c;
}

.btn-add-admin:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.user-count {
  padding: 0.75rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}

@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
  }

  .events-section {
    order: 1;
  }

  .admin-management-section {
    order: 2;
  }

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

.active-events,
.inactive-events {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
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
  background: #fb9905;
  color: white;
}

.btn-archive:hover {
  background: #e48a04;
}

.btn-activate {
  background: var(--accent-success);
  color: white;
}

.btn-activate:hover {
  background: #7aa94c;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-primary:hover {
  background: var(--accent-secondary);
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
