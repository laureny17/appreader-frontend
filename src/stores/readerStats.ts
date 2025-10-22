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
      // For now, use mock data since the backend endpoint doesn't exist yet
      // TODO: Replace with actual API call when backend implements ReaderStats/getReaderStats
      console.warn(
        "ReaderStats/getReaderStats endpoint not available, using mock data"
      );

      const mockReaders: ReaderStat[] = [
        {
          userId: "1",
          name: "Alice Johnson",
          readCount: 45,
          skipCount: 2,
          averageTime: 8.5,
        },
        {
          userId: "2",
          name: "Bob Smith",
          readCount: 38,
          skipCount: 1,
          averageTime: 7.2,
        },
        {
          userId: "3",
          name: "Carol Davis",
          readCount: 52,
          skipCount: 0,
          averageTime: 9.1,
        },
        {
          userId: "4",
          name: "David Wilson",
          readCount: 29,
          skipCount: 3,
          averageTime: 6.8,
        },
        {
          userId: "5",
          name: "Eve Brown",
          readCount: 41,
          skipCount: 1,
          averageTime: 8.9,
        },
        {
          userId: "6",
          name: "Frank Miller",
          readCount: 33,
          skipCount: 2,
          averageTime: 7.5,
        },
        {
          userId: "7",
          name: "Grace Lee",
          readCount: 47,
          skipCount: 0,
          averageTime: 8.2,
        },
        {
          userId: "8",
          name: "Henry Taylor",
          readCount: 36,
          skipCount: 1,
          averageTime: 7.8,
        },
      ];

      readers.value = mockReaders;
      return mockReaders;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load reader stats";
      setError(errorMessage);
      throw err;
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
