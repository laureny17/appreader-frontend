<template>
  <div class="event-selection">
    <div class="selection-container">
      <div class="welcome-section">
        <h2>Welcome back, {{ name }}!</h2>
        <p>Select an event to continue:</p>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Loading your events...</p>
      </div>

      <div v-else-if="verifiedEvents.length === 0" class="no-events">
        <h3>No Events Available</h3>
        <p>You don't have access to any events yet.</p>
        <p>Contact an administrator to get verified for an event.</p>
      </div>

      <div v-else class="events-list">
        <div
          v-for="event in verifiedEvents"
          :key="event.eventId"
          class="event-card"
          @click="selectEvent(event)"
        >
          <h3>{{ event.name }}</h3>
          <p class="event-description">{{ event.description }}</p>
          <div class="event-dates">
            <span v-if="event.endDate" class="end-date">
              Reading ends: {{ formatEndDate(event.endDate) }}
            </span>
            <span v-else class="end-date"> No end date set </span>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";

const emit = defineEmits<{
  "event-selected": [event: any];
}>();

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

const isLoading = computed(() => eventsStore.isLoading);
const error = computed(() => eventsStore.error);
const name = computed(() => authStore.name);
const verifiedEvents = computed(() => eventsStore.verifiedEvents);

const selectEvent = (event: any) => {
  eventsStore.selectEvent(event);
  emit("event-selected", event);
  router.push("/");
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatEndDate = (endDate: string) => {
  return new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else {
    try {
      await eventsStore.loadVerifiedEventsForUser(authStore.userId);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  }
});
</script>

<style scoped>
.event-selection {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.selection-container {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 3rem;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  text-align: center;
  border: 1px solid var(--border-light);
}

.logo {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-primary);
  margin-bottom: 1rem;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.welcome-section {
  margin-bottom: 2rem;
}

.welcome-section h2 {
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.welcome-section p {
  color: #718096;
  font-size: 1.1rem;
}

.loading {
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.no-events {
  padding: 2rem;
  color: #718096;
}

.no-events h3 {
  color: #4a5568;
  margin-bottom: 1rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.event-card:hover {
  border-color: #667eea;
  background: #edf2f7;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.event-card h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.event-description {
  color: #718096;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.event-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
  color: #4a5568;
}

.start-date,
.end-date {
  font-weight: 500;
}

.error-message {
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #feb2b2;
}

@media (max-width: 640px) {
  .selection-container {
    padding: 2rem;
    margin: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .event-card {
    padding: 1rem;
  }
}
</style>
