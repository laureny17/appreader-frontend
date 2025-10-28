import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface Event {
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

export interface RubricDimension {
  id: string;
  name: string;
  description: string;
  scaleMin: number;
  scaleMax: number;
  scoringGuidelines: string[];
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const viewMode = ref<"admin" | "reader">("admin"); // Default to admin view for admins

  const isAuthenticated = computed(() => user.value !== null);
  const email = computed(() => user.value?.email || "");
  const name = computed(() => user.value?.name || "");
  const userId = computed(() => user.value?.id || "");
  const isAdmin = computed(() => user.value?.isAdmin || false);
  const isAdminView = computed(() => viewMode.value === "admin");
  const isReaderView = computed(() => viewMode.value === "reader");

  const setUser = (userData: User) => {
    user.value = userData;
    error.value = null;
  };

  const clearUser = () => {
    user.value = null;
    error.value = null;
  };

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.auth.register(name, email, password);
      const userData: User = {
        id: response.user,
        email: email,
        name: name,
        isAdmin: false,
      };
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Registration failed";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    console.log("Attempting login with:", { email, password });

    try {
      const response = await api.auth.login(email, password);
      console.log("Login response:", response);

      // Try to fetch user details to get name, but don't fail if it doesn't work
      let userName = email; // Default to email if we can't get the name
      let isAdmin = false; // Default to false

      try {
        const accountDetails = await api.auth.getAccountByUserId(response.user);
        console.log("Account details:", accountDetails);

        // Handle object or null response
        if (
          accountDetails &&
          typeof accountDetails === "object" &&
          "name" in accountDetails
        ) {
          userName = accountDetails.name || email;
        }
      } catch (nameError) {
        console.warn("Could not fetch user name, using email:", nameError);
        // Continue with email as name
      }

      // Check admin status using the proper endpoint
      console.log("=== ADMIN STATUS DEBUG ===");
      console.log("User ID:", response.user);
      console.log("Email:", email);

      try {
        console.log("Checking admin status for user:", response.user);
        const adminStatus = await api.admin.checkAdminStatus(response.user);
        console.log("Admin status response:", adminStatus);
        isAdmin = adminStatus.isAdmin;
        console.log("Final admin status from API:", isAdmin);
      } catch (adminError) {
        console.error("Admin status check failed:", adminError);
        isAdmin = false;
      }

      console.log("Final isAdmin value:", isAdmin);
      console.log("=== END ADMIN DEBUG ===");

      const userData: User = {
        id: response.user,
        email: email,
        name: userName,
        isAdmin: isAdmin,
      };
      setUser(userData);

      // Set default view mode based on admin status
      if (isAdmin) {
        viewMode.value = "admin";
        console.log("Set viewMode to admin");
      } else {
        viewMode.value = "reader";
        console.log("Set viewMode to reader");
      }

      return userData;
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof ApiError ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    clearUser();
    viewMode.value = "admin"; // Reset to admin view
  };

  const switchToAdminView = () => {
    if (isAdmin.value) {
      viewMode.value = "admin";
    }
  };

  const switchToReaderView = () => {
    viewMode.value = "reader";
  };

  const setAdminStatus = (isAdmin: boolean) => {
    if (user.value) {
      user.value.isAdmin = isAdmin;
    }
    viewMode.value = isAdmin ? "admin" : "reader";
  };

  const getNameByUserId = async (userId: string) => {
    try {
      const response = await api.auth.getAccountByUserId(userId);
      // Expecting array response as per API spec
      return response && Array.isArray(response) && response.length > 0
        ? response[0]?.name || ""
        : "";
    } catch (err) {
      console.error("Failed to get user name:", err);
      return "";
    }
  };

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    viewMode: readonly(viewMode),

    // Computed
    isAuthenticated,
    email,
    name,
    userId,
    isAdmin,
    isAdminView,
    isReaderView,

    // Actions
    setUser,
    clearUser,
    setError,
    clearError,
    register,
    login,
    logout,
    getNameByUserId,
    switchToAdminView,
    switchToReaderView,
    setAdminStatus,
  };
});
