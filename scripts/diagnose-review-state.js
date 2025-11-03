/**
 * Diagnostic script to check review state and database consistency
 *
 * Usage: node scripts/diagnose-review-state.js <userId> <applicationId>
 *
 * Example: node scripts/diagnose-review-state.js "019a2c0b-59c7-7719-9df1-c4cbfa58cc11" "019a2c0d-454f-794d-b1e4-7b01863957f0"
 */

// Use node-fetch if available, otherwise use fetch (Node 18+)
let fetch;
try {
  fetch = (await import("node-fetch")).default;
} catch {
  // Node 18+ has fetch built-in
  fetch = globalThis.fetch;
}

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000/api";

async function apiRequest(endpoint, body) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

async function diagnoseReviewState(userId, applicationId) {
  console.log("=== Review State Diagnostic ===");
  console.log(`User ID: ${userId}`);
  console.log(`Application ID: ${applicationId}`);
  console.log("");

  try {
    // 1. Check if review exists
    console.log("1. Checking if review exists...");
    try {
      const userScores = await apiRequest(
        "/ReviewRecords/_getUserScoresForApplication",
        {
          user: userId,
          application: applicationId,
        }
      );

      if (userScores && userScores.review) {
        console.log("   ✅ Review EXISTS");
        console.log(`   Review ID: ${userScores.review}`);
        console.log(`   Scores: ${JSON.stringify(userScores.scores)}`);
      } else {
        console.log("   ❌ Review DOES NOT EXIST");
      }
    } catch (err) {
      console.log(`   ❌ Error checking review: ${err.message}`);
    }
    console.log("");

    // 2. Check if user has reviewed this application (via reviewed applications list)
    console.log("2. Checking reviewed applications list...");
    try {
      // Need event ID - we'll try to get it from the application
      const appData = await apiRequest("/ApplicationStorage/_getApplication", {
        application: applicationId,
      });

      if (appData && appData.length > 0) {
        const eventId = appData[0].event;
        console.log(`   Event ID: ${eventId}`);

        const reviewedApps = await apiRequest(
          "/ReviewRecords/_getUserReviewedApplications",
          {
            user: userId,
            event: eventId,
          }
        );

        const hasReviewed = reviewedApps.some(
          (app) => app.application === applicationId
        );

        if (hasReviewed) {
          console.log(
            "   ✅ User has reviewed this application (in reviewed list)"
          );
          const reviewInfo = reviewedApps.find(
            (app) => app.application === applicationId
          );
          console.log(`   Submitted at: ${reviewInfo.submittedAt}`);
          console.log(`   Is flagged: ${reviewInfo.isFlagged || false}`);
        } else {
          console.log(
            "   ❌ User has NOT reviewed this application (not in reviewed list)"
          );
        }
      } else {
        console.log("   ⚠️  Could not fetch application data");
      }
    } catch (err) {
      console.log(`   ❌ Error checking reviewed list: ${err.message}`);
    }
    console.log("");

    // 3. Check all reviews for this application
    console.log("3. Checking ALL reviews for this application...");
    try {
      const allReviews = await apiRequest(
        "/ReviewRecords/_getReviewsWithScoresByApplication",
        {
          application: applicationId,
        }
      );

      const userReview = allReviews.find((r) => r.author === userId);

      if (userReview) {
        console.log("   ✅ Review found in all reviews list");
        console.log(`   Review ID: ${userReview.review}`);
        console.log(`   Submitted at: ${userReview.submittedAt}`);
        console.log(`   Active time: ${userReview.activeTime || "N/A"}`);
        console.log(`   Scores: ${JSON.stringify(userReview.scores)}`);
      } else {
        console.log("   ❌ Review NOT found in all reviews list");
        console.log(
          `   Total reviews for this application: ${allReviews.length}`
        );
      }
    } catch (err) {
      console.log(`   ❌ Error checking all reviews: ${err.message}`);
    }
    console.log("");

    // 4. Check current assignment
    console.log("4. Checking current assignment...");
    try {
      const appData = await apiRequest("/ApplicationStorage/_getApplication", {
        application: applicationId,
      });

      if (appData && appData.length > 0) {
        const eventId = appData[0].event;

        const assignment = await apiRequest(
          "/ApplicationAssignments/getCurrentAssignment",
          {
            user: userId,
            event: eventId,
          }
        );

        if (assignment && assignment.assignment) {
          console.log("   ⚠️  User HAS a current assignment");
          console.log(`   Assignment ID: ${assignment.assignment._id}`);
          console.log(
            `   Assignment application: ${assignment.assignment.application}`
          );

          if (assignment.assignment.application === applicationId) {
            console.log("   ⚠️  Assignment is for THIS application!");
          } else {
            console.log("   ✅ Assignment is for a different application");
          }
        } else {
          console.log("   ✅ User does NOT have a current assignment");
        }
      }
    } catch (err) {
      console.log(`   ❌ Error checking assignment: ${err.message}`);
    }
    console.log("");

    // 5. Summary and recommendations
    console.log("=== Summary ===");
    console.log("If review exists but user keeps getting assigned:");
    console.log("  - This suggests the user is not in the 'readers' set");
    console.log("  - This is a backend data consistency issue");
    console.log(
      "  - The user should have been added to readers when review was first created"
    );
    console.log("");
    console.log("Possible solutions:");
    console.log("  1. Backend: Add user to readers set for this application");
    console.log(
      "  2. Backend: Fix getNextAssignment to check for existing reviews"
    );
    console.log(
      "  3. Frontend: Use a workaround to complete assignment (currently blocked by submitAndIncrement issue)"
    );
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

// Get command line arguments
const userId = process.argv[2];
const applicationId = process.argv[3];

if (!userId || !applicationId) {
  console.error(
    "Usage: node scripts/diagnose-review-state.js <userId> <applicationId>"
  );
  console.error("");
  console.error("Example:");
  console.error(
    '  node scripts/diagnose-review-state.js "019a2c0b-59c7-7719-9df1-c4cbfa58cc11" "019a2c0d-454f-794d-b1e4-7b01863957f0"'
  );
  process.exit(1);
}

diagnoseReviewState(userId, applicationId).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
