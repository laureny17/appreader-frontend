import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface User {
  id: string;
  username: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => user.value !== null);
  const username = computed(() => user.value?.username || "");

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

  const register = async (username: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.auth.register(username, password);
      const userData: User = {
        id: response.user,
        username: username,
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

  const login = async (username: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.auth.login(username, password);
      const userData: User = {
        id: response.user,
        username: username,
      };
      setUser(userData);
      return userData;
    } catch (err) {
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
    username,

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
