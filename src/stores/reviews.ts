import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { api, ApiError } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

export interface ReviewRecord {
  record: string;
  application: string;
  reviewer: string;
  score: number;
  comment: string;
}

export const useReviewsStore = defineStore("reviews", () => {
  const authStore = useAuthStore();
  const reviews = ref<ReviewRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const setError = (errorMessage: string) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const addReview = (review: ReviewRecord) => {
    const existingIndex = reviews.value.findIndex(
      (r) => r.record === review.record
    );
    if (existingIndex >= 0) {
      reviews.value[existingIndex] = review;
    } else {
      reviews.value.push(review);
    }
  };

  const removeReview = (recordId: string) => {
    reviews.value = reviews.value.filter((r) => r.record !== recordId);
  };

  const updateReview = (recordId: string, updates: Partial<ReviewRecord>) => {
    const review = reviews.value.find((r) => r.record === recordId);
    if (review) {
      Object.assign(review, updates);
    }
  };

  const saveReview = async (
    applicationId: string,
    reviewerId: string,
    score: number,
    comment: string
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.reviewRecords.submitReview(
        applicationId,
        reviewerId,
        score,
        comment
      );
      const review: ReviewRecord = {
        record: response.reviewId,
        application: applicationId,
        reviewer: reviewerId,
        score,
        comment,
      };
      addReview(review);
      return review;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to save review";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteReview = async (applicationId: string, reviewerId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Find the review first to get its ID
      const review = reviews.value.find(
        (r) => r.application === applicationId && r.reviewer === reviewerId
      );
      if (review && review.record && authStore.user) {
        await api.reviewRecords.deleteReview(
          authStore.user.id,
          review.record,
          reviewerId
        );
        removeReview(review.record);
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to delete review";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadReview = async (applicationId: string, reviewerId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.reviewRecords.getReviewsForItem(applicationId);
      const userReview = response.find((r) => r.user === reviewerId);
      const review: ReviewRecord = {
        record: userReview?.reviewId || "",
        application: applicationId,
        reviewer: reviewerId,
        score: userReview?.rating || 0,
        comment: userReview?.comment || "",
      };
      if (userReview) {
        addReview(review);
      }
      return review;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load review";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadReviewsForApplication = async (applicationId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.reviewRecords.getReviewsForItem(applicationId);
      reviews.value = reviews.value.filter(
        (r) => r.application !== applicationId
      );
      response.forEach(
        (review: {
          reviewId: string;
          user: string;
          rating: number;
          comment: string;
          timestamp: number;
        }) => {
          addReview({
            record: review.reviewId,
            application: applicationId,
            reviewer: review.user,
            score: review.rating,
            comment: review.comment,
          });
        }
      );
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to load reviews for application";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loadReviewsForReviewer = async (reviewerId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.reviewRecords.getReviewsByUser(reviewerId);
      reviews.value = reviews.value.filter((r) => r.reviewer !== reviewerId);
      response.forEach(
        (review: {
          reviewId: string;
          item: string;
          rating: number;
          comment: string;
          timestamp: number;
        }) => {
          addReview({
            record: review.reviewId,
            application: review.item,
            reviewer: reviewerId,
            score: review.rating,
            comment: review.comment,
          });
        }
      );
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to load reviews for reviewer";
      setError(errorMessage);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getReviewsForApplication = computed(() => (applicationId: string) => {
    return reviews.value.filter((r) => r.application === applicationId);
  });

  const getReviewsForReviewer = computed(() => (reviewerId: string) => {
    return reviews.value.filter((r) => r.reviewer === reviewerId);
  });

  const getAverageScore = computed(() => (applicationId: string) => {
    const appReviews = reviews.value.filter(
      (r) => r.application === applicationId
    );
    if (appReviews.length === 0) return 0;
    const total = appReviews.reduce((sum, review) => sum + review.score, 0);
    return total / appReviews.length;
  });

  return {
    // State
    reviews: readonly(reviews),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    getReviewsForApplication,
    getReviewsForReviewer,
    getAverageScore,

    // Actions
    setError,
    clearError,
    addReview,
    removeReview,
    updateReview,
    saveReview,
    deleteReview,
    loadReview,
    loadReviewsForApplication,
    loadReviewsForReviewer,
  };
});
