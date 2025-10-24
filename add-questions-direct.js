// Direct API call to add questions to Winter Hackathon 2025
const questions = [
  "Describe a technical project you've worked on that you're proud of. What technologies did you use and what challenges did you overcome?",
  "What interests you most about this hackathon? What kind of project would you like to build?",
  "What is a technical skill or concept you've been struggling with recently? How are you working to improve it?",
];

async function addQuestions() {
  try {
    // Get the event ID first
    const eventResponse = await fetch(
      "http://localhost:8000/api/EventDirectory/_getEventByName",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Winter Hackathon 2025" }),
      }
    );

    const eventData = await eventResponse.json();
    console.log("Event data:", eventData);

    if (!eventData || !eventData._id) {
      console.error("Event not found!");
      return;
    }

    // Update the event with questions
    const updateResponse = await fetch(
      "http://localhost:8000/api/EventDirectory/_updateEventConfig",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caller: "019a0de7-e9c8-767b-be6a-fc9f3eb42f3c", // Use the event ID as caller for now
          event: eventData._id,
          questions: questions,
        }),
      }
    );

    const updateResult = await updateResponse.json();
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

addQuestions();
