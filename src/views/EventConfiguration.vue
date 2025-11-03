<template>
  <div class="event-config-page">
    <div class="config-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">← Back to Events</button>
        <h1>{{ eventName }}</h1>
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
                  v-for="reader in approvedReaders.slice(0, 10)"
                  :key="reader.id"
                  class="user-item"
                >
                  <div class="user-info">
                    <span class="user-name">{{ reader.name }}</span>
                    <span class="user-email">{{ reader.email }}</span>
                  </div>
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
                <div v-else-if="approvedReaders.length > 0" class="user-count">
                  Showing {{ Math.min(approvedReaders.length, 10) }} of {{ approvedReaders.length }} reader{{
                    approvedReaders.length !== 1 ? "s" : ""
                  }}
                </div>
              </div>
            </div>

            <div class="user-group">
              <h3>UNVERIFIED USERS</h3>
              <input
                type="text"
                v-model="unverifiedSearchTerm"
                placeholder="Search by name or email..."
                class="search-input"
              />
              <div class="user-list">
                <div
                  v-for="user in filteredUnverifiedUsers.slice(0, 10)"
                  :key="user.id"
                  class="user-item"
                >
                  <div class="user-info">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                  <button @click="approveUser(user.id)" class="btn btn-approve">
                    APPROVE
                  </button>
                </div>
                <div
                  v-if="filteredUnverifiedUsers.length === 0"
                  class="empty-state"
                >
                  <span v-if="unverifiedSearchTerm"
                    >No users found matching "{{ unverifiedSearchTerm }}"</span
                  >
                  <span v-else>No unverified users</span>
                </div>
                <div
                  v-else-if="filteredUnverifiedUsers.length > 0"
                  class="user-count"
                >
                  Showing {{ Math.min(filteredUnverifiedUsers.length, 10) }} of {{ filteredUnverifiedUsers.length }} user{{
                    filteredUnverifiedUsers.length !== 1 ? "s" : ""
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event Settings Section -->
        <div class="config-section">
          <h2>EVENT SETTINGS</h2>
          <div class="settings-container">
            <div class="setting-group">
              <h3 class="setting-title">Reading Deadline</h3>
              <div class="input-wrapper">
                <input
                  type="datetime-local"
                  id="endDate"
                  v-model="eventEndDate"
                  class="styled-input"
                  required
                />
              </div>
              <p class="setting-description">
                Set when the reading period ends.
              </p>
            </div>

            <div class="setting-group">
              <h3 class="setting-title">Required Reads Per App</h3>
              <div class="input-wrapper">
                <input
                  type="number"
                  id="requiredReads"
                  v-model.number="requiredReadsPerApp"
                  min="1"
                  max="10"
                  class="styled-input"
                />
              </div>
              <p class="setting-description">
                How many readers must review each application.
              </p>
            </div>
          </div>
          <div class="settings-actions">
            <button
              @click="saveEventSettings"
              :disabled="savingSettings || !isValidSettings"
              class="btn btn-primary"
              :class="{ 'btn-disabled': !isValidSettings }"
            >
              {{ savingSettings ? "Saving..." : "Save Settings" }}
            </button>
            <p v-if="!isValidSettings" class="validation-message">
              Please enter a valid positive integer for required reads per
              application.
            </p>
          </div>
        </div>

        <!-- Eligibility Criteria Section -->
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
                  class="btn btn-remove btn-small"
                >
                  ×
                </button>
              </div>
              <div v-if="eligibilityCriteria.length === 0" class="empty-state">
                No eligibility criteria defined.
              </div>
            </div>
            <div class="eligibility-actions">
              <button @click="addEligibilityCriterion" class="btn btn-add">
                + ADD CRITERION
              </button>
              <button
                @click="saveEligibilityCriteria"
                class="btn btn-primary"
                :disabled="savingCriteria"
              >
                {{ savingCriteria ? "SAVING..." : "SAVE CHANGES" }}
              </button>
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
                <h3>{{ criterion.name || `CRITERION ${index + 1}` }}</h3>
                <span class="toggle-icon">{{
                  expandedCriterion === index ? "^" : "v"
                }}</span>
              </div>

              <div v-if="expandedCriterion === index" class="criterion-content">
                <div class="criterion-field">
                  <label>NAME:</label>
                  <input
                    v-model="criterion.name"
                    type="text"
                    placeholder="Criterion name"
                    class="criterion-name-input"
                  />
                </div>

                <div class="criterion-field">
                  <label>SCALE:</label>
                  <div class="scale-inputs">
                    <input
                      v-model.number="criterion.scaleMin"
                      type="number"
                      placeholder="Min"
                      class="scale-input"
                    />
                    <span>-</span>
                    <input
                      v-model.number="criterion.scaleMax"
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

                <div class="criterion-actions">
                  <button @click="saveCriterion(index)" class="btn btn-save">
                    SAVE
                  </button>
                  <button
                    @click="deleteCriterion(index)"
                    class="btn btn-delete"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>

            <button @click="addCriterion" class="btn btn-add">
              + ADD CRITERION
            </button>
          </div>
        </div>

        <!-- Flagged Applications Section -->
        <div class="flagged-applications-section">
          <h2>FLAGGED APPLICATIONS</h2>

          <!-- Search for Single Applicant -->
          <div class="search-applicant-section">
            <h3>Check Single Applicant</h3>
            <div class="search-box">
              <input
                v-model="searchApplicantID"
                type="text"
                placeholder="Enter applicant ID or application ID"
                class="search-input"
              />
              <button @click="searchApplicant" class="btn btn-search">
                SEARCH
              </button>
            </div>
          </div>

          <div class="flagged-actions">
            <button @click="loadFlaggedApplications" class="btn btn-primary">
              LOAD FLAGGED APPLICATIONS
            </button>
            <button
              @click="exportDisqualifiedCSV"
              class="btn btn-export"
              :disabled="disqualifiedApplications.length === 0"
            >
              EXPORT DISQUALIFIED CSV
            </button>
          </div>

          <!-- Flagged Applications Table -->
          <div
            v-if="flaggedApplications.length > 0"
            class="flagged-table-container"
          >
            <h3>Currently Flagged Applications</h3>
            <div class="flagged-table">
              <div class="table-header">
                <span class="applicant-id">Applicant ID</span>
                <span class="flagged-by">Flagged By</span>
              </div>
              <div
                v-for="app in flaggedApplications"
                :key="app._id"
                class="table-row"
              >
                <span class="applicant-id">{{ app.applicantID }}</span>
                <span class="flagged-by">{{ app.flaggedByName }}</span>
                <div class="actions">
                  <button
                    @click="viewFlaggedApplication(app._id)"
                    class="btn btn-secondary btn-small"
                  >
                    VIEW
                  </button>
                  <button
                    @click="showDisqualifyModal(app)"
                    class="btn btn-danger btn-small"
                    :disabled="app.disqualified"
                  >
                    {{ app.disqualified ? "DISQUALIFIED" : "DISQUALIFY" }}
                  </button>
                  <button
                    @click="removeApplicationFlag(app._id)"
                    class="btn btn-warning btn-small"
                    :disabled="app.disqualified"
                  >
                    REMOVE FLAG
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="flaggedApplicationsLoaded" class="empty-state">
            No flagged applications found.
          </div>

          <!-- Disqualified Applications Table -->
          <div
            v-if="disqualifiedApplications.length > 0"
            class="disqualified-table-container"
          >
            <h3>Disqualified Applications</h3>
            <div class="disqualified-table">
              <div class="table-header">
                <span class="applicant-id">Applicant ID</span>
                <span class="disqualification-reason">Reason</span>
                <span class="disqualified-by">Disqualified By</span>
              </div>
              <div
                v-for="app in disqualifiedApplications"
                :key="app._id"
                class="table-row"
              >
                <span class="applicant-id">{{ app.applicantID }}</span>
                <span class="disqualification-reason">{{
                  app.disqualificationReason
                }}</span>
                <span class="disqualified-by">{{
                  app.disqualifiedByName
                }}</span>
                <div class="actions">
                  <button
                    @click="viewFlaggedApplication(app._id)"
                    class="btn btn-secondary btn-small"
                  >
                    VIEW
                  </button>
                  <button
                    @click="undisqualifyApplication(app._id)"
                    class="btn btn-success btn-small"
                  >
                    UN-DISQUALIFY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CSV Import Section -->
        <div class="csv-import-section">
          <h2>BULK IMPORT APPLICATIONS</h2>

          <div class="import-instructions">
            <h3>Import Instructions</h3>
            <p>Upload a CSV file with the following columns:</p>
            <ul>
              <li>
                <strong>applicantID</strong> - Unique identifier for the
                applicant
              </li>
              <li>
                <strong>applicantYear</strong> - Applicant's year (e.g., "2025",
                "Graduate", etc.)
              </li>
              <li>
                <strong>Q1, Q2, Q3, ...</strong> - Answers to each question (one
                column per question)
              </li>
            </ul>
            <p>
              <strong>Note:</strong> The number of question columns must match
              the number of questions configured for this event.
            </p>
          </div>

          <div class="import-controls">
            <div class="file-upload-area">
              <input
                ref="fileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                style="display: none"
              />
              <button @click="triggerFileSelect" class="btn btn-primary">
                SELECT CSV FILE
              </button>
              <span v-if="selectedFile" class="selected-file">
                Selected: {{ selectedFile.name }}
              </span>
            </div>

            <div v-if="parsedData.length > 0" class="import-preview">
              <h3>Import Preview ({{ parsedData.length }} applications)</h3>
              <div class="preview-table">
                <div class="table-header">
                  <span class="applicant-id">Applicant ID</span>
                  <span class="applicant-year">Year</span>
                  <span class="answers-preview">Answers Preview</span>
                </div>
                <div
                  v-for="(app, index) in parsedData.slice(0, 5)"
                  :key="index"
                  class="table-row"
                >
                  <span class="applicant-id">{{ app.applicantID }}</span>
                  <span class="applicant-year">{{ app.applicantYear }}</span>
                  <span class="answers-preview">
                    {{ app.answers.slice(0, 2).join(", ") }}
                    {{ app.answers.length > 2 ? "..." : "" }}
                  </span>
                </div>
                <div v-if="parsedData.length > 5" class="more-apps">
                  ... and {{ parsedData.length - 5 }} more applications
                </div>
              </div>

              <div class="import-actions">
                <button @click="clearImport" class="btn btn-secondary">
                  CLEAR
                </button>
                <button
                  @click="confirmImport"
                  class="btn btn-success"
                  :disabled="isImporting"
                >
                  {{ isImporting ? "IMPORTING..." : "IMPORT APPLICATIONS" }}
                </button>
              </div>
            </div>

            <div v-if="importErrors.length > 0" class="import-errors">
              <h3>Import Errors</h3>
              <div class="error-list">
                <div
                  v-for="error in importErrors"
                  :key="error.applicantID"
                  class="error-item"
                >
                  <strong>{{ error.applicantID }}:</strong> {{ error.error }}
                </div>
              </div>
            </div>

            <div v-if="importSuccess" class="import-success">
              <h3>✅ Import Successful!</h3>
              <p>
                {{ importStats.importedCount }} applications imported
                successfully.
              </p>
              <p v-if="importStats.errors.length > 0">
                {{ importStats.errors.length }} applications failed to import.
              </p>
            </div>
          </div>
        </div>

        <!-- Bulk Export Section -->
        <div class="reviews-section">
          <h2>BULK EXPORT</h2>

          <!-- Weighted Averages -->
          <div class="weighted-averages-section">
            <h3>Calculate Weighted Averages & Export</h3>

            <div class="weights-container">
              <div
                v-for="criterion in currentEventRubric"
                :key="criterion.name"
                class="weight-input-group"
              >
                <label :for="`weight-${criterion.name}`"
                  >{{ criterion.name }}:</label
                >
                <input
                  :id="`weight-${criterion.name}`"
                  v-model.number="weights[criterion.name]"
                  type="number"
                  :placeholder="`0`"
                  class="weight-input"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div class="export-buttons">
              <button
                @click="calculateWeightedAverages"
                class="btn btn-primary"
              >
                CALCULATE AVERAGES
              </button>
              <button
                @click="exportToCSV"
                class="btn btn-export"
                :disabled="!weightedAverages.length"
              >
                EXPORT CSV
              </button>
            </div>

            <!-- Display Results -->
            <div v-if="weightedAverages.length > 0" class="results-container">
              <h4>Calculated Averages</h4>
              <div class="results-list">
                <div
                  v-for="(result, index) in weightedAverages"
                  :key="index"
                  class="result-item"
                >
                  <span class="result-app">{{ result.applicantID }}:</span>
                  <span class="result-score">{{
                    result.weightedAverage.toFixed(2)
                  }}</span>
                  <span class="result-reviews"
                    >({{ result.numReviews }} reviews)</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Disqualify Modal -->
    <div
      v-if="disqualifyModal.show"
      class="modal-overlay"
      @click="closeDisqualifyModal"
    >
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeDisqualifyModal">×</button>
        <h2>Disqualify Application</h2>

        <div class="modal-section">
          <p>
            <strong>Applicant ID:</strong>
            {{ disqualifyModal.application?.applicantID }}
          </p>
          <p>
            <strong>Flag Reason:</strong>
            {{ disqualifyModal.application?.flagReason }}
          </p>
        </div>

        <div class="modal-section">
          <label for="disqualification-reason">Disqualification Reason:</label>
          <textarea
            id="disqualification-reason"
            v-model="disqualificationReason"
            placeholder="Enter reason for disqualification..."
            class="reason-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button @click="closeDisqualifyModal" class="btn btn-secondary">
            CANCEL
          </button>
          <button
            @click="confirmDisqualify"
            class="btn btn-danger"
            :disabled="!disqualificationReason.trim()"
          >
            DISQUALIFY APPLICATION
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Application Details -->
    <div
      v-if="searchedApplication"
      class="modal-overlay"
      @click="searchedApplication = null"
    >
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="searchedApplication = null">
          ×
        </button>
        <h2>Application Details</h2>

        <div class="detail-section">
          <p>
            <strong>Applicant ID:</strong> {{ searchedApplication.applicantID }}
          </p>
          <p>
            <strong>Applicant Year:</strong>
            {{ searchedApplication.applicantYear }}
          </p>
        </div>

        <h4>Questions & Answers</h4>
        <div class="qa-list">
          <div
            v-for="(answer, index) in searchedApplication.answers"
            :key="index"
            class="qa-item"
          >
            <p class="question-text">
              <strong>Q{{ index + 1 }}:</strong>
              {{ getQuestionForIndex(index) }}
            </p>
            <p class="answer-text">{{ answer }}</p>
          </div>
        </div>

        <h4>All Reviews</h4>
        <div v-if="applicantReviews.length > 0" class="reviews-list">
          <div
            v-for="(review, index) in applicantReviews"
            :key="index"
            class="review-item-detailed"
          >
            <div class="review-header">
              <div class="reviewer-info">
                <span class="review-author"
                  >Reviewer: {{ review.authorName }}</span
                >
                <span class="review-email">{{ review.authorEmail }}</span>
              </div>
              <div class="review-meta">
                <span class="review-date">{{
                  new Date(review.submittedAt).toLocaleDateString()
                }}</span>
              </div>
            </div>
            <div class="review-scores">
              <div
                v-for="score in review.scores"
                :key="score.criterion"
                class="score-item-detailed"
              >
                <span class="criterion-name">{{ score.criterion }}:</span>
                <span class="score-value">{{ score.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="searchedApplication && applicantReviews.length === 0"
          class="no-reviews"
        >
          <p>No reviews yet for this applicant.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { api, ApiError } from "@/services/api";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

const eventName = ref("HackMIT 2025");
const eventEndDate = ref("");
const requiredReadsPerApp = ref<number>(3);
const savingSettings = ref(false);
const expandedCriterion = ref(0);
const currentEventId = ref<string | null>(null);
const currentEventRubric = ref<
  Array<{
    name: string;
    description: string;
    scaleMin: number;
    scaleMax: number;
  }>
>([]);
const allApplications = ref<
  Array<{
    _id: string;
    applicantID: string;
    applicantYear: string;
    answers: string[];
  }>
>([]);

// Data will be loaded from API
const approvedReaders = ref<Array<{ id: string; name: string; email: string }>>(
  []
);
const unverifiedUsers = ref<Array<{ id: string; name: string; email: string }>>(
  []
);
const eligibilityCriteria = ref<string[]>([]);
const savingCriteria = ref(false);
const eventQuestions = ref<string[]>([]);

const rubric = ref<
  Array<{
    id: string;
    name?: string;
    scaleMin: number;
    scaleMax: number;
    description: string;
    guidelines: string[];
  }>
>([]);

// New state for reviews and scoring
interface ApplicantReview {
  author: string;
  authorName: string;
  authorEmail: string;
  submittedAt: string;
  activeTime?: number;
  scores: Array<{ criterion: string; value: number }>;
}

const searchApplicantID = ref("");
const applicantReviews = ref<ApplicantReview[]>([]);
const searchedApplication = ref<any>(null);
const weights = ref<Record<string, number>>({});
const weightedAverages = ref<
  Array<{ applicantID: string; weightedAverage: number; numReviews: number }>
>([]);

// Flagged Applications state
const flaggedApplications = ref<
  Array<{
    _id: string;
    applicantID: string;
    applicantYear: string;
    answers: string[];
    flaggedBy: string;
    flaggedAt: string;
    flagReason: string;
    flaggedByName: string;
    disqualified: boolean;
    disqualificationReason?: string;
    disqualifiedAt?: string;
    disqualifiedBy?: string;
  }>
>([]);

const disqualifiedApplications = ref<
  Array<{
    _id: string;
    applicantID: string;
    applicantYear: string;
    answers: string[];
    disqualificationReason: string;
    disqualifiedAt: string;
    disqualifiedBy: string;
    disqualifiedByName: string;
  }>
>([]);

const flaggedApplicationsLoaded = ref(false);
const disqualifyModal = ref({
  show: false,
  application: null as any,
});
const disqualificationReason = ref("");

// CSV Import state
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const parsedData = ref<
  Array<{
    applicantID: string;
    applicantYear: string;
    answers: string[];
  }>
>([]);
const importErrors = ref<Array<{ applicantID: string; error: string }>>([]);
const importSuccess = ref(false);
const isImporting = ref(false);
const importStats = ref({
  importedCount: 0,
  errors: [] as Array<{ applicantID: string; error: string }>,
});

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const goBack = () => {
  router.push("/admin");
};

const handleViewModeSwitch = (mode: "admin" | "reader") => {
  if (mode === "reader") {
    authStore.switchToReaderView();
    router.push("/select-event");
  } else {
    authStore.switchToAdminView();
  }
};

const toggleCriterion = (index: number) => {
  expandedCriterion.value = expandedCriterion.value === index ? -1 : index;
};

const addCriterion = () => {
  const newCriterion = {
    id: Date.now().toString(),
    name: "",
    scaleMin: 1,
    scaleMax: 5,
    description: "",
    guidelines: ["", "", "", "", ""],
  };
  rubric.value.push(newCriterion);

  // Update currentEventRubric for the Reviews & Scoring section
  currentEventRubric.value = rubric.value.map((c) => ({
    name: c.name || "",
    description: c.description || "",
    scaleMin: c.scaleMin,
    scaleMax: c.scaleMax,
  }));

  expandedCriterion.value = rubric.value.length - 1;
};

const saveCriterion = async (index: number) => {
  if (!currentEventId.value || !authStore.user) return;

  const criterion = rubric.value[index];

  try {
    const updatedRubric = rubric.value.map((c) => ({
      name: c.name || "Untitled",
      description: c.description || "",
      scaleMin: c.scaleMin,
      scaleMax: c.scaleMax,
      guidelines: c.guidelines || [],
    }));

    await api.eventDirectory.updateEventConfig(
      authStore.user.id,
      currentEventId.value,
      undefined, // requiredReadsPerApp
      updatedRubric
    );

    // Update currentEventRubric immediately without reloading
    currentEventRubric.value = updatedRubric;

    // Update weights for any new criteria
    updatedRubric.forEach((criterion) => {
      if (!(criterion.name in weights.value)) {
        weights.value[criterion.name] = 0;
      }
    });

    console.log("Saved criterion:", criterion);
    expandedCriterion.value = -1;
    alert("Criterion saved successfully!");
  } catch (err) {
    console.error("Failed to save criterion:", err);
    alert("Failed to save criterion. Please try again.");
  }
};

const deleteCriterion = async (index: number) => {
  if (
    !confirm(
      "Are you sure you want to delete this criterion? This cannot be undone."
    )
  ) {
    return;
  }

  if (!currentEventId.value || !authStore.user) return;

  try {
    const criterionToDelete = rubric.value[index];
    const updatedRubric = rubric.value
      .filter((_, i) => i !== index)
      .map((c) => ({
        name: c.name || "Untitled",
        description: c.description || "",
        scaleMin: c.scaleMin,
        scaleMax: c.scaleMax,
      }));

    await api.eventDirectory.updateEventConfig(
      authStore.user.id,
      currentEventId.value,
      undefined, // requiredReadsPerApp
      updatedRubric
    );

    // Update UI immediately
    rubric.value = rubric.value.filter((_, i) => i !== index);
    currentEventRubric.value = updatedRubric;

    // Remove weight for deleted criterion
    if (criterionToDelete.name) {
      delete weights.value[criterionToDelete.name];
    }

    alert("Criterion deleted successfully!");
  } catch (err) {
    console.error("Failed to delete criterion:", err);
    alert("Failed to delete criterion. Please try again.");
  }
};

const approveUser = async (userId: string) => {
  if (!currentEventId.value || !authStore.user) return;

  try {
    await api.eventDirectory.addReader(
      authStore.user.id,
      currentEventId.value,
      userId
    );
    // Reload readers
    await loadReaders();
  } catch (err) {
    console.error("Failed to approve user:", err);
    alert("Failed to approve user. Please try again.");
  }
};

const removeReader = async (readerId: string) => {
  if (!currentEventId.value || !authStore.user) return;

  try {
    await api.eventDirectory.removeReader(
      authStore.user.id,
      currentEventId.value,
      readerId
    );
    // Reload readers
    await loadReaders();
  } catch (err) {
    console.error("Failed to remove reader:", err);
    alert("Failed to remove reader. Please try again.");
  }
};

const unverifiedSearchTerm = ref("");

const loadReaders = async () => {
  if (!currentEventId.value || !authStore.user) return;

  try {
    // Get all members for the event (with verification status and names)
    const allMembers = await api.eventDirectory.getAllMembersForEvent(
      currentEventId.value
    );

    // Try to get all users first
    try {
      const allUsers = await api.auth.getAllUsers(authStore.user.id);

      // Get verified readers and match with allUsers for email
      const verifiedReaders = allMembers.filter((m) => m.verified);
      approvedReaders.value = verifiedReaders.map((member) => {
        const user = allUsers.find((u) => u._id === member.user);
        return {
          id: member.user,
          name: member.name,
          email: user?.email || "",
        };
      });

      const memberUserIds = new Set(allMembers.map((m) => m.user));

      // Get unverified users:
      // 1. Users who are not members at all, OR
      // 2. Users who are members but verified: false
      const unverifiedMembers = allMembers.filter((m) => !m.verified);
      const nonMemberUserIds = allUsers
        .filter((user) => !memberUserIds.has(user._id))
        .map((user) => user._id);

      unverifiedUsers.value = [
        ...unverifiedMembers.map((member) => {
          const user = allUsers.find((u) => u._id === member.user);
          return {
            id: member.user,
            name: member.name,
            email: user?.email || member.user,
          };
        }),
        ...allUsers
          .filter((user) => nonMemberUserIds.includes(user._id))
          .map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
          })),
      ];
    } catch (err) {
      console.error(
        "Could not get all users, falling back to members only:",
        err
      );
      // Fallback: just show unverified members
      const unverifiedReaders = allMembers.filter((m) => !m.verified);
      unverifiedUsers.value = unverifiedReaders.map((member) => ({
        id: member.user,
        name: member.name,
        email: "",
      }));
    }
  } catch (err) {
    console.error("Failed to load readers:", err);
  }
};

const filteredUnverifiedUsers = computed(() => {
  if (!unverifiedSearchTerm.value) return unverifiedUsers.value;

  const search = unverifiedSearchTerm.value.toLowerCase();
  return unverifiedUsers.value.filter(
    (user) =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
  );
});

const isValidSettings = computed(() => {
  return (
    requiredReadsPerApp.value > 0 &&
    Number.isInteger(requiredReadsPerApp.value) &&
    eventEndDate.value !== ""
  );
});

const addEligibilityCriterion = () => {
  eligibilityCriteria.value.push("");
};

const removeCriterion = (index: number) => {
  eligibilityCriteria.value.splice(index, 1);
};

const saveEligibilityCriteria = async () => {
  if (!currentEventId.value || !authStore.user) return;

  savingCriteria.value = true;
  try {
    await api.eventDirectory.updateEventConfig(
      authStore.user.id,
      currentEventId.value,
      undefined, // requiredReadsPerApp
      undefined, // rubric
      eligibilityCriteria.value
    );
    alert("✅ Eligibility criteria saved successfully!");
  } catch (err) {
    console.error("Failed to save eligibility criteria:", err);
    alert("Failed to save eligibility criteria. Please try again.");
  } finally {
    savingCriteria.value = false;
  }
};

const getQuestionForIndex = (index: number): string => {
  if (!eventQuestions.value || !eventQuestions.value[index]) {
    return `Question ${index + 1}`;
  }
  return eventQuestions.value[index];
};

const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

// New functions for reviews and scoring
const viewFlaggedApplication = async (applicationId: string) => {
  console.log("Viewing flagged application:", applicationId);
  applicantReviews.value = [];
  searchedApplication.value = null;

  try {
    // Find the application in flagged applications first, then disqualified
    let app = flaggedApplications.value.find((a) => a._id === applicationId);

    if (!app) {
      app = disqualifiedApplications.value.find((a) => a._id === applicationId);
    }

    if (!app) {
      alert(
        "Application not found in flagged or disqualified applications list."
      );
      return;
    }

    console.log("Found flagged application:", app);
    searchedApplication.value = app;

    // Load reviews for this application
    const reviews = await api.reviewRecords.getReviewsWithScoresByApplication(
      applicationId
    );

    console.log("Reviews for flagged application:", reviews);

    // Get reviewer names for each review
    const reviewsWithDetails = reviews.map((review) => {
      return {
        ...review,
        reviewerName: review.reviewerName || "Unknown Reviewer",
      };
    });

    applicantReviews.value = reviewsWithDetails;
    console.log("Reviews with details:", applicantReviews.value);

    // Skip weighted averages calculation for flagged applications
    // since we're just viewing reviews, not calculating overall scores
  } catch (err) {
    console.error("Failed to load flagged application details:", err);
    alert("Failed to load application details. Please try again.");
  }
};

const searchApplicant = async () => {
  if (!searchApplicantID.value.trim()) return;

  console.log("Searching for applicant:", searchApplicantID.value);
  applicantReviews.value = [];
  searchedApplication.value = null;

  try {
    let searchId = searchApplicantID.value.trim();

    // Try to find the application by applicantID in the loaded list
    const app = allApplications.value.find((a) => a.applicantID === searchId);

    console.log("Found app in allApplications:", app);

    // If found in preloaded list, use that application ID
    // Otherwise, assume the user entered an application ID directly
    const appIdToUse = app ? app._id : searchId;

    console.log("Using app ID:", appIdToUse);

    // Fetch the application details
    try {
      const appData = await api.applicationStorage.getApplication(appIdToUse);
      console.log("App data from API:", appData);

      // Handle both array and object responses
      let app;
      if (Array.isArray(appData)) {
        if (appData.length === 0) {
          alert(
            "❌ This is not a valid application ID. Please check the ID and try again."
          );
          return;
        }
        app = appData[0];
      } else {
        app = appData;
      }

      if (!app) {
        alert(
          "❌ This is not a valid application ID. Please check the ID and try again."
        );
        return;
      }

      searchedApplication.value = app;
      console.log("Set searchedApplication to:", searchedApplication.value);
    } catch (err) {
      console.error("Error fetching application:", err);
      alert(
        "❌ This is not a valid application ID. Please check the ID and try again."
      );
      return;
    }

    // Get reviews for this application with author names/emails
    const reviews = await api.reviewRecords.getReviewsWithScoresByApplication(
      appIdToUse
    );
    console.log("Reviews from API:", reviews);

    // Get all users to look up author names/emails
    let allUsers: Array<{ _id: string; name: string; email: string }> = [];
    try {
      if (authStore.user?.id) {
        allUsers = await api.auth.getAllUsers(authStore.user.id);
        console.log("All users for lookup:", allUsers);
      }
    } catch (err) {
      console.warn("Could not get all users for lookup:", err);
    }

    // Fetch author details for each review
    const reviewsWithDetails = reviews.map((review) => {
      const authorInfo = allUsers.find((u) => u._id === review.author);
      return {
        ...review,
        authorName: authorInfo?.name || review.author,
        authorEmail: authorInfo?.email || "unknown",
      };
    });

    applicantReviews.value = reviewsWithDetails;
    console.log("Final applicantReviews:", applicantReviews.value);
  } catch (err) {
    console.error("Failed to search applicant:", err);
    alert("Failed to search for applicant. Please try again.");
    applicantReviews.value = [];
    searchedApplication.value = null;
  }
};

const calculateWeightedAverages = async () => {
  if (!currentEventId.value) return;

  // Normalize weights to prevent issues with missing criteria
  const totalWeight = Object.values(weights.value).reduce(
    (sum, w) => sum + (w || 0),
    0
  );
  const normalizedWeights: Record<string, number> = {};

  // Only include weights with non-zero values
  Object.keys(weights.value).forEach((criterion) => {
    if (weights.value[criterion] && weights.value[criterion] > 0) {
      normalizedWeights[criterion] =
        totalWeight > 0
          ? weights.value[criterion] / totalWeight
          : weights.value[criterion];
    }
  });

  if (Object.keys(normalizedWeights).length === 0) {
    alert("Please set at least one criterion weight.");
    return;
  }

  try {
    const averages = await api.reviewRecords.calculateWeightedAverages(
      normalizedWeights
    );

    // Map application IDs to applicant IDs
    const averagesWithApplicantID = await Promise.all(
      averages.map(async (avg) => {
        try {
          const appData = await api.applicationStorage.getApplication(
            avg.application
          );
          if (appData) {
            const app = Array.isArray(appData) ? appData[0] : appData;
            return {
              applicantID: app.applicantID,
              weightedAverage: avg.weightedAverage,
              numReviews: avg.numReviews,
            };
          }
          return null;
        } catch (err) {
          console.error("Failed to get application data:", err);
          return null;
        }
      })
    );

    weightedAverages.value = averagesWithApplicantID.filter(
      (a) => a !== null
    ) as Array<{
      applicantID: string;
      weightedAverage: number;
      numReviews: number;
    }>;

    weightedAverages.value.sort(
      (a, b) => b.weightedAverage - a.weightedAverage
    );
  } catch (err) {
    console.error("Failed to calculate weighted averages:", err);
    alert("Failed to calculate averages. Please check your weights.");
  }
};

const exportToCSV = () => {
  if (weightedAverages.value.length === 0) return;

  const headers = ["Applicant ID", "Weighted Average", "Number of Reviews"];
  const rows = weightedAverages.value.map((avg) => [
    avg.applicantID,
    avg.weightedAverage.toFixed(2),
    avg.numReviews.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.value}_weighted_averages.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// CSV Import functions
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  selectedFile.value = file;
  importSuccess.value = false;
  importErrors.value = [];

  try {
    const text = await file.text();
    const parsed = parseCSV(text);
    parsedData.value = parsed;
  } catch (err) {
    console.error("Failed to parse CSV:", err);
    alert("Failed to parse CSV file. Please check the format and try again.");
  }
};

const parseCSV = (
  csvText: string
): Array<{
  applicantID: string;
  applicantYear: string;
  answers: string[];
}> => {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const dataLines = lines.slice(1);

  // Validate headers
  if (!headers.includes("applicantID")) {
    throw new Error("CSV must have an 'applicantID' column");
  }
  if (!headers.includes("applicantYear")) {
    throw new Error("CSV must have an 'applicantYear' column");
  }

  // Find question columns (Q1, Q2, Q3, etc.)
  const questionColumns = headers.filter((h) => h.match(/^Q\d+$/)).sort();
  const expectedQuestions = eventQuestions.value.length;

  if (questionColumns.length !== expectedQuestions) {
    throw new Error(
      `Expected ${expectedQuestions} question columns (Q1, Q2, ...) but found ${questionColumns.length}`
    );
  }

  const parsed: Array<{
    applicantID: string;
    applicantYear: string;
    answers: string[];
  }> = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const values = parseCSVLine(line);

    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 2} has ${values.length} columns but header has ${
          headers.length
        } columns`
      );
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    // Validate required fields
    if (!row.applicantID || !row.applicantYear) {
      throw new Error(
        `Row ${i + 2} is missing required fields (applicantID or applicantYear)`
      );
    }

    // Extract answers in order
    const answers = questionColumns.map((q) => row[q] || "");

    parsed.push({
      applicantID: row.applicantID,
      applicantYear: row.applicantYear,
      answers: answers,
    });
  }

  return parsed;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
};

const clearImport = () => {
  selectedFile.value = null;
  parsedData.value = [];
  importErrors.value = [];
  importSuccess.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const confirmImport = async () => {
  if (
    !currentEventId.value ||
    !authStore.user ||
    parsedData.value.length === 0
  ) {
    return;
  }

  isImporting.value = true;
  importSuccess.value = false;
  importErrors.value = [];

  try {
    const result = await api.applications.bulkImportApplications(
      currentEventId.value,
      parsedData.value,
      authStore.user.id
    );

    importStats.value = {
      importedCount: result.importedCount,
      errors: result.errors,
    };

    if (result.errors.length > 0) {
      importErrors.value = result.errors;
    }

    importSuccess.value = true;

    // Clear the import data after successful import
    setTimeout(() => {
      clearImport();
    }, 3000);
  } catch (err) {
    console.error("Failed to import applications:", err);
    alert("Failed to import applications. Please try again.");
  } finally {
    isImporting.value = false;
  }
};

// Flagged Applications functions
const loadFlaggedApplications = async () => {
  if (!currentEventId.value || !authStore.user) return;

  try {
    const flagged = await api.applicationStorage.getFlaggedApplications(
      currentEventId.value
    );
    console.log("Flagged applications response:", flagged);
    console.log("Number of flagged applications:", flagged.length);

    // Fetch user names for flagged applications
    const flaggedWithNames = await Promise.all(
      flagged.map(async (app) => {
        try {
          const userName = await api.auth.getNameByUserId(app.flaggedBy);
          return {
            ...app,
            flaggedByName: userName || "Unknown User",
            disqualified: false, // Default to not disqualified
            flagReason: app.flagReason || "No reason provided",
          };
        } catch (err) {
          console.error(
            "Failed to get user name for flaggedBy:",
            app.flaggedBy
          );
          return {
            ...app,
            flaggedByName: "Unknown User",
            disqualified: false,
            flagReason: app.flagReason || "No reason provided",
          };
        }
      })
    );

    // Don't set flaggedApplications.value here - we'll filter it later

    // Also load disqualified applications
    const disqualified =
      await api.applicationStorage.getDisqualifiedApplications(
        currentEventId.value
      );
    console.log("Disqualified applications response:", disqualified);

    // Fetch user names for disqualified applications
    const disqualifiedWithNames = await Promise.all(
      disqualified.map(async (app) => {
        try {
          const userName = await api.auth.getNameByUserId(app.disqualifiedBy);
          return {
            ...app,
            disqualifiedByName: userName || "Unknown User",
            disqualificationReason:
              app.disqualificationReason || "No reason provided",
          };
        } catch (err) {
          console.error(
            "Failed to get user name for disqualifiedBy:",
            app.disqualifiedBy
          );
          return {
            ...app,
            disqualifiedByName: "Unknown User",
            disqualificationReason:
              app.disqualificationReason || "No reason provided",
          };
        }
      })
    );

    disqualifiedApplications.value = disqualifiedWithNames;

    // Filter out flagged applications that are also disqualified
    const disqualifiedIds = new Set(
      disqualifiedWithNames.map((app) => app._id)
    );
    const filteredFlagged = flaggedWithNames.filter(
      (app) => !disqualifiedIds.has(app._id)
    );

    console.log(
      "Filtered flagged applications (excluding disqualified):",
      filteredFlagged.length
    );
    flaggedApplications.value = filteredFlagged;
    flaggedApplicationsLoaded.value = true;
  } catch (err) {
    console.error("Failed to load flagged applications:", err);
    alert("Failed to load flagged applications. Please try again.");
  }
};

const showDisqualifyModal = (application: any) => {
  disqualifyModal.value = {
    show: true,
    application: application,
  };
  disqualificationReason.value = "";
};

const closeDisqualifyModal = () => {
  disqualifyModal.value = {
    show: false,
    application: null,
  };
  disqualificationReason.value = "";
};

const undisqualifyApplication = async (applicationId: string) => {
  if (!authStore.user) return;

  const confirmed = confirm(
    "Are you sure you want to un-disqualify this application? It will return to the flagged applications list."
  );
  if (!confirmed) return;

  try {
    await api.applicationStorage.undisqualifyApplication(
      applicationId,
      authStore.user.id,
      "Un-disqualified by admin"
    );

    // Reload both tables to update the UI
    await loadFlaggedApplications();

    alert("Application un-disqualified successfully!");
  } catch (err) {
    console.error("Failed to un-disqualify application:", err);
    alert("Failed to un-disqualify application. Please try again.");
  }
};

const confirmDisqualify = async () => {
  if (!disqualifyModal.value.application || !authStore.user) return;

  try {
    await api.applicationStorage.disqualifyApplication(
      disqualifyModal.value.application._id,
      disqualificationReason.value,
      authStore.user.id
    );

    // Reload flagged applications to update the UI
    console.log("Disqualifying application, refreshing tables...");
    await loadFlaggedApplications();

    // Force a small delay to ensure backend has processed the change
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Reload again to make sure we have the latest data
    await loadFlaggedApplications();

    closeDisqualifyModal();
    alert("Application disqualified successfully!");
  } catch (err) {
    console.error("Failed to disqualify application:", err);
    alert("Failed to disqualify application. Please try again.");
  }
};

const removeApplicationFlag = async (applicationId: string) => {
  if (!authStore.user) return;

  if (
    !confirm("Are you sure you want to remove the flag from this application?")
  ) {
    return;
  }

  try {
    await api.applicationStorage.removeFlag(applicationId, authStore.user.id);

    // Reload flagged applications to update the UI
    await loadFlaggedApplications();

    alert("Flag removed successfully!");
  } catch (err) {
    console.error("Failed to remove flag:", err);
    alert("Failed to remove flag. Please try again.");
  }
};

const exportDisqualifiedCSV = () => {
  if (disqualifiedApplications.value.length === 0) return;

  const headers = [
    "Applicant ID",
    "Disqualification Reason",
    "Disqualified By",
    "Disqualified At",
  ];
  const rows = disqualifiedApplications.value.map((app) => [
    app.applicantID,
    app.disqualificationReason,
    app.disqualifiedBy,
    formatDate(app.disqualifiedAt),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.value}_disqualified_applications.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const formatDate = (dateString: string): string => {
  return (
    new Date(dateString).toLocaleDateString() +
    " " +
    new Date(dateString).toLocaleTimeString()
  );
};

const loadEventData = async () => {
  try {
    const eventId = route.params.id as string;
    currentEventId.value = eventId;

    const eventData = await api.eventDirectory.getEventById(eventId);
    const event = Array.isArray(eventData) ? eventData[0] : eventData;
    console.log("Event data received:", event);
    console.log("Event endDate:", event?.endDate);
    console.log("Event requiredReadsPerApp:", event?.requiredReadsPerApp);

    if (event) {
      eventName.value = event.name;

      // Format endDate for datetime-local input (YYYY-MM-DDTHH:MM)
      if (event.endDate) {
        const date = new Date(event.endDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        eventEndDate.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log("Formatted endDate for input:", eventEndDate.value);
      } else {
        eventEndDate.value = "";
      }

      requiredReadsPerApp.value = event.requiredReadsPerApp || 3;
      console.log("Set eventEndDate to:", eventEndDate.value);
      console.log("Set requiredReadsPerApp to:", requiredReadsPerApp.value);
      currentEventRubric.value = event.rubric || [];
      eventQuestions.value = event.questions || [];

      // Load rubric into display rubric
      rubric.value = (event.rubric || []).map(
        (criterion: any, idx: number) => ({
          id: idx.toString(),
          name: criterion.name || "",
          description: criterion.description || "",
          scaleMin: criterion.scaleMin || 1,
          scaleMax: criterion.scaleMax || 5,
          guidelines: criterion.guidelines || [],
        })
      );

      // Load eligibility criteria
      eligibilityCriteria.value = event.eligibilityCriteria || [];

      // Initialize weights with 0 for each criterion
      weights.value = {};
      currentEventRubric.value.forEach((criterion) => {
        weights.value[criterion.name] = 0;
      });

      // Load all applications for this event (may not be available)
      try {
        const apps = await api.applicationStorage.getApplicationsByEvent(
          eventId
        );
        allApplications.value = apps;
      } catch (err) {
        console.warn("Could not load all applications:", err);
        allApplications.value = [];
      }

      // Load readers
      await loadReaders();
    }
  } catch (err) {
    console.error("Failed to load event data:", err);
  }
};

const saveEventSettings = async () => {
  if (!currentEventId.value || !authStore.user) return;

  try {
    savingSettings.value = true;

    // Update the event with new settings
    await api.eventDirectory.updateEvent(currentEventId.value, {
      endDate: eventEndDate.value,
      requiredReadsPerApp: requiredReadsPerApp.value,
    });

    alert("Event settings saved successfully!");
  } catch (err) {
    console.error("Failed to save event settings:", err);
    alert("Failed to save event settings. Please try again.");
  } finally {
    savingSettings.value = false;
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!authStore.isAdmin) {
    router.push("/");
  } else {
    await loadEventData();
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
  column-count: 2;
  column-gap: 2rem;
  column-fill: balance;
  column-rule: none;
  padding-top: 0;
}

.config-section,
.reviews-section,
.csv-import-section,
.flagged-applications-section,
.eligibility-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-light);
  height: fit-content;
  break-inside: avoid;
  display: inline-block;
  width: 100%;
  vertical-align: top;
  margin-top: 0;
}

.config-section:first-child,
.reviews-section:first-child,
.csv-import-section:first-child,
.flagged-applications-section:first-child,
.eligibility-section:first-child {
  margin-top: 0;
}

.config-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  text-align: left;
  border-bottom: 2px solid var(--accent-primary);
  padding-bottom: 0.5rem;
}

/* Event Settings Styling */
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid var(--accent-primary);
  display: inline-block;
}

.input-wrapper {
  position: relative;
}

.styled-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.styled-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
  background: var(--bg-primary);
}

.styled-input:hover {
  border-color: var(--accent-primary);
  background: var(--bg-primary);
}

.setting-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
  font-style: italic;
  padding-left: 0.5rem;
}

.settings-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.validation-message {
  color: var(--error-color, #e74c3c);
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.user-count {
  padding: 0.75rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
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

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  color: var(--text-primary);
  font-weight: 500;
}

.user-email {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 400;
}

.empty-state {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
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

.criterion-name-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
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

.user-count {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
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
  background: #7aa94c;
}

.btn-remove {
  background: var(--accent-danger);
  color: white;
}

.btn-remove:hover {
  background: #ff5432;
}

.criterion-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-save {
  background: var(--accent-primary);
  color: white;
}

.btn-save:hover {
  background: var(--accent-secondary);
}

.btn-delete {
  background: var(--accent-danger);
  color: white;
}

.btn-delete:hover {
  background: #ff5432;
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

.eligibility-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
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
  background: #ff5432;
}

/* Reviews & Scoring Section */
.reviews-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  border: 1px solid var(--border-light);
}

.reviews-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 1rem;
}

/* Modal Styles */
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-secondary);
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.modal-content h4 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.detail-section p {
  margin: 0.5rem 0;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.qa-item {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.question-text {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.answer-text {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.review-item-detailed {
  background: white;
  border: 1px solid #ddd;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.reviewer-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.review-author {
  display: block;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.review-email {
  display: block;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.review-date {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.review-scores {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.score-item-detailed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.score-item-detailed .criterion-name {
  font-weight: 500;
}

.review-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.review-time {
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
}

.criterion-name {
  font-weight: 500;
}

.score-value {
  color: var(--primary-color);
  font-weight: 600;
}

.search-applicant-section,
.weighted-averages-section {
  margin-bottom: 2rem;
}

.search-applicant-section h3,
.weighted-averages-section h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: stretch;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.btn-search {
  background: var(--accent-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
  align-self: stretch;
}

.btn-search:hover {
  background: var(--accent-secondary);
}

.applicant-reviews h4 {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 1rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-light);
}

.review-author {
  color: var(--text-primary);
  font-weight: 600;
}

.review-date {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.review-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.score-item {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-primary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}

.criterion-name {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.score-value {
  color: var(--text-primary);
  font-weight: 600;
}

.weights-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.weight-input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.weight-input-group label {
  color: var(--text-primary);
  font-weight: 500;
  min-width: 150px;
}

.weight-input {
  flex: 1;
  max-width: 150px;
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  text-align: center;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.weight-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.export-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: 0.75rem 2rem;
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.btn-export {
  background: var(--accent-success);
  color: white;
  padding: 0.75rem 2rem;
}

.btn-export:hover:not(:disabled) {
  background: #7aa94c;
}

.btn-export:disabled {
  background: var(--border-medium);
  cursor: not-allowed;
}

.results-container {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  max-height: 400px;
  overflow-y: auto;
}

.results-container h4 {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 1rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}

.result-app {
  color: var(--text-primary);
  font-weight: 600;
}

.result-score {
  color: var(--accent-primary);
  font-weight: 700;
  font-size: 1.1rem;
}

.result-reviews {
  color: var(--text-secondary);
  font-size: 0.9rem;
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

  .search-box {
    flex-direction: column;
  }

  .export-buttons {
    flex-direction: column;
  }

  .weight-input-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .weight-input-group label {
    min-width: auto;
  }

  .weight-input {
    width: 100%;
    max-width: 100%;
  }
}

/* CSV Import Section */
.csv-import-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  border: 1px solid var(--border-light);
}

.csv-import-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 1rem;
}

.import-instructions {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  margin-bottom: 2rem;
}

.import-instructions h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.import-instructions ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.import-instructions li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.import-instructions p {
  color: var(--text-secondary);
  margin: 0.5rem 0;
}

.import-controls {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.file-upload-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-file {
  color: var(--text-secondary);
  font-style: italic;
}

.import-preview {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.import-preview h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.preview-table {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  overflow: hidden;
  margin-bottom: 1rem;
}

.preview-table .table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-medium);
}

.preview-table .table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  align-items: center;
}

.preview-table .table-row:hover {
  background: var(--bg-tertiary);
}

.more-apps {
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  background: var(--bg-tertiary);
}

.import-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-success {
  background: var(--accent-success);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #7aa94c;
}

.btn-success:disabled {
  background: var(--border-medium);
  cursor: not-allowed;
}

.import-errors {
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.import-errors h3 {
  color: #dc2626;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-item {
  color: #dc2626;
  font-size: 0.9rem;
}

.import-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  padding: 1.5rem;
}

.import-success h3 {
  color: #16a34a;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.import-success p {
  color: #16a34a;
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .file-upload-area {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-table .table-header,
  .preview-table .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .import-actions {
    flex-direction: column;
  }
}

/* Flagged Applications Section */
.flagged-applications-section {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  border: 1px solid var(--border-light);
}

.flagged-applications-section h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 1rem;
}

.flagged-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.flagged-table-container,
.disqualified-table-container {
  margin-bottom: 2rem;
}

.flagged-table-container h3,
.disqualified-table-container h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.flagged-table,
.disqualified-table {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.flagged-table .table-header,
.disqualified-table .table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-medium);
}

.flagged-table .table-header {
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.disqualified-table .table-header {
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
}

.flagged-table .table-row,
.disqualified-table .table-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  align-items: center;
}

.disqualified-table .table-row {
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
}

.flagged-table .applicant-id,
.flagged-table .flagged-by,
.disqualified-table .applicant-id,
.disqualified-table .disqualification-reason,
.disqualified-table .disqualified-by {
  text-align: left;
}

.flagged-table .actions,
.disqualified-table .actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-start;
}

.flagged-table .table-row:hover,
.disqualified-table .table-row:hover {
  background: var(--bg-tertiary);
}

.flagged-table .actions,
.disqualified-table .actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn-danger {
  background: var(--accent-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff5432;
}

.btn-danger:disabled {
  background: var(--border-medium);
  cursor: not-allowed;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-warning:disabled {
  background: var(--border-medium);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border-medium);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--border-dark);
}

.modal-section {
  margin-bottom: 1.5rem;
}

.modal-section label {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.reason-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.reason-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .flagged-actions {
    flex-direction: column;
  }

  .flagged-table .table-header,
  .flagged-table .table-row,
  .disqualified-table .table-header,
  .disqualified-table .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .flagged-table .actions,
  .disqualified-table .actions {
    flex-direction: column;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
