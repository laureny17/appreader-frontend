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
  eventId: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
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

  const isAuthenticated = computed(() => user.value !== null);
  const email = computed(() => user.value?.email || "");
  const name = computed(() => user.value?.name || "");
  const userId = computed(() => user.value?.id || "");

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
      try {
        const accountDetails = await api.auth.getAccountByUserId(response.user);
        console.log("Account details:", accountDetails);

        // Handle array response (as per new API spec)
        if (
          accountDetails &&
          Array.isArray(accountDetails) &&
          accountDetails.length > 0
        ) {
          userName = accountDetails[0]?.name || email;
        }
      } catch (nameError) {
        console.warn("Could not fetch user name, using email:", nameError);
        // Continue with email as name
      }

      const userData: User = {
        id: response.user,
        email: email,
        name: userName,
        isAdmin: false, // Would be determined by backend
      };
      setUser(userData);
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
  };

  const getUsername = async (userId: string) => {
    try {
      const response = await api.auth.getUsername(userId);
      return response[0]?.username || "";
    } catch (err) {
      console.error("Failed to get username:", err);
      return "";
    }
  };

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    isAuthenticated,
    email,
    name,
    userId,

    // Actions
    setUser,
    clearUser,
    setError,
    clearError,
    register,
    login,
    logout,
    getUsername,
  };
});
