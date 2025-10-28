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
    guidelines?: string[];
  }>;
  eligibilityCriteria: string[];
  questions: string[];
  endDate?: string;
}

export const useAdminEventsStore = defineStore("adminEvents", () => {
  const events = ref<AdminEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentCaller = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const loadAllEvents = async (caller?: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Use provided caller or previous caller
      const callerToUse = caller || currentCaller.value;
      if (!callerToUse) {
        throw new ApiError("Caller ID required for getAllEvents");
      }

      if (caller) {
        currentCaller.value = caller;
      }

      const eventsData = await api.admin.getAllEvents(callerToUse);
      console.log("Events data received:", eventsData);
      events.value = eventsData;
      return eventsData;
    } catch (err) {
      console.error("Failed to load events:", err);
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to load events. The backend endpoint '/api/EventDirectory/getAllEvents' may not be implemented yet.";

      setError(errorMessage);

      // If API fails with 404, it means the backend endpoint isn't implemented
      if (err instanceof ApiError && err.status === 404) {
        console.error(
          "ERROR: The getAllEvents endpoint is not implemented in the backend!"
        );
        console.error(
          "Please implement POST /api/EventDirectory/getAllEvents in your backend."
        );
        console.error(
          "Expected response format: Array of events with _id, name, active, requiredReadsPerApp, rubric, eligibilityCriteria, endDate fields"
        );
      }

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
