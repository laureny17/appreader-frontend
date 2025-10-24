import { api } from "./src/services/api.js";

async function addQuestionsToWinterHackathon() {
  try {
    console.log("Adding questions to Winter Hackathon 2025...");

    // First, get the event by name to get its ID
    const eventData = await api.eventDirectory.getEventByName(
      "Winter Hackathon 2025"
    );
    console.log("Event data:", eventData);

    if (!eventData) {
      console.error("Event not found!");
      return;
    }

    // Update the event with questions
    const questions = [
      "Describe a technical project you've worked on that you're proud of. What technologies did you use and what challenges did you overcome?",
      "What interests you most about this hackathon? What kind of project would you like to build?",
      "What is a technical skill or concept you've been struggling with recently? How are you working to improve it?",
    ];

    const updateResult = await api.eventDirectory.updateEventConfig({
      caller: "admin-user-id", // This should be the admin user ID
      event: eventData._id,
      questions: questions,
    });

    console.log("Update result:", updateResult);

    if (updateResult.error) {
      console.error("Error updating event:", updateResult.error);
    } else {
      console.log("✅ Successfully added questions to Winter Hackathon 2025!");
    }
  } catch (error) {
    console.error("Error adding questions:", error);
  }
}

addQuestionsToWinterHackathon();
