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

    <div class="read-content">
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
            APPLICANT YR: {{ currentApplication?.applicantYear || "2027" }}
          </h2>
        </div>

        <div class="questions">
          <div
            class="question"
            v-for="(qa, index) in currentApplication?.questionsAndAnswers"
            :key="index"
          >
            <h3>Q{{ index + 1 }}) {{ qa.question }}</h3>
            <div class="answer" v-html="formatAnswer(qa.answer)"></div>
          </div>
        </div>
      </div>

      <div class="comments-panel">
        <h3>Comments</h3>
        <div class="comment" v-for="comment in comments" :key="comment.id">
          <div class="comment-header">
            <span class="commenter">READER {{ comment.readerId }}</span>
            <span class="comment-time">{{
              formatTime(comment.timestamp)
            }}</span>
          </div>
          <div class="comment-text">{{ comment.text }}</div>
          <div v-if="comment.quotedSnippet" class="quoted-snippet">
            "{{ comment.quotedSnippet }}"
          </div>
        </div>

        <div class="add-comment">
          <textarea
            v-model="newComment"
            placeholder="Add a comment..."
            class="comment-input"
          ></textarea>
          <button @click="addComment" class="btn btn-primary btn-sm">
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

// Mock data
const currentReads = ref(130);
const requiredReads = ref(200);
const currentApplication = ref({
  id: "1",
  applicantYear: "2027",
  questionsAndAnswers: [
    {
      question: "Tell us about a project you're proud of",
      answer:
        "I built a machine learning model that predicts stock prices with 95% accuracy. I won 100 hackathons in 1 month and created an app that helps people learn to code.",
    },
    {
      question: "Why do you want to attend this event?",
      answer:
        "I'm passionate about technology and want to learn from other developers. I believe this event will help me grow as a programmer and make meaningful connections.",
    },
  ],
});

const rubricDimensions = ref([
  { id: "1", name: "PASSION", scaleMin: 1, scaleMax: 5 },
  { id: "2", name: "IDK", scaleMin: 1, scaleMax: 5 },
]);

const scores = ref({
  "1": 4,
  "2": 3,
});

const comments = ref([
  {
    id: "1",
    readerId: "1",
    timestamp: new Date("2024-09-27T10:40:00"),
    text: "We have to admit this person",
    quotedSnippet: "I won 100 hackathons in 1 month",
  },
]);

const newComment = ref("");
const showRubric = ref<string | null>(null);
const previousReads = ref([
  { id: "1", timestamp: new Date("2024-09-27T10:40:00") },
  { id: "2", timestamp: new Date("2024-09-27T10:20:00") },
]);

const progressPercentage = computed(() => {
  return (currentReads.value / requiredReads.value) * 100;
});

const formatAnswer = (answer: string) => {
  // Highlight quoted snippets that have comments
  return answer.replace(/I won 100 hackathons in 1 month/g, "<mark>$&</mark>");
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
  } else {
    await eventsStore.loadEvents();
  }
});
</script>

<style scoped>
.read-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1rem;
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
</style>
