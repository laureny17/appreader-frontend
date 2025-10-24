import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface AdminEvent {
  _id: string;
  name: string;
  active: boolean;
  requiredReadsPerApp: number;
  rubric: Array<{
    name: string;
    description: string;
    scaleMin: number;
    scaleMax: number;
  }>;
  eligibilityCriteria: string[];
  endDate?: string;
}

export const useAdminEventsStore = defineStore("adminEvents", () => {
  const events = ref<AdminEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const loadAllEvents = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const eventsData = await api.admin.getAllEvents();
      events.value = eventsData;
      return eventsData;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load events";
      setError(errorMessage);
      // If API fails, show empty state instead of mock data
      events.value = [];
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const activeEvents = computed(() =>
    events.value.filter((event) => event.active)
  );

  const inactiveEvents = computed(() =>
    events.value.filter((event) => !event.active)
  );

  return {
    // State
    events: readonly(events),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    activeEvents,
    inactiveEvents,

    // Actions
    setError,
    clearError,
    loadAllEvents,
  };
});
