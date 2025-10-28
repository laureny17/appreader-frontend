import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";
import type { Event } from "./auth";

export const useEventsStore = defineStore("events", () => {
  const verifiedEvents = ref<Event[]>([]);
  const currentEvent = ref<Event | null>(null);
  const pendingReaders = ref<
    Array<{ userId: string; username: string; appliedAt: number }>
  >([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const normalizeEventId = (ev: any): string | null => {
    if (!ev) return null;
    return ev._id || ev.eventId || ev.id || null;
  };

  const setCurrentEvent = (event: Event | any) => {
    // Accept either the lightweight Event (with eventId) or full backend doc (with _id)
    const id = normalizeEventId(event);
    if (id) {
      localStorage.setItem("currentEventId", id);
    }
    currentEvent.value = event as any; // keep the object you pass in
  };

  const loadVerifiedEventsForUser = async (userId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.eventDirectory.getVerifiedEventsForUser(
        userId
      );
      console.log("Verified events response:", response);

      // Convert the response format to match our Event interface
      // The response already includes name, so we can use it directly
      const events: Event[] = response.map((item) => ({
        eventId: item.event,
        name: item.name,
        description: "", // Not available in this endpoint
        startTime: 0, // Not available in this endpoint
        endTime: 0, // Not available in this endpoint
        // We'll need to fetch endDate separately if needed
      }));

      // If we need endDate, fetch it for each event
      const eventsWithDetails: Event[] = [];
      for (const event of events) {
        try {
          const eventDetails = await api.eventDirectory.getEventById(
            event.eventId
          );
          if (eventDetails) {
            eventsWithDetails.push({
              ...event,
              endDate: eventDetails.endDate,
              questions: eventDetails.questions,
              rubric: eventDetails.rubric,
              eligibilityCriteria: eventDetails.eligibilityCriteria,
              requiredReadsPerApp: eventDetails.requiredReadsPerApp,
              active: eventDetails.active,
            });
          } else {
            eventsWithDetails.push(event);
          }
        } catch (eventErr) {
          console.warn(
            `Failed to fetch details for event ${event.eventId}:`,
            eventErr
          );
          eventsWithDetails.push(event);
        }
      }

      verifiedEvents.value = eventsWithDetails;
      return eventsWithDetails;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to load verified events";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadPendingReadersForEvent = async (eventId: string) => {
    // TODO: This endpoint doesn't exist in the new API spec
    console.warn(
      "_getPendingReadersForEvent endpoint not available in new API spec"
    );
    pendingReaders.value = [];
    return [];
  };

  const createEvent = async (
    caller: string,
    name: string,
    requiredReadsPerApp: number,
    rubric: Array<{
      name: string;
      description: string;
      scaleMin: number;
      scaleMax: number;
    }>
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.eventDirectory.createEvent(
        caller,
        name,
        requiredReadsPerApp,
        rubric
      );
      const newEvent: Event = {
        eventId: response.event,
        name,
        description: "", // Not available in new API
        startTime: 0, // Not available in new API
        endTime: 0, // Not available in new API
      };

      verifiedEvents.value.push(newEvent);
      return newEvent;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to create event";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectEvent = async (event: Event | any) => {
    try {
      const id = normalizeEventId(event);
      if (!id) {
        console.error("selectEvent: could not determine event id from:", event);
        return;
      }

      // Always fetch the canonical backend event so we have `_id`, rubric, etc.
      const full = await api.eventDirectory.getEventById(id);
      if (!full) {
        console.error("selectEvent: getEventById returned null for", id);
        return;
      }

      // Store canonical backend event and persist its `_id`
      currentEvent.value = full as any; // has `_id`
      localStorage.setItem("currentEventId", full._id);
    } catch (e) {
      console.error("selectEvent failed:", e);
    }
  };

  const updateEventConfig = async (
    caller: string,
    event: string,
    requiredReadsPerApp?: number,
    rubric?: Array<{
      name: string;
      description: string;
      scaleMin: number;
      scaleMax: number;
    }>,
    eligibilityCriteria?: string[]
  ) => {
    try {
      await api.eventDirectory.updateEventConfig(
        caller,
        event,
        requiredReadsPerApp,
        rubric,
        eligibilityCriteria
      );
    } catch (err) {
      console.error("Failed to update event config:", err);
    }
  };

  async function loadCurrentEvent() {
    const savedEventId = localStorage.getItem("currentEventId");
    if (savedEventId) {
      try {
        const event = await api.eventDirectory.getEventById(savedEventId);
        console.log("Loaded current event:", event);
        currentEvent.value = event as any; // ✅ assign to ref, not `this.currentEvent`
        if (event?._id) {
          localStorage.setItem("currentEventId", event._id); // keep canonical id
        }
      } catch (err) {
        console.error("Failed to load current event:", err);
        currentEvent.value = null;
      }
    } else {
      console.warn("No savedEventId found in localStorage");
    }
  }

  return {
    // State
    verifiedEvents: readonly(verifiedEvents),
    currentEvent: readonly(currentEvent),
    pendingReaders: readonly(pendingReaders),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    setError,
    clearError,
    setCurrentEvent,
    loadVerifiedEventsForUser,
    loadPendingReadersForEvent,
    createEvent,
    selectEvent,
    updateEventConfig,
    loadCurrentEvent,
  };
});
