import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface Application {
  _id: string;
  event: string;
  applicantID: string;
  applicantYear: string;
  answers: string[];
}

export interface Assignment {
  _id: string;
  user: string;
  application: string;
  startTime: string;
  event: string;
}

export const useApplicationsStore = defineStore("applications", () => {
  const currentApplication = ref<Application | null>(null);
  const currentAssignment = ref<Assignment | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const getNextApplication = async (userId: string, eventId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.applications.getNextApplication(
        userId,
        eventId
      );
      currentAssignment.value = response.assignment;

      // Fetch the actual application details
      const appResponse = await api.applications.getApplication(
        response.assignment.application
      );
      if (appResponse && appResponse.length > 0) {
        currentApplication.value = appResponse[0];
      }

      return {
        assignment: response.assignment,
        application: currentApplication.value,
      };
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to get next application";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const submitReview = async (
    author: string,
    application: string,
    scores: Record<string, number>
  ) => {
    try {
      const currentTime = new Date().toISOString();
      const reviewResponse = await api.applications.submitReview(
        author,
        application,
        currentTime
      );

      // Set scores for each criterion
      for (const [criterion, value] of Object.entries(scores)) {
        await api.applications.setScore(
          author,
          reviewResponse.review,
          criterion,
          value
        );
      }

      return reviewResponse;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to submit review";
      setError(errorMessage);
      throw err;
    }
  };

  const skipApplication = async (user: string, assignment: Assignment) => {
    try {
      await api.applications.skipAssignment(user, assignment);
      currentApplication.value = null;
      currentAssignment.value = null;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to skip application";
      setError(errorMessage);
      throw err;
    }
  };

  const completeApplication = async (user: string, assignment: Assignment) => {
    try {
      const endTime = new Date().toISOString();
      await api.applications.submitAndIncrement(user, assignment, endTime);
      currentApplication.value = null;
      currentAssignment.value = null;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to complete application";
      setError(errorMessage);
      throw err;
    }
  };

  const clearCurrentApplication = () => {
    currentApplication.value = null;
    currentAssignment.value = null;
  };

  return {
    // State
    currentApplication: readonly(currentApplication),
    currentAssignment: readonly(currentAssignment),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    setError,
    clearError,
    getNextApplication,
    submitReview,
    skipApplication,
    completeApplication,
    clearCurrentApplication,
  };
});
