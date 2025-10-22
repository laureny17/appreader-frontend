<template>
  <div class="application-detail">
    <div class="detail-header">
      <h1>Application: {{ applicationId }}</h1>
      <div class="header-actions">
        <button @click="goBack" class="btn btn-secondary">Back</button>
        <button @click="editApplication" class="btn btn-primary">Edit</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading application...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadApplication" class="btn btn-primary">Retry</button>
    </div>

    <div v-else-if="application" class="detail-content">
      <div class="content-section">
        <h2>Content</h2>
        <div class="content-display">
          <pre>{{ application.content }}</pre>
        </div>
      </div>

      <div class="assignments-section">
        <h2>Assignments</h2>
        <div v-if="application.assignments?.length === 0" class="empty-state">
          <p>No assignments yet</p>
        </div>
        <div v-else class="assignments-list">
          <div
            v-for="assignment in application.assignments"
            :key="assignment.assignment"
            class="assignment-item"
          >
            <span>Reviewer: {{ assignment.reviewer }}</span>
            <button
              @click="unassignReviewer(assignment.reviewer)"
              class="btn btn-sm btn-danger"
            >
              Unassign
            </button>
          </div>
        </div>
      </div>

      <div class="reviews-section">
        <h2>Reviews</h2>
        <div v-if="application.reviews?.length === 0" class="empty-state">
          <p>No reviews yet</p>
        </div>
        <div v-else class="reviews-list">
          <div
            v-for="review in application.reviews"
            :key="review.record"
            class="review-item"
          >
            <div class="review-header">
              <span class="reviewer">Reviewer: {{ review.reviewer }}</span>
              <span class="score">Score: {{ review.score }}/10</span>
            </div>
            <div class="review-comment">
              <p>{{ review.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApplicationsStore } from "@/stores/applications";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const applicationsStore = useApplicationsStore();
const authStore = useAuthStore();

const applicationId = computed(() => route.params.id as string);
const application = computed(() =>
  applicationsStore.applications.find((app) => app.id === applicationId.value)
);
const isLoading = computed(() => applicationsStore.isLoading);
const error = computed(() => applicationsStore.error);

const loadApplication = async () => {
  try {
    await applicationsStore.loadApplication(applicationId.value);
    await applicationsStore.loadAssignments(applicationId.value);
    await applicationsStore.loadReviews(applicationId.value);
  } catch (err) {
    console.error("Failed to load application:", err);
  }
};

const goBack = () => {
  router.push("/dashboard");
};

const editApplication = () => {
  router.push(`/applications/${applicationId.value}/edit`);
};

const unassignReviewer = async (reviewerId: string) => {
  try {
    await applicationsStore.unassignApplication(
      applicationId.value,
      reviewerId
    );
  } catch (err) {
    console.error("Failed to unassign reviewer:", err);
  }
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else {
    loadApplication();
  }
});
</script>

<style scoped>
.application-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.detail-header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  color: #e74c3c;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-section,
.assignments-section,
.reviews-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-section h2,
.assignments-section h2,
.reviews-section h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.content-display {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.content-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "Courier New", monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.assignments-list,
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-item,
.review-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #f8f9fa;
}

.review-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.reviewer {
  font-weight: 500;
  color: #2c3e50;
}

.score {
  color: #27ae60;
  font-weight: 600;
}

.review-comment {
  width: 100%;
}

.review-comment p {
  margin: 0;
  color: #555;
  line-height: 1.4;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}
</style>
