import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface Application {
  id: string;
  content: string;
  assignments?: Array<{ assignment: string; reviewer: string }>;
  reviews?: Array<{
    record: string;
    reviewer: string;
    score: number;
    comment: string;
  }>;
}

export const useApplicationsStore = defineStore("applications", () => {
  const applications = ref<Application[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const addApplication = (application: Application) => {
    const existingIndex = applications.value.findIndex(
      (app) => app.id === application.id
    );
    if (existingIndex >= 0) {
      applications.value[existingIndex] = application;
    } else {
      applications.value.push(application);
    }
  };

  const removeApplication = (applicationId: string) => {
    applications.value = applications.value.filter(
      (app) => app.id !== applicationId
    );
  };

  const updateApplicationContent = (applicationId: string, content: string) => {
    const application = applications.value.find(
      (app) => app.id === applicationId
    );
    if (application) {
      application.content = content;
    }
  };

  const updateApplicationAssignments = (
    applicationId: string,
    assignments: Array<{ assignment: string; reviewer: string }>
  ) => {
    const application = applications.value.find(
      (app) => app.id === applicationId
    );
    if (application) {
      application.assignments = assignments;
    }
  };

  const updateApplicationReviews = (
    applicationId: string,
    reviews: Array<{
      record: string;
      reviewer: string;
      score: number;
      comment: string;
    }>
  ) => {
    const application = applications.value.find(
      (app) => app.id === applicationId
    );
    if (application) {
      application.reviews = reviews;
    }
  };

  const saveApplication = async (applicationId: string, content: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await api.applicationStorage.put(applicationId, content);
      updateApplicationContent(applicationId, content);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to save application";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteApplication = async (applicationId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await api.applicationStorage.delete(applicationId);
      removeApplication(applicationId);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to delete application";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadApplication = async (applicationId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.applicationStorage.get(applicationId);
      const application: Application = {
        id: applicationId,
        content: response[0]?.content || "",
      };
      addApplication(application);
      return application;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load application";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadAssignments = async (applicationId: string) => {
    try {
      const assignments = await api.applicationAssignments.getAssignments(
        applicationId
      );
      updateApplicationAssignments(applicationId, assignments);
      return assignments;
    } catch (err) {
      console.error("Failed to load assignments:", err);
      return [];
    }
  };

  const loadReviews = async (applicationId: string) => {
    try {
      const reviews = await api.reviewRecords.listForApplication(applicationId);
      updateApplicationReviews(applicationId, reviews);
      return reviews;
    } catch (err) {
      console.error("Failed to load reviews:", err);
      return [];
    }
  };

  const assignApplication = async (
    applicationId: string,
    reviewerId: string
  ) => {
    try {
      await api.applicationAssignments.assign(applicationId, reviewerId);
      await loadAssignments(applicationId);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to assign application";
      setError(errorMessage);
      throw err;
    }
  };

  const unassignApplication = async (
    applicationId: string,
    reviewerId: string
  ) => {
    try {
      await api.applicationAssignments.unassign(applicationId, reviewerId);
      await loadAssignments(applicationId);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to unassign application";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    // State
    applications: readonly(applications),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    setError,
    clearError,
    addApplication,
    removeApplication,
    updateApplicationContent,
    updateApplicationAssignments,
    updateApplicationReviews,
    saveApplication,
    deleteApplication,
    loadApplication,
    loadAssignments,
    loadReviews,
    assignApplication,
    unassignApplication,
  };
});
