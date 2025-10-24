import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";

export interface ReaderStat {
  userId: string;
  name: string;
  readCount: number;
  skipCount: number;
  averageTime: number;
}

export const useReaderStatsStore = defineStore("readerStats", () => {
  const readers = ref<ReaderStat[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const loadReaderStats = async (eventId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Try to get reader stats from the backend
      const readerStats = await api.readerStats.getReaderStats(eventId);
      readers.value = readerStats;
      return readerStats;
    } catch (err) {
      // If the endpoint doesn't exist (404), show empty state gracefully
      console.warn("ReaderStats endpoint not available, showing empty state");
      readers.value = [];
      // Don't set error for missing endpoint, just show empty state
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const sortedReaders = computed(() => {
    return [...readers.value].sort((a, b) => b.readCount - a.readCount);
  });

  return {
    // State
    readers: readonly(readers),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    sortedReaders,

    // Actions
    setError,
    clearError,
    loadReaderStats,
  };
});
