<template>
  <div class="read-page">
    <div class="read-header">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="progress-text">{{ currentReads }}/{{ requiredReads }}</div>

      <div class="header-actions">
        <button class="btn btn-flag" title="Flag suspicious or ineligible">
          🚩
        </button>
        <button class="btn btn-skip" @click="skipApplication">SKIP →</button>
        <button class="btn btn-refresh" title="Refresh">↻</button>
      </div>
    </div>

    <div v-if="applicationsStore.isLoading" class="loading">
      <p>Loading application...</p>
    </div>

    <div v-else-if="applicationsStore.error" class="error">
      <p>{{ applicationsStore.error }}</p>
      <button @click="loadApplicationData" class="btn btn-primary">
        Retry
      </button>
    </div>

    <div
      v-else-if="!applicationsStore.currentApplication"
      class="no-application"
    >
      <p v-if="applicationsStore.applications.length === 0">
        No applications available to read.
      </p>
      <p v-else>Loading application...</p>
      <p>
        All applications have been reviewed or there are no applications for
        this event.
      </p>
    </div>

    <div v-else class="read-content">
      <div class="scoring-panel">
        <h3>Scoring</h3>
        <div
          class="criterion"
          v-for="criterion in rubricDimensions"
          :key="criterion.id"
        >
          <div class="criterion-header">
            <span class="criterion-name">{{ criterion.name }}</span>
            <button
              class="btn btn-info"
              @click="showRubric = criterion.id"
              title="Hover to reveal rubric table"
            >
              [?]
            </button>
          </div>
          <div class="slider-container">
            <input
              type="range"
              :min="criterion.scaleMin"
              :max="criterion.scaleMax"
              v-model="scores[criterion.id]"
              class="slider"
            />
            <div class="slider-labels">
              <span v-for="i in criterion.scaleMax" :key="i">{{ i }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="application-content">
        <div class="application-header">
          <h2>
            APPLICANT:
            {{ applicationsStore.currentApplication?.applicantID }} ({{
              applicationsStore.currentApplication?.applicantYear
            }})
          </h2>
        </div>

        <div class="questions">
          <div
            class="question"
            v-for="(answer, index) in applicationsStore.currentApplication
              ?.answers"
            :key="index"
          >
            <h3>Q{{ index + 1 }}) {{ getQuestionForIndex(index) }}</h3>
            <p class="question-prompt">Applicant's Response:</p>
            <div
              class="answer"
              ref="answerDiv"
              @mouseup="handleTextSelection"
              @mouseover="handleAIHighlightHover"
              @mouseleave="handleAIHighlightLeave"
              @click="handleAnswerClick"
            ></div>
          </div>
        </div>
      </div>

      <div class="comments-panel">
        <h3>User Comments</h3>
        <div class="comment" v-for="comment in userComments" :key="comment.id">
          <div class="comment-header">
            <span class="comment-author">{{ comment.author }}</span>
            <span class="comment-time">{{
              formatTime(comment.timestamp)
            }}</span>
          </div>
          <div class="comment-text">{{ comment.text }}</div>
          <div v-if="comment.quotedSnippet" class="quoted-snippet">
            "{{ comment.quotedSnippet }}"
          </div>
        </div>

        <div v-if="userComments.length === 0" class="no-comments">
          <p>No user comments yet. Select text to add a comment.</p>
        </div>
      </div>
    </div>

    <!-- Floating AI Comment Tooltip -->
    <div v-if="hoveredAIComment" class="ai-tooltip" :style="tooltipPosition">
      <div class="ai-tooltip-content">
        <div class="ai-tooltip-header">
          <span
            class="ai-category"
            :class="getCommentCategoryClass(hoveredAIComment.category)"
          >
            {{ hoveredAIComment.category }}
          </span>
        </div>
        <div class="ai-tooltip-text">{{ hoveredAIComment.justification }}</div>
      </div>
    </div>

    <!-- Text Selection Comment Dialog -->
    <div
      v-if="showCommentDialog"
      class="comment-dialog"
      :style="commentDialogPosition"
    >
      <div class="comment-dialog-content">
        <h4>Add Comment</h4>
        <p class="selected-text">"{{ selectedText }}"</p>
        <textarea
          v-model="newComment"
          placeholder="Write your comment..."
          class="comment-textarea"
        ></textarea>
        <div class="comment-dialog-actions">
          <button @click="cancelComment" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="submitComment" class="btn btn-primary">
            Add Comment
          </button>
        </div>
      </div>
    </div>

    <div class="read-actions">
      <button @click="submitReview" class="btn btn-primary btn-large">
        SUBMIT
      </button>
    </div>

    <!-- Rubric Popup -->
    <div v-if="showRubric" class="rubric-popup" @click="showRubric = null">
      <div class="rubric-content" @click.stop>
        <div class="rubric-header">
          <h3>Rubric Guidelines</h3>
          <button @click="showRubric = null" class="btn btn-close">×</button>
        </div>
        <div class="rubric-table">
          <div class="rubric-row" v-for="i in 5" :key="i">
            <span class="rubric-score">{{ i }}</span>
            <span class="rubric-description">{{
              getRubricDescription(i)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Previous Reads Dropdown -->
    <div class="previous-reads">
      <select @change="loadPreviousRead" class="previous-select">
        <option value="">Previous reads...</option>
        <option v-for="read in previousReads" :key="read.id" :value="read.id">
          {{ formatTime(read.timestamp) }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useApplicationsStore } from "@/stores/applications";

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const applicationsStore = useApplicationsStore();

// Real data from API
const currentReads = ref(0);
const requiredReads = ref(0);
const rubricDimensions = ref([]);
const scores = ref({});
const userComments = ref([]);
const newComment = ref("");
const showRubric = ref<string | null>(null);
const previousReads = ref([]);

// AI Comment highlighting and tooltips
const hoveredAIComment = ref(null);
const tooltipPosition = ref({ top: "0px", left: "0px" });

// Text selection for user comments
const showCommentDialog = ref(false);
const selectedText = ref("");
const commentDialogPosition = ref({ top: "0px", left: "0px" });

const progressPercentage = computed(() => {
  if (requiredReads.value === 0) return 0;
  return (currentReads.value / requiredReads.value) * 100;
});

// Load real data from API
const loadApplicationData = async () => {
  if (!eventsStore.currentEvent) return;

  try {
    // Load rubric from current event
    rubricDimensions.value = eventsStore.currentEvent.rubric || [];

    // Initialize scores
    scores.value = {};
    rubricDimensions.value.forEach((criterion) => {
      scores.value[criterion.name] = criterion.scaleMin;
    });

    // Load required reads from current event
    requiredReads.value = eventsStore.currentEvent.requiredReadsPerApp || 0;

    // Debug: Log event data to see what we have
    console.log("=== LOADING APPLICATION DATA ===");
    console.log("Current event data:", eventsStore.currentEvent);
    console.log("Event questions:", eventsStore.currentEvent.questions);
    console.log(
      "Questions length:",
      eventsStore.currentEvent.questions?.length
    );
    console.log("Event name:", eventsStore.currentEvent.name);
    console.log(
      "Full event object:",
      JSON.stringify(eventsStore.currentEvent, null, 2)
    );

    // Load applications for this event
    await applicationsStore.loadApplicationsForEvent(
      eventsStore.currentEvent._id
    );

    // Load the first application if available
    console.log("Applications loaded:", applicationsStore.applications.length);
    if (applicationsStore.applications.length > 0) {
      const firstApp = applicationsStore.applications[0];
      console.log("Loading first application:", firstApp);
      await applicationsStore.loadApplication(firstApp._id);
      console.log("Current application:", applicationsStore.currentApplication);
      console.log(
        "Application answers:",
        applicationsStore.currentApplication?.answers
      );

      // Set innerHTML directly for each answer
      setTimeout(() => {
        const answerDivs = document.querySelectorAll(".answer");
        if (applicationsStore.currentApplication?.answers) {
          applicationsStore.currentApplication.answers.forEach(
            (answer, index) => {
              if (answerDivs[index]) {
                const highlightedHTML = formatAnswerWithHighlights(
                  answer,
                  index
                );
                console.log(
                  `Setting innerHTML for answer ${index}:`,
                  highlightedHTML
                );
                answerDivs[index].innerHTML = highlightedHTML;
              }
            }
          );
        }
      }, 100);
    } else {
      console.log("No applications found!");
    }

    // TODO: Load current reads count from API
    // const stats = await api.readerStats.getReaderStats();
    // currentReads.value = stats.readCount;
  } catch (err) {
    console.error("Error loading application data:", err);
  }
};

const formatAnswer = (answer: string) => {
  // Highlight quoted snippets that have comments
  return answer.replace(/I won 100 hackathons in 1 month/g, "<mark>$&</mark>");
};

const formatAnswerWithHighlights = (answer: string, answerIndex: number) => {
  // Only highlight snippets from currentApplicationComments
  let highlightedAnswer = answer;

  if (
    applicationsStore.currentApplicationComments &&
    applicationsStore.currentApplicationComments.length > 0
  ) {
    applicationsStore.currentApplicationComments.forEach((comment) => {
      const snippet = comment.quotedSnippet;
      if (snippet && highlightedAnswer.includes(snippet)) {
        const highlightClass = getCommentCategoryClass(comment.category);
        // Add data attributes for id, category, and justification
        const highlightedSnippet = `<span class="ai-highlight ${highlightClass}" data-comment-id="${
          comment._id
        }" data-comment-category="${
          comment.category
        }" data-comment-justification="${encodeURIComponent(
          comment.justification
        )}">${snippet}</span>`;
        highlightedAnswer = highlightedAnswer.replace(
          snippet,
          highlightedSnippet
        );
      }
    });
  }

  return highlightedAnswer;
};

const getQuestionForIndex = (index: number) => {
  console.log("=== GET QUESTION FOR INDEX ===");
  console.log("Index:", index);
  console.log("Current event:", eventsStore.currentEvent);
  console.log("Event questions:", eventsStore.currentEvent?.questions);

  if (
    !eventsStore.currentEvent?.questions ||
    !eventsStore.currentEvent.questions.length
  ) {
    console.log("No questions available, using fallback");
    return `Question ${index + 1}`;
  }

  // The questions array should be in the same order as the answers array
  const question = eventsStore.currentEvent.questions[index];
  console.log("Question at index", index, ":", question);
  return question || `Question ${index + 1}`;
};

const getCommentCategoryClass = (category: string) => {
  switch (category) {
    case "Strong":
      return "comment-strong";
    case "Weak":
      return "comment-weak";
    case "Attention":
      return "comment-attention";
    default:
      return "comment-default";
  }
};

// Handle text selection for user comments
const handleTextSelection = (event: MouseEvent) => {
  const selection = window.getSelection();
  const selectedTextContent = selection?.toString().trim();

  console.log("Text selection triggered:", selectedTextContent);

  if (selectedTextContent && selectedTextContent.length > 0) {
    const range = selection?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      selectedText.value = selectedTextContent;
      commentDialogPosition.value = {
        top: `${rect.top + window.scrollY - 10}px`,
        left: `${rect.left + window.scrollX}px`,
      };
      showCommentDialog.value = true;
      console.log("Comment dialog should show now");
    }
  }
};

// --- AI Highlight Tooltip Hover Logic with Delay ---
let currentHoveredSpan: HTMLElement | null = null;
let hideTooltipTimeout: number | null = null;

// Helper to clear tooltip hide timer
function clearTooltipTimer() {
  if (hideTooltipTimeout !== null) {
    clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = null;
  }
}

// Handle AI comment hover and tooltip positioning (for future use)
const handleAICommentHover = (
  event: MouseEvent,
  comment: any,
  target: HTMLElement
) => {
  clearTooltipTimer();
  hoveredAIComment.value = comment;
  // Position tooltip below the highlighted span
  const rect = target.getBoundingClientRect();
  tooltipPosition.value = {
    top: `${rect.bottom + window.scrollY + 6}px`,
    left: `${rect.left + window.scrollX}px`,
  };
};

const handleAICommentLeave = () => {
  // Hide after delay
  clearTooltipTimer();
  hideTooltipTimeout = window.setTimeout(() => {
    hoveredAIComment.value = null;
    currentHoveredSpan = null;
    hideTooltipTimeout = null;
  }, 500);
};

// Handle AI highlight hover
const handleAIHighlightHover = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.classList.contains("ai-highlight")) return;

  clearTooltipTimer();
  currentHoveredSpan = target;
  const commentId = target.getAttribute("data-comment-id");
  const comment = applicationsStore.currentApplicationComments.find(
    (c) => c._id === commentId
  );
  if (comment) {
    hoveredAIComment.value = comment;
    const rect = target.getBoundingClientRect();
    tooltipPosition.value = {
      top: `${rect.bottom + window.scrollY + 6}px`,
      left: `${rect.left + window.scrollX}px`,
    };
  }
};

const handleAIHighlightLeave = (event: MouseEvent) => {
  // Always start a short timeout to hide the tooltip, but can be canceled if hover returns
  clearTooltipTimer();
  hideTooltipTimeout = window.setTimeout(() => {
    hoveredAIComment.value = null;
    currentHoveredSpan = null;
    hideTooltipTimeout = null;
  }, 500);
};

// Test click handler to see if highlighting is working
const handleAnswerClick = (event: MouseEvent) => {
  console.log("Answer clicked:", event.target);
  const target = event.target as HTMLElement;
  if (target.classList.contains("ai-highlight")) {
    console.log("Clicked on highlighted text:", target.textContent);
  }
};

// Comment dialog functions
const cancelComment = () => {
  showCommentDialog.value = false;
  selectedText.value = "";
  newComment.value = "";
  window.getSelection()?.removeAllRanges();
};

const submitComment = () => {
  if (newComment.value.trim()) {
    userComments.value.push({
      id: Date.now().toString(),
      author: authStore.name || "You",
      text: newComment.value,
      quotedSnippet: selectedText.value,
      timestamp: new Date(),
    });
    cancelComment();
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRubricDescription = (score: number) => {
  const descriptions = [
    "No clear passion demonstrated",
    "Some interest shown",
    "Moderate passion evident",
    "Strong passion demonstrated",
    "Exceptional passion and drive",
  ];
  return descriptions[score - 1] || "";
};

const skipApplication = () => {
  // Logic to skip current application and get next one
  console.log("Skipping application");
};

const submitReview = () => {
  // Logic to submit review
  console.log("Submitting review with scores:", scores.value);
  currentReads.value++;
};

const addComment = () => {
  if (!newComment.value.trim()) return;

  comments.value.push({
    id: Date.now().toString(),
    readerId: authStore.user?.id || "1",
    timestamp: new Date(),
    text: newComment.value,
    quotedSnippet: "",
  });

  newComment.value = "";
};

const loadPreviousRead = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (target.value) {
    console.log("Loading previous read:", target.value);
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!eventsStore.currentEvent) {
    router.push("/select-event");
  } else {
    await loadApplicationData();
  }

  // --- Add document-level mousemove to hide tooltip if outside all highlights ---
  document.addEventListener("mousemove", (e: MouseEvent) => {
    // If tooltip is not showing, do nothing
    if (!hoveredAIComment.value) return;
    // Check if the mouse is over any .ai-highlight
    let el = e.target as HTMLElement | null;
    let foundHighlight = false;
    while (el) {
      if (el.classList && el.classList.contains("ai-highlight")) {
        foundHighlight = true;
        break;
      }
      el = el.parentElement;
    }
    if (!foundHighlight) {
      // Immediately hide tooltip and clear timers
      clearTooltipTimer();
      hoveredAIComment.value = null;
      currentHoveredSpan = null;
    }
  });
});

// Watch for changes in current application and update highlights
watch(
  () => applicationsStore.currentApplication,
  () => {
    if (applicationsStore.currentApplication?.answers) {
      setTimeout(() => {
        const answerDivs = document.querySelectorAll(".answer");
        applicationsStore.currentApplication.answers.forEach(
          (answer, index) => {
            if (answerDivs[index]) {
              const highlightedHTML = formatAnswerWithHighlights(answer, index);
              console.log(
                `Watcher: Setting innerHTML for answer ${index}:`,
                highlightedHTML
              );
              answerDivs[index].innerHTML = highlightedHTML;
            }
          }
        );
      }, 100);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.read-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1rem;
}

.loading,
.error,
.no-application {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  margin: 2rem 0;
}

.loading p,
.error p,
.no-application p {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.error {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.error p {
  color: #dc2626;
}

.no-application {
  background: rgba(156, 163, 175, 0.05);
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.no-application p {
  color: #6b7280;
}

.comment-category {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: help;
  transition: all 0.2s ease;
}

.comment-category:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comment-strong {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.comment-weak {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.comment-attention {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.comment-default {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

/* AI Highlighting in text */
.ai-highlight {
  display: inline !important;
  padding: 2px 4px !important;
  border-radius: 3px !important;
  cursor: help !important;
  transition: all 0.2s ease !important;
  background-color: rgba(255, 255, 0, 0.8) !important;
  border: 2px solid rgba(255, 0, 0, 0.8) !important;
  font-weight: bold !important;
  color: #000 !important;
}

.ai-highlight:hover {
  transform: scale(1.02);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ai-highlight.comment-strong {
  background: rgba(34, 197, 94, 0.3);
  color: #16a34a;
  font-weight: 600;
}

.ai-highlight.comment-weak {
  background: rgba(251, 191, 36, 0.3);
  color: #d97706;
  font-weight: 600;
}

.ai-highlight.comment-attention {
  background: rgba(239, 68, 68, 0.3);
  color: #dc2626;
  font-weight: 600;
}

/* AI Tooltip */
.ai-tooltip {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}

.ai-tooltip-content {
  background: white;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 0.75rem;
  max-width: 300px;
}

.ai-tooltip-header {
  margin-bottom: 0.5rem;
}

.ai-category {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.ai-tooltip-text {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Comment Dialog */
.comment-dialog {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 1rem;
  min-width: 300px;
  max-width: 400px;
}

.comment-dialog-content h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.selected-text {
  background: var(--bg-secondary);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-style: italic;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.comment-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  resize: vertical;
  margin-bottom: 0.75rem;
  font-family: inherit;
}

.comment-dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* User Comments */
.no-comments {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-style: italic;
}

.comment-author {
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Question styling */
.question-prompt {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
  font-style: italic;
}

.read-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
}

.header-actions {
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

.btn-flag {
  background: #f39c12;
  color: white;
  font-size: 1.2rem;
}

.btn-skip {
  background: #e74c3c;
  color: white;
}

.btn-refresh {
  background: #95a5a6;
  color: white;
  font-size: 1.2rem;
}

.read-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  margin-bottom: 2rem;
}

.scoring-panel,
.comments-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.scoring-panel h3,
.comments-panel h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.criterion {
  margin-bottom: 2rem;
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.criterion-name {
  font-weight: 600;
  color: #2c3e50;
}

.btn-info {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 3px;
}

.slider-container {
  position: relative;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ecf0f1;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.application-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.application-header h2 {
  margin: 0 0 2rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.question {
  margin-bottom: 2rem;
}

.question h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.answer {
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

/* Ensure AI highlights work properly */
.answer .ai-highlight {
  display: inline !important;
}

mark {
  background: #f39c12;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
}

.comment {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #3498db;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.commenter {
  font-weight: 600;
  color: #2c3e50;
}

.comment-time {
  color: #7f8c8d;
}

.comment-text {
  color: #555;
  line-height: 1.4;
}

.quoted-snippet {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e8f4fd;
  border-radius: 4px;
  font-style: italic;
  color: #2c3e50;
}

.add-comment {
  margin-top: 1rem;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 0.5rem;
  font-family: inherit;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.read-actions {
  text-align: center;
  margin-bottom: 2rem;
}

.btn-large {
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.rubric-popup {
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

.rubric-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.rubric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rubric-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: #e74c3c;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.rubric-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rubric-row {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.rubric-score {
  font-weight: 600;
  color: #2c3e50;
}

.rubric-description {
  color: #555;
  line-height: 1.4;
}

.previous-reads {
  position: fixed;
  top: 100px;
  left: 20px;
  z-index: 100;
}

.previous-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

@media (max-width: 1200px) {
  .read-content {
    grid-template-columns: 250px 1fr 250px;
  }
}

@media (max-width: 768px) {
  .read-content {
    grid-template-columns: 1fr;
  }

  .read-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }
}

/* === FIX: make injected highlights visible === */
:deep(.ai-highlight.comment-strong) {
  background: rgba(34, 197, 94, 0.25);
  color: #166534;
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.2s ease;
}

:deep(.ai-highlight.comment-weak) {
  background: rgba(251, 191, 36, 0.25);
  color: #92400e;
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.2s ease;
}

:deep(.ai-highlight.comment-attention) {
  background: rgba(239, 68, 68, 0.25);
  color: #991b1b;
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.2s ease;
}

:deep(.ai-highlight:hover) {
  filter: brightness(1.05);
  transform: scale(1.02);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
