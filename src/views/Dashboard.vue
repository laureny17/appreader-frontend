<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ username }}!</span>
        <button @click="handleLogout" class="btn btn-secondary">Logout</button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Applications</h3>
          <p class="stat-number">{{ applications.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Reviews</h3>
          <p class="stat-number">{{ reviews.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Assignments</h3>
          <p class="stat-number">{{ totalAssignments }}</p>
        </div>
      </div>

      <div class="actions-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button @click="showCreateApplication = true" class="btn btn-primary">
            Create Application
          </button>
          <button @click="loadApplications" class="btn btn-secondary">
            Refresh Data
          </button>
        </div>
      </div>

      <div class="applications-section">
        <h2>Applications</h2>
        <div v-if="applications.length === 0" class="empty-state">
          <p>
            No applications yet. Create your first application to get started!
          </p>
        </div>
        <div v-else class="applications-grid">
          <div
            v-for="application in applications"
            :key="application.id"
            class="application-card"
          >
            <h3>{{ application.id }}</h3>
            <p class="application-content">
              {{ application.content.substring(0, 100) }}...
            </p>
            <div class="application-actions">
              <button
                @click="viewApplication(application.id)"
                class="btn btn-sm btn-primary"
              >
                View
              </button>
              <button
                @click="editApplication(application.id)"
                class="btn btn-sm btn-secondary"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Application Modal -->
    <div
      v-if="showCreateApplication"
      class="modal-overlay"
      @click="showCreateApplication = false"
    >
      <div class="modal" @click.stop>
        <h3>Create New Application</h3>
        <form @submit.prevent="createApplication">
          <div class="form-group">
            <label for="applicationId">Application ID</label>
            <input
              id="applicationId"
              v-model="newApplicationId"
              type="text"
              required
              placeholder="Enter application ID"
            />
          </div>
          <div class="form-group">
            <label for="applicationContent">Content</label>
            <textarea
              id="applicationContent"
              v-model="newApplicationContent"
              required
              rows="6"
              placeholder="Enter application content"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="showCreateApplication = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              {{ isLoading ? "Creating..." : "Create" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useApplicationsStore } from "@/stores/applications";
import { useReviewsStore } from "@/stores/reviews";

const router = useRouter();
const authStore = useAuthStore();
const applicationsStore = useApplicationsStore();
const reviewsStore = useReviewsStore();

const showCreateApplication = ref(false);
const newApplicationId = ref("");
const newApplicationContent = ref("");

const username = computed(() => authStore.username);
const applications = computed(() => applicationsStore.applications);
const reviews = computed(() => reviewsStore.reviews);
const isLoading = computed(() => applicationsStore.isLoading);
const totalAssignments = computed(() => {
  return applications.value.reduce(
    (total, app) => total + (app.assignments?.length || 0),
    0
  );
});

const handleLogout = () => {
  authStore.logout();
  router.push("/auth");
};

const loadApplications = async () => {
  // This would typically load from a list endpoint
  // For now, we'll just refresh the current applications
  console.log("Refreshing applications...");
};

const createApplication = async () => {
  try {
    await applicationsStore.saveApplication(
      newApplicationId.value,
      newApplicationContent.value
    );
    showCreateApplication.value = false;
    newApplicationId.value = "";
    newApplicationContent.value = "";
  } catch (err) {
    console.error("Failed to create application:", err);
  }
};

const viewApplication = (applicationId: string) => {
  router.push(`/applications/${applicationId}`);
};

const editApplication = (applicationId: string) => {
  router.push(`/applications/${applicationId}/edit`);
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  }
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: #555;
  font-size: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.actions-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.actions-section h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.applications-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.applications-section h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.applications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.application-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.application-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.application-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.application-content {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.application-actions {
  display: flex;
  gap: 0.5rem;
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

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
