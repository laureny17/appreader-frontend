<template>
  <div class="create-event-page">
    <div class="create-event-header">
      <button @click="router.back()" class="back-btn">
        &larr; Back to Events
      </button>
      <h1>Create New Event</h1>
    </div>

    <div class="create-event-form">
      <form @submit.prevent="createEvent">
        <div class="form-group">
          <label for="eventName">Event Name</label>
          <input
            id="eventName"
            v-model="eventData.name"
            type="text"
            required
            placeholder="Enter event name"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="requiredReads">Required Reads Per Application</label>
          <input
            id="requiredReads"
            v-model.number="eventData.requiredReadsPerApp"
            type="number"
            min="1"
            required
            placeholder="e.g., 3"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            id="endDate"
            v-model="eventData.endDate"
            type="date"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Application Questions</label>
          <div class="questions-list">
            <div
              v-for="(question, index) in eventData.questions"
              :key="index"
              class="question-item"
            >
              <input
                v-model="eventData.questions[index]"
                type="text"
                :placeholder="`Question ${index + 1}`"
                class="question-input"
                required
              />
              <button
                @click="removeQuestion(index)"
                type="button"
                class="btn btn-remove-small"
              >
                ×
              </button>
            </div>
            <button @click="addQuestion" type="button" class="btn btn-add">
              + Add Question
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Rubric Criteria</label>
          <div class="criteria-list">
            <div
              v-for="(criterion, index) in eventData.rubric"
              :key="index"
              class="criterion-item"
            >
              <input
                v-model="criterion.name"
                type="text"
                placeholder="Criterion name"
                class="criterion-input"
                required
              />
              <input
                v-model.number="criterion.scaleMin"
                type="number"
                placeholder="Min"
                class="scale-input"
                required
              />
              <input
                v-model.number="criterion.scaleMax"
                type="number"
                placeholder="Max"
                class="scale-input"
                required
              />
              <button
                type="button"
                @click="removeCriterion(index)"
                class="btn btn-remove-small"
              >
                ×
              </button>
            </div>
            <button type="button" @click="addCriterion" class="btn btn-add">
              + Add Criterion
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Eligibility Criteria</label>
          <div class="criteria-list">
            <div
              v-for="(criterion, index) in eventData.eligibilityCriteria"
              :key="index"
              class="criterion-item"
            >
              <input
                v-model="eventData.eligibilityCriteria[index]"
                type="text"
                placeholder="Eligibility criterion"
                class="criterion-input"
              />
              <button
                type="button"
                @click="removeEligibilityCriterion(index)"
                class="btn btn-remove-small"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              @click="addEligibilityCriterion"
              class="btn btn-add"
            >
              + Add Eligibility Criterion
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            @click="router.back()"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? "Creating..." : "Create Event" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAdminEventsStore } from "@/stores/adminEvents";
import { api } from "@/services/api";

const router = useRouter();
const authStore = useAuthStore();
const adminEventsStore = useAdminEventsStore();

const isLoading = ref(false);

const eventData = ref({
  name: "",
  requiredReadsPerApp: 3,
  endDate: "",
  questions: [
    "Tell us about a project you're proud of",
    "Why do you want to attend this event?",
    "What's your biggest technical challenge?",
  ],
  eligibilityCriteria: [] as string[],
  rubric: [
    {
      name: "Technical Skill",
      description: "",
      scaleMin: 1,
      scaleMax: 5,
    },
    {
      name: "Creativity",
      description: "",
      scaleMin: 1,
      scaleMax: 5,
    },
  ],
});

const addQuestion = () => {
  eventData.value.questions.push("");
};

const removeQuestion = (index: number) => {
  if (eventData.value.questions.length > 1) {
    eventData.value.questions.splice(index, 1);
  }
};

const addCriterion = () => {
  eventData.value.rubric.push({
    name: "",
    description: "",
    scaleMin: 1,
    scaleMax: 5,
  });
};

const removeCriterion = (index: number) => {
  if (eventData.value.rubric.length > 1) {
    eventData.value.rubric.splice(index, 1);
  }
};

const addEligibilityCriterion = () => {
  eventData.value.eligibilityCriteria.push("");
};

const removeEligibilityCriterion = (index: number) => {
  eventData.value.eligibilityCriteria.splice(index, 1);
};

const createEvent = async () => {
  if (!authStore.user) return;

  isLoading.value = true;
  try {
    const endDateValue = eventData.value.endDate
      ? new Date(eventData.value.endDate).toISOString()
      : undefined;

    await api.eventDirectory.createEvent(
      authStore.user.id,
      eventData.value.name,
      eventData.value.requiredReadsPerApp,
      eventData.value.rubric.map((c) => ({
        name: c.name,
        description: c.description || "",
        scaleMin: c.scaleMin,
        scaleMax: c.scaleMax,
      })),
      endDateValue,
      eventData.value.eligibilityCriteria.length > 0
        ? eventData.value.eligibilityCriteria
        : undefined,
      eventData.value.questions
    );

    // Refresh events list
    await adminEventsStore.loadAllEvents(authStore.user.id);

    // Navigate back to admin dashboard
    router.push("/admin");
  } catch (err) {
    console.error("Failed to create event:", err);
    alert(
      "Failed to create event: " +
        (err instanceof Error
          ? err.message
          : "Please check all fields are filled correctly.")
    );
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.create-event-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-secondary);
  min-height: 100vh;
}

.create-event-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-light);
}

.back-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--border-medium);
  color: var(--text-primary);
}

.create-event-header h1 {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.create-event-form {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  border: 1px solid var(--border-light);
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.questions-list,
.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item,
.criterion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.question-input,
.criterion-input {
  flex: 2;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.scale-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
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

.btn-add {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.btn-add:hover {
  background: var(--bg-tertiary);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-light);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
}

.btn-secondary:hover {
  background: var(--border-medium);
}
</style>
