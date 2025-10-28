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

  const setReaders = (stats: ReaderStat[]) => {
    readers.value = stats;
  };

  const loadReaderStats = async (eventId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Get reader stats and skip stats from the backend
      const [backendStats, skipStats] = await Promise.allSettled([
        api.readerStats.getReaderStats(eventId),
        api.applicationAssignments.getSkipStatsForEvent(eventId),
      ]);

      const readerStatsData =
        backendStats.status === "fulfilled" ? backendStats.value : [];
      const skipStatsData =
        skipStats.status === "fulfilled" ? skipStats.value : [];

      if (skipStats.status === "rejected") {
        console.warn(
          "Skip stats endpoint failed, using empty skip data:",
          skipStats.reason
        );
      }

      // Transform backend data to frontend format
      const transformedStats: ReaderStat[] = [];

      for (const stat of readerStatsData) {
        try {
          // Get user name
          const userName = await api.auth.getNameByUserId(stat.userId);

          // Find skip count for this user
          const userSkipData = skipStatsData.find(
            (s) => s.userId === stat.userId
          );
          const skipCount = userSkipData?.skipCount || 0;

          transformedStats.push({
            userId: stat.userId,
            name: userName || `User ${stat.userId.slice(-4)}`,
            readCount: stat.readCount,
            skipCount: skipCount,
            averageTime:
              stat.readCount > 0
                ? Math.round(stat.totalTime / stat.readCount)
                : 0,
          });
        } catch (nameErr) {
          // If we can't get the name, use a fallback
          const userSkipData = skipStatsData.find(
            (s) => s.userId === stat.userId
          );
          const skipCount = userSkipData?.skipCount || 0;

          transformedStats.push({
            userId: stat.userId,
            name: `User ${stat.userId.slice(-4)}`,
            readCount: stat.readCount,
            skipCount: skipCount,
            averageTime:
              stat.readCount > 0
                ? Math.round(stat.totalTime / stat.readCount)
                : 0,
          });
        }
      }

      readers.value = transformedStats;
      return transformedStats;
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
    setReaders,
  };
});
