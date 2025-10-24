<template>
  <div class="event-config-page">
    <div class="config-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">← Back to Events</button>
        <h1>{{ eventName }}</h1>
      </div>
      <div class="view-toggle" v-if="authStore.isAdmin">
        <button
          @click="handleViewModeSwitch('admin')"
          :class="{ active: authStore.isAdminView }"
          class="toggle-btn"
        >
          ADMIN VIEW
        </button>
        <button
          @click="handleViewModeSwitch('reader')"
          :class="{ active: authStore.isReaderView }"
          class="toggle-btn"
        >
          READER VIEW
        </button>
      </div>
    </div>

    <div class="config-content">
      <div class="config-sections">
        <!-- Users Section -->
        <div class="config-section">
          <h2>USERS</h2>
          <div class="users-container">
            <div class="user-group">
              <h3>APPROVED READERS</h3>
              <div class="user-list">
                <div
                  v-for="reader in approvedReaders"
                  :key="reader.id"
                  class="user-item"
                >
                  <span class="user-name">{{ reader.name }}</span>
                  <button
                    @click="removeReader(reader.id)"
                    class="btn btn-remove"
                  >
                    REMOVE
                  </button>
                </div>
                <div v-if="approvedReaders.length === 0" class="empty-state">
                  No approved readers yet
                </div>
              </div>
            </div>

            <div class="user-group">
              <h3>UNVERIFIED</h3>
              <div class="user-list">
                <div
                  v-for="user in unverifiedUsers"
                  :key="user.id"
                  class="user-item"
                >
                  <span class="user-name">{{ user.name }}</span>
                  <button @click="approveUser(user.id)" class="btn btn-approve">
                    APPROVE
                  </button>
                </div>
                <div v-if="unverifiedUsers.length === 0" class="empty-state">
                  No pending users
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rubric Section -->
        <div class="config-section">
          <h2>RUBRIC</h2>
          <div class="rubric-container">
            <div
              v-for="(criterion, index) in rubric"
              :key="criterion.id"
              class="criterion-panel"
            >
              <div class="criterion-header" @click="toggleCriterion(index)">
                <h3>CRITERION {{ index + 1 }}</h3>
                <span class="toggle-icon">{{
                  expandedCriterion === index ? "^" : "v"
                }}</span>
              </div>

              <div v-if="expandedCriterion === index" class="criterion-content">
                <div class="criterion-field">
                  <label>SCALE:</label>
                  <div class="scale-inputs">
                    <input
                      v-model="criterion.scaleMin"
                      type="number"
                      placeholder="Min"
                      class="scale-input"
                    />
                    <span>-</span>
                    <input
                      v-model="criterion.scaleMax"
                      type="number"
                      placeholder="Max"
                      class="scale-input"
                    />
                  </div>
                </div>

                <div class="criterion-field">
                  <label>DESCRIPTION:</label>
                  <textarea
                    v-model="criterion.description"
                    placeholder="Enter criterion description"
                    class="description-input"
                  ></textarea>
                </div>

                <div class="criterion-field">
                  <label>SCORING GUIDELINES:</label>
                  <div class="guidelines-table">
                    <div v-for="i in 5" :key="i" class="guideline-row">
                      <span class="score-number">{{ i }}</span>
                      <input
                        v-model="criterion.guidelines[i - 1]"
                        :placeholder="`Guideline for score ${i}`"
                        class="guideline-input"
                      />
                    </div>
                  </div>
                </div>

                <button @click="saveCriterion(index)" class="btn btn-save">
                  SAVE
                </button>
              </div>
            </div>

            <button @click="addCriterion" class="btn btn-add">
              + ADD CRITERION
            </button>
          </div>
        </div>

        <div class="eligibility-section">
          <h2>ELIGIBILITY CRITERIA</h2>
          <div class="eligibility-container">
            <div class="criteria-list">
              <div
                v-for="(criterion, index) in eligibilityCriteria"
                :key="index"
                class="criterion-item"
              >
                <input
                  v-model="eligibilityCriteria[index]"
                  type="text"
                  :placeholder="`Eligibility criterion ${index + 1}`"
                  class="criterion-input"
                />
                <button
                  @click="removeCriterion(index)"
                  class="btn btn-remove-small"
                >
                  ×
                </button>
              </div>
              <div v-if="eligibilityCriteria.length === 0" class="empty-state">
                No eligibility criteria defined.
              </div>
            </div>
            <button @click="addEligibilityCriterion" class="btn btn-add">
              + ADD CRITERION
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const eventName = ref("HackMIT 2025"); // This would come from route params or store
const expandedCriterion = ref(0);

// Data will be loaded from API
const approvedReaders = ref<Array<{ id: string; name: string }>>([]);
const unverifiedUsers = ref<Array<{ id: string; name: string }>>([]);
const eligibilityCriteria = ref<string[]>([]);

const rubric = ref<
  Array<{
    id: string;
    scaleMin: number;
    scaleMax: number;
    description: string;
    guidelines: string[];
  }>
>([]);

const goBack = () => {
  router.push("/admin");
};

const handleViewModeSwitch = (mode: "admin" | "reader") => {
  if (mode === "reader") {
    authStore.switchToReaderView();
    router.push("/select-event");
  } else {
    authStore.switchToAdminView();
    // Already in admin view
  }
};

const toggleCriterion = (index: number) => {
  expandedCriterion.value = expandedCriterion.value === index ? -1 : index;
};

const addCriterion = () => {
  const newCriterion = {
    id: Date.now().toString(),
    scaleMin: 1,
    scaleMax: 5,
    description: "",
    guidelines: ["", "", "", "", ""],
  };
  rubric.value.push(newCriterion);
  expandedCriterion.value = rubric.value.length - 1;
};

const saveCriterion = (index: number) => {
  // TODO: Save to backend
  console.log("Saving criterion:", rubric.value[index]);
  expandedCriterion.value = -1;
};

const approveUser = (userId: string) => {
  // TODO: Approve user via API
  console.log("Approving user:", userId);
  const user = unverifiedUsers.value.find((u) => u.id === userId);
  if (user) {
    approvedReaders.value.push(user);
    unverifiedUsers.value = unverifiedUsers.value.filter(
      (u) => u.id !== userId
    );
  }
};

const removeReader = (readerId: string) => {
  // TODO: Remove reader via API
  console.log("Removing reader:", readerId);
  const reader = approvedReaders.value.find((r) => r.id === readerId);
  if (reader) {
    unverifiedUsers.value.push(reader);
    approvedReaders.value = approvedReaders.value.filter(
      (r) => r.id !== readerId
    );
  }
};

const addEligibilityCriterion = () => {
  eligibilityCriteria.value.push("");
};

const removeCriterion = (index: number) => {
  eligibilityCriteria.value.splice(index, 1);
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!authStore.isAdmin) {
    router.push("/");
  }
});
</script>

<style scoped>
.event-config-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-secondary);
  min-height: 100vh;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--bg-tertiary);
}

.config-header h1 {
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.toggle-btn.active {
  background: var(--accent-primary);
  color: white;
}

.config-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.config-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}

.config-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.users-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-group h3 {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.user-name {
  color: var(--text-primary);
  font-weight: 500;
}

.empty-state {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.rubric-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.criterion-panel {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background 0.2s ease;
}

.criterion-header:hover {
  background: var(--bg-tertiary);
}

.criterion-header h3 {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.toggle-icon {
  color: var(--text-secondary);
  font-weight: bold;
  font-size: 1.2rem;
}

.criterion-content {
  padding: 1.5rem;
  background: var(--bg-primary);
}

.criterion-field {
  margin-bottom: 1.5rem;
}

.criterion-field label {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.scale-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scale-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  text-align: center;
}

.description-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  resize: vertical;
  min-height: 80px;
}

.guidelines-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.guideline-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-number {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.9rem;
}

.guideline-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-approve {
  background: var(--accent-success);
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-remove {
  background: var(--accent-danger);
  color: white;
}

.btn-remove:hover {
  background: #dc2626;
}

.btn-save {
  background: var(--accent-primary);
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

.btn-add {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
}

.btn-add:hover {
  background: var(--bg-tertiary);
}

.eligibility-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  border: 1px solid var(--border-light);
  margin-top: 2rem;
}

.eligibility-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 1rem;
}

.eligibility-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.criterion-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.criterion-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn-remove-small {
  background: var(--accent-danger);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.btn-remove-small:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .config-sections {
    grid-template-columns: 1fr;
  }

  .config-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
