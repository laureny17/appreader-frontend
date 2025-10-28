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

    <div v-else-if="!currentApp" class="no-application">
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
      <div v-if="isCurrentAppFlagged" class="flagged-notice">
        🚩 This application has been flagged
      </div>
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
              @click="showRubric = criterion.name"
              title="Click to show rubric details"
            >
              [?]
            </button>
          </div>
          <div class="score-buttons-container">
            <div class="score-buttons">
              <button
                v-for="i in criterion.scaleMax"
                :key="i"
                @click="
                  scores[criterion.name] = i;
                  hasTouchedSliders = true;
                "
                :disabled="isCurrentAppFlagged"
                :class="[
                  'score-btn',
                  scores[criterion.name] === i
                    ? 'score-btn-selected'
                    : 'score-btn-unselected',
                ]"
              >
                {{ i }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="application-content">
        <div class="application-header">
          <h2>APPLICANT: {{ currentApp?.applicantID }}</h2>
          <p class="applicant-year">
            Applicant Year:
            {{ currentApp?.applicantYear }}
          </p>
        </div>

        <div class="questions">
          <div
            class="question"
            v-for="(answer, index) in currentApp?.answers"
            :key="index"
          >
            <h3>Q{{ index + 1 }}) {{ getQuestionForIndex(index) }}</h3>
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
      <div class="previous-reads">
        <select
          @change="loadPreviousRead"
          class="previous-select"
          ref="previousReadsSelect"
          :disabled="
            isViewingPreviousRead && !isCurrentAppFlagged && !allScoresSelected
          "
        >
          <option value="">Previous reads...</option>
          <option v-if="currentApp" :value="currentApp._id">
            {{
              isViewingPreviousRead
                ? "Back to current"
                : "Current: " + formatTime(new Date())
            }}
          </option>
          <option v-for="read in previousReads" :key="read.id" :value="read.id">
            {{ formatTime(read.timestamp) }}{{ read.isFlagged ? " 🚩" : "" }}
          </option>
        </select>
      </div>
      <button @click="skipApplication" class="btn btn-skip">SKIP</button>
      <button @click="flagApplication" class="btn btn-danger">
        {{ isCurrentAppFlagged ? "UNFLAG" : "FLAG" }}
      </button>
      <button
        @click="submitReview"
        class="btn btn-primary btn-large"
        :disabled="!allScoresSelected"
      >
        {{ isViewingPreviousRead && hasExistingReview ? "RESUBMIT" : "SUBMIT" }}
      </button>
    </div>

    <!-- Rubric Popup -->
    <div v-if="showRubric" class="rubric-popup" @click="showRubric = null">
      <div class="rubric-content" @click.stop>
        <div class="rubric-header">
          <h3>Rubric Details</h3>
          <button @click="showRubric = null" class="btn btn-close">×</button>
        </div>
        <div class="rubric-info" v-if="selectedCriterion">
          <h4>{{ selectedCriterion.name }}</h4>
          <p>{{ selectedCriterion.description }}</p>
          <div class="rubric-scale">
            <p>
              <strong>Scale:</strong> {{ selectedCriterion.scaleMin }} to
              {{ selectedCriterion.scaleMax }}
            </p>
          </div>
          <div
            v-if="
              selectedCriterion.guidelines &&
              selectedCriterion.guidelines.length > 0
            "
            class="scoring-guidelines"
          >
            <h4>Scoring Guidelines:</h4>
            <div class="guidelines-list">
              <div
                v-for="(guideline, index) in selectedCriterion.guidelines"
                :key="index"
                class="guideline-item"
              >
                <span class="score-badge">{{ index + 1 }}</span>
                <span class="guideline-text">{{ guideline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useApplicationsStore } from "@/stores/applications";
import { api, ApiError } from "@/services/api";

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
const isViewingPreviousRead = ref(false);
const savedAssignment = ref<any>(null);
const tempApplication = ref<any>(null);
const tempAIComments = ref<any[]>([]);
const existingReviewId = ref<string | null>(null);
const hasExistingReview = ref(false);
const isCurrentAppFlagged = ref(false);
const hasTouchedSliders = ref(false);
const previousReadsSelect = ref<HTMLSelectElement | null>(null);

// Computed property to check if all scores are selected
const allScoresSelected = computed(() => {
  return rubricDimensions.value.every(
    (criterion) =>
      scores.value[criterion.name] !== undefined &&
      scores.value[criterion.name] !== null
  );
});

// Computed property to get current application
const currentApp = computed(() => {
  return isViewingPreviousRead.value && tempApplication.value
    ? tempApplication.value
    : applicationsStore.currentApplication;
});

// Computed property to get current AI comments
const currentAIComments = computed(() => {
  return isViewingPreviousRead.value
    ? tempAIComments.value
    : applicationsStore.currentApplicationComments || [];
});

// AI Comment highlighting and tooltips
const hoveredAIComment = ref(null);
const tooltipPosition = ref({ top: "0px", left: "0px" });

// Text selection for user comments
const showCommentDialog = ref(false);
const selectedText = ref("");
const commentDialogPosition = ref({ top: "0px", left: "0px" });

// Active time tracking
const activeTimeTracker = ref({
  lastActivityTime: 0,
  totalActiveSeconds: 0,
  inactivityTimeout: null as ReturnType<typeof setTimeout> | null,
});

const INACTIVITY_THRESHOLD = 30000; // 30 seconds

const updateActivity = () => {
  const now = Date.now();
  const timeSinceLastActivity = now - activeTimeTracker.value.lastActivityTime;

  if (timeSinceLastActivity <= INACTIVITY_THRESHOLD) {
    // User is active, add this time to total
    activeTimeTracker.value.totalActiveSeconds +=
      (now - activeTimeTracker.value.lastActivityTime) / 1000;
  }

  activeTimeTracker.value.lastActivityTime = now;

  // Clear existing timeout
  if (activeTimeTracker.value.inactivityTimeout) {
    clearTimeout(activeTimeTracker.value.inactivityTimeout);
  }

  // Set new timeout
  activeTimeTracker.value.inactivityTimeout = setTimeout(() => {
    // User is now inactive
  }, INACTIVITY_THRESHOLD);
};

const progressPercentage = computed(() => {
  if (requiredReads.value === 0) return 0;
  return (currentReads.value / requiredReads.value) * 100;
});

// Load real data from API
const loadApplicationData = async () => {
  if (!eventsStore.currentEvent || !authStore.user) return;

  console.log("Current event:", eventsStore.currentEvent);
  const eventId =
    (eventsStore.currentEvent as any).eventId ||
    (eventsStore.currentEvent as any)._id;
  console.log("Event ID:", eventId);

  try {
    // Load rubric from current event
    rubricDimensions.value = eventsStore.currentEvent.rubric || [];

    // Initialize scores - leave undefined until user selects
    scores.value = {};
    hasTouchedSliders.value = false;
    rubricDimensions.value.forEach((criterion) => {
      scores.value[criterion.name] = undefined;
    });

    // Reset and start active time tracking
    activeTimeTracker.value.lastActivityTime = Date.now();
    activeTimeTracker.value.totalActiveSeconds = 0;

    // Get next assignment from API
    try {
      console.log("Calling getNextAssignment with:", {
        userId: authStore.user.id,
        eventId: eventId,
      });
      await applicationsStore.getNextAssignment(authStore.user.id, eventId);
      console.log("Got assignment:", applicationsStore.currentAssignment);
      console.log("Current application:", applicationsStore.currentApplication);
      console.log("Has application?", !!applicationsStore.currentApplication);

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
                console.log(highlightedHTML);
                answerDivs[index].innerHTML = highlightedHTML;
              }
            }
          );
        }
      }, 100);
    } catch (err) {
      console.error("No more assignments available:", err);
      applicationsStore.setError(
        "No eligible applications available for assignment. If you are an admin, you may need to be added as a verified reader for this event, or there may be no applications in this event."
      );
      // Cannot set currentApplication since it's readonly - the store handles this internally
    }

    // Load review progress from API
    try {
      const progress = await api.applications.getUserReviewProgress(
        authStore.user.id,
        eventId
      );
      currentReads.value = progress.reviewsCompleted;
      requiredReads.value = progress.totalNeeded;
      console.log("User progress:", progress);
    } catch (err) {
      console.warn("Could not load user progress:", err);
      // Don't set error here, just skip
    }

    // Load comments for this application
    await loadComments();
  } catch (err) {
    console.error("Error loading application data:", err);
  }
  setTimeout(() => {
    const answerDivs = document.querySelectorAll(".answer");
    if (currentApp.value?.answers) {
      currentApp.value.answers.forEach((answer, index) => {
        if (answerDivs[index]) {
          const highlightedHTML = formatAnswerWithHighlights(answer, index);
          answerDivs[index].innerHTML = highlightedHTML;
        }
      });
    }
  }, 100);
};

const formatAnswer = (answer: string) => {
  // Highlight quoted snippets that have comments
  return answer.replace(/I won 100 hackathons in 1 month/g, "<mark>$&</mark>");
};

const formatAnswerWithHighlights = (answer: string, answerIndex: number) => {
  // Only highlight snippets from currentAIComments
  let highlightedAnswer = answer;

  const activeComments = currentAIComments.value;
  if (activeComments && activeComments.length > 0) {
    activeComments.forEach((comment) => {
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
  if (
    !eventsStore.currentEvent?.questions ||
    !eventsStore.currentEvent.questions.length
  ) {
    console.log("No questions available, using fallback");
    return `Question ${index + 1}`;
  }

  // The questions array should be in the same order as the answers array
  const question = eventsStore.currentEvent.questions[index];
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
  // Only allow text selection if the event target is within an answer div
  const target = event.target as HTMLElement;

  // Check if target is inside an answer div
  const answerDivs = document.querySelectorAll(".answer");
  let isInAnswerDiv = false;

  for (const div of answerDivs) {
    if (div.contains(target)) {
      isInAnswerDiv = true;
      break;
    }
  }

  if (!isInAnswerDiv) {
    // Clear any existing selection
    window.getSelection()?.removeAllRanges();
    return;
  }

  // Check if selection is entirely within answer divs
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check if the selection is within any answer div
    let selectionInAnswer = false;
    for (const div of answerDivs) {
      if (
        div.contains(
          container.nodeType === Node.TEXT_NODE
            ? container.parentNode
            : (container as Node)
        )
      ) {
        selectionInAnswer = true;
        break;
      }
    }

    if (!selectionInAnswer) {
      window.getSelection()?.removeAllRanges();
      return;
    }
  }

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

const submitComment = async () => {
  if (
    !newComment.value.trim() ||
    !applicationsStore.currentApplication ||
    !authStore.user
  )
    return;

  try {
    // Use correct app depending on whether we're viewing a previous read
    const targetAppId = isViewingPreviousRead.value
      ? tempApplication.value?._id
      : applicationsStore.currentApplication?._id;

    if (!targetAppId) {
      alert("No valid application to comment on.");
      return;
    }

    await api.reviewRecords.addComment(
      authStore.user.id,
      targetAppId,
      newComment.value,
      selectedText.value
    );
    // Reload comments
    await loadComments();
    cancelComment();
  } catch (err) {
    console.error("Failed to save comment:", err);
    alert("Failed to save comment. Please try again.");
  }
};

const loadComments = async () => {
  // Always clear existing comments at the start
  userComments.value = [];
  if (!currentApp.value || !authStore.user) {
    console.log("Cannot load comments - no application or user");
    return;
  }

  try {
    console.log("Fetching comments for application:", currentApp.value._id);
    const comments = await api.reviewRecords.getCommentsByApplication(
      currentApp.value._id
    );

    console.log("Loaded comments response:", comments);

    if (!comments || !Array.isArray(comments)) {
      console.warn("Comments is not an array:", comments);
      userComments.value = [];
      return;
    }

    // Get author names for all comments - fetch all users at once if admin
    const authorIds = [...new Set(comments.map((c) => c.author))];
    const authorMap = new Map();

    // Try to get all users at once if admin
    try {
      const allUsers = await api.auth.getAllUsers(authStore.user.id);
      console.log("Fetched all users:", allUsers);
      allUsers.forEach((user) => {
        authorMap.set(user._id, user.name);
      });
    } catch (err) {
      console.warn("Could not fetch all users:", err);
    }

    // Fill in author names
    console.log("Author IDs to fetch:", authorIds);
    console.log("Current author map:", Array.from(authorMap.entries()));

    // Use authStore to get current user name if they're the author
    if (authStore.user && authorIds.includes(authStore.user.id)) {
      authorMap.set(authStore.user.id, authStore.user.name);
      console.log(
        `Added current user ${authStore.user.id} -> ${authStore.user.name}`
      );
    }

    // Fetch any remaining author names
    for (const authorId of authorIds) {
      if (!authorMap.has(authorId)) {
        console.log(`Fetching name for user ${authorId}...`);
        try {
          const name = await api.auth.getNameByUserId(authorId);
          console.log(`Fetched name for ${authorId}:`, name);
          if (name && name.trim()) {
            authorMap.set(authorId, name);
            console.log(`Set author ${authorId} to name: ${name}`);
          } else {
            console.warn(`No name found for user ${authorId}, keeping ID`);
          }
        } catch (err) {
          console.error(`Could not fetch name for user ${authorId}:`, err);
          // On error, keep the ID as fallback
        }
      } else {
        console.log(`Author ${authorId} already in map`);
      }
    }

    console.log("Author map:", Array.from(authorMap.entries()));

    console.log("Mapping comments with author map...");
    userComments.value = comments.map((comment) => {
      const mappedName = authorMap.get(comment.author);
      console.log(
        `Comment author ${comment.author} -> ${mappedName || comment.author}`
      );
      return {
        id: comment._id,
        author: mappedName || comment.author,
        text: comment.text,
        quotedSnippet: comment.quotedSnippet || "",
        timestamp: new Date(comment.timestamp),
      };
    });
    console.log("Final userComments:", userComments.value);
  } catch (err) {
    console.error("Failed to load comments:", err);
    userComments.value = [];
  }

  setTimeout(() => {
    const answerDivs = document.querySelectorAll(".answer");
    if (currentApp.value?.answers) {
      currentApp.value.answers.forEach((answer, index) => {
        if (answerDivs[index]) {
          const highlightedHTML = formatAnswerWithHighlights(answer, index);
          answerDivs[index].innerHTML = highlightedHTML;
        }
      });
    }
  }, 100);
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

const selectedCriterion = computed(() => {
  if (!showRubric.value) return null;
  return rubricDimensions.value.find(
    (criterion) => criterion.name === showRubric.value
  );
});

const skipApplication = async () => {
  // If viewing a previous read, delete the review and return to current assignment
  if (isViewingPreviousRead.value) {
    try {
      // If there's an existing review, delete it
      if (existingReviewId.value && authStore.user) {
        await api.reviewRecords.deleteReview(
          existingReviewId.value,
          authStore.user.id
        );
        console.log("Deleted review for skipped application");
      }

      // Return to current assignment
      isViewingPreviousRead.value = false;
      tempApplication.value = null;
      tempAIComments.value = [];
      userComments.value = [];
      isCurrentAppFlagged.value = false;
      hasTouchedSliders.value = false;
      existingReviewId.value = null;
      await loadApplicationData();
      await loadPreviousReads();
      return;
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to skip application. Please try again.");
      return;
    }
  }

  // Otherwise, skip the current assignment
  if (!applicationsStore.currentAssignment || !authStore.user) {
    alert("No assignment to skip.");
    return;
  }

  try {
    await api.applications.skipAssignment(
      authStore.user.id,
      applicationsStore.currentAssignment
    );
    // Load next application
    await loadApplicationData();
    await loadPreviousReads();
  } catch (err) {
    console.error("Failed to skip application:", err);
    alert("Failed to skip application. Please try again.");
  }
};

const flagApplication = async () => {
  if (!currentApp.value || !authStore.user) {
    alert("No application to flag or unflag.");
    return;
  }

  console.log("DEBUG: Flagging application:", {
    applicationId: currentApp.value._id,
    applicationName: currentApp.value.applicantID,
    isViewingPreviousRead: isViewingPreviousRead.value,
    userId: authStore.user.id,
  });

  try {
    // 🔍 Always refresh flag status first from backend
    const isFlaggedInBackend =
      await api.reviewRecords.hasUserFlaggedApplication(
        authStore.user.id,
        currentApp.value._id
      );
    console.log("DEBUG: Flag status from backend:", isFlaggedInBackend);
    isCurrentAppFlagged.value = isFlaggedInBackend;

    // 🟥 If flagged already → UNFLAG
    if (isFlaggedInBackend) {
      console.log("Unflagging application...");
      const existingReview =
        await api.reviewRecords.getUserScoresForApplication(
          authStore.user.id,
          currentApp.value._id
        );

      if (existingReview?.review) {
        await api.reviewRecords.removeRedFlag(
          authStore.user.id,
          existingReview.review
        );
        isCurrentAppFlagged.value = false;
        hasTouchedSliders.value = false;
        // Don't reset scores - leave them undefined until user selects
        await loadPreviousReads();
        alert(
          "Application unflagged successfully! Please select scores for this applicant and submit (or skip if needed)."
        );
      } else {
        alert("No existing review found to unflag.");
      }
      return;
    }

    // 🟩 If not flagged → FLAG
    console.log("Flagging application...");

    // Use flagAndSkip with the current assignment
    if (!applicationsStore.currentAssignment) {
      throw new Error("No current assignment to flag");
    }

    console.log(
      "Using flagAndSkip with assignment:",
      applicationsStore.currentAssignment
    );

    try {
      const flagResult = await api.applicationAssignments.flagAndSkip(
        authStore.user.id,
        applicationsStore.currentAssignment,
        "Flagged for ineligibility"
      );
      console.log("Application flagged and skipped:", flagResult);
    } catch (err) {
      console.error("flagAndSkip failed:", err);
      throw err;
    }

    isCurrentAppFlagged.value = true;
    hasTouchedSliders.value = false;
    // Clear all scores when flagging
    rubricDimensions.value.forEach((criterion) => {
      scores.value[criterion.name] = undefined;
    });
    await loadPreviousReads();

    // Automatically move to next application after flagging
    try {
      console.log("DEBUG: About to load next application...");
      await loadApplicationData();
      console.log(
        "DEBUG: Loaded next application:",
        currentApp.value?.applicantID
      );

      // Reset flagging state for the new application
      isCurrentAppFlagged.value = false;
      hasTouchedSliders.value = false;

      // Reset previous read state when moving to next application
      isViewingPreviousRead.value = false;
      tempApplication.value = null;
      tempAIComments.value = [];

      alert("Application flagged successfully! Moving to next application.");
    } catch (err) {
      // If no more applications, clear current application and show message
      applicationsStore.clearCurrentApplication();
      alert(
        "Application flagged successfully! No more applications available."
      );
    }
  } catch (err) {
    console.error("Failed to flag/unflag:", err);
    alert(
      "Failed to update flag: " +
        (err instanceof Error ? err.message : "Please try again.")
    );
  }
};

const submitReview = async () => {
  // Check if viewing a previous read
  const appId =
    isViewingPreviousRead.value && tempApplication.value
      ? tempApplication.value._id
      : applicationsStore.currentApplication?._id;

  if (!appId || !authStore.user) {
    alert("No application to submit.");
    return;
  }

  // If viewing previous read, always try to edit
  if (isViewingPreviousRead.value && existingReviewId.value) {
    try {
      // Use editReview to mark as editable
      await api.reviewRecords.editReview(
        authStore.user.id,
        existingReviewId.value
      );

      // Update all the scores
      for (const [criterionName, score] of Object.entries(scores.value)) {
        await api.reviewRecords.setScore(
          authStore.user.id,
          existingReviewId.value,
          criterionName,
          Number(score)
        );
      }

      alert("Review updated successfully!");

      // Return to current assignment
      if (savedAssignment.value) {
        (applicationsStore as any).currentAssignment = savedAssignment.value;
        isViewingPreviousRead.value = false;
        savedAssignment.value = null;
        tempApplication.value = null;
        tempAIComments.value = [];
        existingReviewId.value = null;
        isCurrentAppFlagged.value = false; // reset flag status
        hasTouchedSliders.value = false; // reset slider touch status
        await loadApplicationData();
        await loadPreviousReads();
      }
      return;
    } catch (err) {
      alert(
        "Failed to update review: " +
          (err instanceof Error ? err.message : "Please try again.")
      );
      return;
    }
  }

  // Regular submission for current assignment
  if (!applicationsStore.currentAssignment) {
    alert("No assignment to submit.");
    return;
  }

  try {
    // First submit the review
    const review = await api.applications.submitReview(
      authStore.user.id,
      appId,
      new Date().toISOString()
    );

    // Then set all the scores
    for (const [criterionName, score] of Object.entries(scores.value)) {
      await api.applications.setScore(
        authStore.user.id,
        review.review,
        criterionName,
        Number(score)
      );
    }

    // Finally, submit and increment
    const activeTimeSeconds = Math.round(
      activeTimeTracker.value.totalActiveSeconds
    );
    await api.applications.submitAndIncrement(
      authStore.user.id,
      applicationsStore.currentAssignment,
      new Date().toISOString(),
      activeTimeSeconds
    );

    currentReads.value++;
    activeTimeTracker.value.totalActiveSeconds = 0;

    // Load next application
    await loadApplicationData();
    await loadPreviousReads();

    alert("Review submitted successfully!");
  } catch (err) {
    console.error("Failed to submit review:", err);
    alert(
      "Failed to submit review: " +
        (err instanceof Error ? err.message : "Please try again.")
    );
  }
};

// addComment function removed - using submitComment instead

const loadPreviousRead = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const selectedId = target.value;
  if (!selectedId) return;

  // If selecting the current application while already viewing previous, toggle back to current
  if (selectedId === currentApp.value?._id && isViewingPreviousRead.value) {
    console.log("Returning to current assignment view...");
    isViewingPreviousRead.value = false;
    tempApplication.value = null;
    tempAIComments.value = [];
    userComments.value = []; // clear old comments
    isCurrentAppFlagged.value = false; // reset flag status for current app
    hasTouchedSliders.value = false; // reset slider touch status
    previousReadsSelect.value!.value = ""; // reset dropdown selection
    await loadApplicationData();
    await loadPreviousReads();
    return;
  }

  // If selecting the current application while not viewing previous, do nothing
  if (selectedId === currentApp.value?._id && !isViewingPreviousRead.value) {
    previousReadsSelect.value!.value = "";
    return;
  }

  try {
    // Save current assignment if we're viewing a new previous read
    if (!isViewingPreviousRead.value) {
      savedAssignment.value = applicationsStore.currentAssignment;
      isViewingPreviousRead.value = true;
    }

    // Load the application into temp storage
    const appData = await api.applications.getApplication(selectedId);
    console.log("Fetched appData for previous:", appData);

    const app = Array.isArray(appData) ? appData[0] : appData;
    if (!app || !app._id) {
      alert("Could not load application");
      previousReadsSelect.value!.value = "";
      return;
    }

    tempApplication.value = app; // ensure reactivity kicks in
    await nextTick(); // let DOM update before rendering
    console.log("Now displaying previous app:", tempApplication.value);

    // Load AI comments into temp storage
    tempAIComments.value =
      await api.applicationStorage.getAICommentsByApplication(selectedId);

    // Check if this is a flagged application
    const matchedRead = previousReads.value.find(
      (r: any) => r.id === selectedId
    );
    isCurrentAppFlagged.value = matchedRead?.isFlagged || false;

    // Load existing scores for this application if user already reviewed it
    try {
      const existingScores =
        await api.reviewRecords.getUserScoresForApplication(
          authStore.user!.id,
          selectedId
        );

      if (existingScores) {
        existingReviewId.value = existingScores.review;
        hasExistingReview.value = true;

        // Set scores to existing values
        existingScores.scores.forEach((score: any) => {
          scores.value[score.criterion] = score.value;
        });
      } else {
        existingReviewId.value = null;
        hasExistingReview.value = false;
        // Reset scores to undefined
        hasTouchedSliders.value = false;
        rubricDimensions.value.forEach((criterion) => {
          scores.value[criterion.name] = undefined;
        });
      }
    } catch (err) {
      console.error("Could not load existing scores:", err);
      // Reset to undefined on error
      hasTouchedSliders.value = false;
      rubricDimensions.value.forEach((criterion) => {
        scores.value[criterion.name] = undefined;
      });
    }

    // Also check if this application has a red flag from this user
    try {
      const isFlagged = await api.reviewRecords.hasUserFlaggedApplication(
        authStore.user!.id,
        selectedId
      );
      isCurrentAppFlagged.value = isFlagged;

      // If flagged, clear all scores
      if (isFlagged) {
        hasTouchedSliders.value = false;
        scores.value = {};
        rubricDimensions.value.forEach((criterion) => {
          scores.value[criterion.name] = undefined;
        });
      }
    } catch (err) {
      console.warn("Could not load flag status:", err);
    }

    // Load user comments for the selected application (loadComments will use currentApp.value)
    await loadComments();

    // Refresh the answer display
    await new Promise((resolve) => setTimeout(resolve, 100));
    const answerDivs = document.querySelectorAll(".answer");
    if (tempApplication.value?.answers) {
      tempApplication.value.answers.forEach((answer: any, index: any) => {
        if (answerDivs[index]) {
          const highlightedHTML = formatAnswerWithHighlights(answer, index);
          answerDivs[index].innerHTML = highlightedHTML;
        }
      });
    }

    await loadComments();
    await nextTick();
    console.log("Rendered previous application answers and comments");
    // Do not reset dropdown here (removed: target.value = "";)
  } catch (err) {
    alert("Failed to load application");
    previousReadsSelect.value!.value = "";
  }
};

const loadPreviousReads = async () => {
  try {
    const eventId =
      (eventsStore.currentEvent as any).eventId ||
      (eventsStore.currentEvent as any)._id;
    const previousReviews = await api.reviewRecords.getUserReviewedApplications(
      authStore.user!.id,
      eventId
    );
    previousReads.value = previousReviews.map((review: any) => ({
      id: review.application,
      timestamp: new Date(review.submittedAt),
      isFlagged: review.isFlagged || false,
    }));
  } catch (err) {
    // Silently fail
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth");
  } else if (!eventsStore.currentEvent) {
    router.push("/select-event");
  } else {
    // Load previous reads
    await loadPreviousReads();

    await loadApplicationData();
  }

  // Add activity listeners for active time tracking
  window.addEventListener("mousemove", updateActivity);
  window.addEventListener("click", updateActivity);
  window.addEventListener("keydown", updateActivity);
  window.addEventListener("scroll", updateActivity);

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
  background: var(--bg-secondary);
  padding: 1rem;
  font-family: "Nunito", sans-serif;
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
  background: rgba(139, 189, 89, 0.2);
  color: var(--text-primary);
  border: 1px solid rgba(139, 189, 89, 0.4);
}

.comment-weak {
  background: rgba(252, 176, 90, 0.2);
  color: var(--text-primary);
  border: 1px solid rgba(252, 176, 90, 0.4);
}

.comment-attention {
  background: rgba(255, 103, 66, 0.2);
  color: var(--text-primary);
  border: 1px solid rgba(255, 103, 66, 0.4);
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
  background: rgba(139, 189, 89, 0.25);
  color: var(--text-primary);
  font-weight: 600;
}

.ai-highlight.comment-weak {
  background: rgba(252, 176, 90, 0.25);
  color: var(--text-primary);
  font-weight: 600;
}

.ai-highlight.comment-attention {
  background: rgba(255, 103, 66, 0.25);
  color: var(--text-primary);
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
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
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
  background: var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: var(--text-primary);
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
  background: var(--accent-danger);
  color: white;
  font-size: 1.2rem;
}

.btn-skip {
  background: #fb9905;
  color: white;
}

.btn-skip:hover {
  background: #e48a04;
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

.flagged-notice {
  grid-column: 1 / -1;
  background: rgba(255, 103, 66, 0.15);
  border: 2px solid var(--accent-danger);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: var(--accent-danger);
  font-weight: 600;
}

.scoring-panel,
.comments-panel {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
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
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
}

.score-buttons-container {
  margin-top: 0.5rem;
}

.score-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.score-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-medium);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-btn:hover {
  border-color: var(--accent-primary);
  background: var(--bg-secondary);
}

.score-btn-selected {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.score-btn-selected:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.score-btn-unselected {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-medium);
}

.score-btn:disabled {
  background: #ccc;
  color: #666;
  border-color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.score-btn:disabled:hover {
  background: #ccc;
  border-color: #ccc;
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
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.commenter {
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  color: var(--text-muted);
}

.comment-text {
  color: var(--text-primary);
  line-height: 1.4;
}

.quoted-snippet {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(111, 144, 209, 0.08);
  border-radius: var(--radius-sm);
  font-style: italic;
  color: var(--text-primary);
  border-left: 3px solid var(--accent-primary);
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
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.previous-reads {
  flex-shrink: 0;
}

.read-actions .btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-large {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-secondary);
}

.btn-primary:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--accent-secondary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent-primary);
}

.btn-secondary:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

.btn-danger {
  background: var(--accent-danger);
  color: white;
}

.btn-danger:hover {
  background: #ff5432;
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
  background: var(--accent-danger);
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

.rubric-info {
  padding: 1rem;
}

.rubric-info h4 {
  margin-top: 0;
  color: #2c3e50;
}

.rubric-info p {
  line-height: 1.6;
  color: #555;
}

.rubric-scale {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.scoring-guidelines {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--accent-primary);
}

.scoring-guidelines h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.guidelines-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.guideline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.5rem;
  border-left: 3px solid var(--accent-primary);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.score-badge {
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
}

.guideline-text {
  flex: 1;
  line-height: 1.5;
  color: #2c3e50;
}

.applicant-year {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.previous-select {
  padding: 0.75rem 2rem;
  padding-right: 2.5rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23211c1b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")
    no-repeat right 1rem center;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Nunito", sans-serif;
  min-width: 200px;
  font-weight: 600;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.previous-select:hover:not(:disabled) {
  background: var(--border-medium)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23211c1b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")
    no-repeat right 1rem center;
}

.previous-select:focus:not(:disabled) {
  outline: none;
  box-shadow: 0 0 0 3px rgba(111, 144, 209, 0.1);
  background: var(--border-medium)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23211c1b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")
    no-repeat right 1rem center;
}

.previous-select:disabled {
  background: #ccc
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")
    no-repeat right 1rem center;
  color: #666;
  cursor: not-allowed;
}

/* Style the dropdown options */
.previous-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  font-family: "Nunito", sans-serif;
  font-weight: 500;
}

.previous-select option:hover {
  background: var(--bg-secondary);
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
  background: rgba(139, 189, 89, 0.25);
  color: var(--text-primary);
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.2s ease;
}

:deep(.ai-highlight.comment-weak) {
  background: rgba(252, 176, 90, 0.25);
  color: var(--text-primary);
  font-weight: 600;
  border-radius: 3px;
  padding: 0 2px;
  transition: background 0.2s ease;
}

:deep(.ai-highlight.comment-attention) {
  background: rgba(255, 103, 66, 0.25);
  color: var(--text-primary);
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
