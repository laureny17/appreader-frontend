<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>EVENTS</h1>
    </div>

    <div class="events-section">
      <div class="active-events">
        <h2>ACTIVE</h2>
        <div class="event-list">
          <div class="event-item" v-for="event in activeEvents" :key="event.id">
            <input
              type="text"
              :value="event.name"
              class="event-name"
              readonly
            />
            <button @click="archiveEvent(event.id)" class="btn btn-archive">
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
            :key="event.id"
          >
            <input
              type="text"
              :value="event.name"
              class="event-name"
              readonly
            />
            <button @click="activateEvent(event.id)" class="btn btn-activate">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

const activeEvents = computed(() =>
  eventsStore.events.filter((event) => event.active)
);
const inactiveEvents = computed(() =>
  eventsStore.events.filter((event) => !event.active)
);

const archiveEvent = async (eventId: string) => {
  try {
    await eventsStore.inactivateEvent(eventId);
  } catch (err) {
    console.error("Failed to archive event:", err);
  }
};

const activateEvent = async (eventId: string) => {
  try {
    await eventsStore.activateEvent(eventId);
  } catch (err) {
    console.error("Failed to activate event:", err);
  }
};

const createNewEvent = () => {
  // This would open a modal or navigate to event creation page
  console.log("Create new event");
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!authStore.user?.isAdmin) {
    router.push("/");
  } else {
    await eventsStore.loadEvents();
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
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
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
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  background: #f8f9fa;
}

.event-name {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
  color: #2c3e50;
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

@media (max-width: 768px) {
  .event-item {
    flex-direction: column;
    align-items: stretch;
  }

  .event-name {
    margin-bottom: 0.5rem;
  }
}
</style>
