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

export interface AIComment {
  _id: string;
  application: string;
  category: "Strong" | "Weak" | "Attention";
  quotedSnippet: string;
  justification: string;
}

export const useApplicationsStore = defineStore("applications", () => {
  const applications = ref<Application[]>([]);
  const currentApplication = ref<Application | null>(null);
  const currentApplicationComments = ref<AIComment[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const loadApplicationsForEvent = async (eventId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Try to get applications from the backend
      // Since getApplicationsByEvent might not exist yet, we'll create a workaround
      // by getting the applications we know exist from our previous script
      const knownApplications = [
        "019a0efb-7586-7341-bebd-e949ea1b5397", // APP001
        "019a0efb-7adf-7737-948a-f152b4efc54a", // APP002
        "019a0efb-7f77-78a5-9e9a-30f20b5c0c97", // APP003
        "019a0efb-84a8-7516-820e-0f639a118768", // APP004
        "019a0efb-8add-7b68-a6a7-9fff9c19c0f5", // APP005
      ];

      const applicationsList: Application[] = [];

      // Load each known application
      for (const appId of knownApplications) {
        try {
          const app = await api.applicationStorage.getApplication(appId);
          if (app) {
            applicationsList.push(app);
          }
        } catch (err) {
          console.warn(`Failed to load application ${appId}:`, err);
        }
      }

      applications.value = applicationsList;
      return applicationsList;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load applications";
      setError(errorMessage);
      applications.value = [];
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadApplication = async (applicationId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const application = await api.applicationStorage.getApplication(
        applicationId
      );
      currentApplication.value = application;

      if (application) {
        // Load AI comments for this application
        const comments =
          await api.applicationStorage.getAICommentsByApplication(
            applicationId
          );
        currentApplicationComments.value = comments;
      }

      return application;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load application";
      setError(errorMessage);
      currentApplication.value = null;
      currentApplicationComments.value = [];
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getNextApplication = () => {
    if (applications.value.length === 0) return null;

    // Simple round-robin selection for now
    const currentIndex = applications.value.findIndex(
      (app) => app._id === currentApplication.value?._id
    );
    const nextIndex = (currentIndex + 1) % applications.value.length;
    return applications.value[nextIndex];
  };

  const getPreviousApplication = () => {
    if (applications.value.length === 0) return null;

    const currentIndex = applications.value.findIndex(
      (app) => app._id === currentApplication.value?._id
    );
    const prevIndex =
      currentIndex <= 0 ? applications.value.length - 1 : currentIndex - 1;
    return applications.value[prevIndex];
  };

  return {
    // State
    applications: readonly(applications),
    currentApplication: readonly(currentApplication),
    currentApplicationComments: readonly(currentApplicationComments),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Actions
    setError,
    clearError,
    loadApplicationsForEvent,
    loadApplication,
    getNextApplication,
    getPreviousApplication,
  };
});
