const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Debug logging
  console.log("API Request:", {
    url,
    method: options.method || "GET",
    body: options.body,
  });

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("Non-JSON response:", text);
      throw new ApiError(`Invalid response format: ${text}`);
    }

    const data = await response.json();
    console.log("API Response data:", data);

    // Handle null or undefined response
    if (data === null || data === undefined) {
      throw new ApiError("Server returned null response");
    }

    if (data.error) {
      throw new ApiError(data.error);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const api = {
  // Auth endpoints
  auth: {
    register: (name: string, email: string, password: string) =>
      apiRequest<{ user: string }>("/AuthAccounts/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),

    login: (email: string, password: string) =>
      apiRequest<{ user: string }>("/AuthAccounts/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    getAccountByUserId: (userId: string) =>
      apiRequest<
        [{ _id: string; email: string; name: string; passwordHash: string }]
      >("/AuthAccounts/_getAccountByUserId", {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),

    getAccountByEmail: (email: string) =>
      apiRequest<
        [{ _id: string; email: string; name: string; passwordHash: string }]
      >("/AuthAccounts/_getAccountByEmail", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },

  // Application Storage endpoints
  applicationStorage: {
    createApplication: (name: string) =>
      apiRequest<{ applicationId: string }>(
        "/ApplicationStorage/createApplication",
        {
          method: "POST",
          body: JSON.stringify({ name }),
        }
      ),

    deleteApplication: (applicationId: string) =>
      apiRequest("/ApplicationStorage/deleteApplication", {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      }),

    saveData: (
      user: string,
      applicationId: string,
      key: string,
      data: string
    ) =>
      apiRequest("/ApplicationStorage/saveData", {
        method: "POST",
        body: JSON.stringify({ user, applicationId, key, data }),
      }),

    getData: (user: string, applicationId: string, key: string) =>
      apiRequest<[{ data: string }]>("/ApplicationStorage/_getData", {
        method: "POST",
        body: JSON.stringify({ user, applicationId, key }),
      }),

    listKeys: (user: string, applicationId: string) =>
      apiRequest<[{ key: string }]>("/ApplicationStorage/_listKeys", {
        method: "POST",
        body: JSON.stringify({ user, applicationId }),
      }),
  },

  // Application Assignments endpoints
  applicationAssignments: {
    applyForApplication: (user: string, application: string) =>
      apiRequest<{ assignmentId: string }>(
        "/ApplicationAssignments/applyForApplication",
        {
          method: "POST",
          body: JSON.stringify({ user, application }),
        }
      ),

    assignUserToApplication: (user: string, application: string) =>
      apiRequest<{ assignmentId: string }>(
        "/ApplicationAssignments/assignUserToApplication",
        {
          method: "POST",
          body: JSON.stringify({ user, application }),
        }
      ),

    unassignUserFromApplication: (user: string, application: string) =>
      apiRequest("/ApplicationAssignments/unassignUserFromApplication", {
        method: "POST",
        body: JSON.stringify({ user, application }),
      }),

    getAssignmentsByUser: (user: string) =>
      apiRequest<
        Array<{
          id: string;
          application: string;
          status: string;
          timestamp: number;
        }>
      >("/ApplicationAssignments/_getAssignmentsByUser", {
        method: "POST",
        body: JSON.stringify({ user }),
      }),

    getAssignmentsByApplication: (application: string) =>
      apiRequest<
        Array<{ id: string; user: string; status: string; timestamp: number }>
      >("/ApplicationAssignments/_getAssignmentsByApplication", {
        method: "POST",
        body: JSON.stringify({ application }),
      }),
  },

  // Review Records endpoints
  reviewRecords: {
    submitReview: (
      item: string,
      user: string,
      rating: number,
      comment: string
    ) =>
      apiRequest<{ reviewId: string }>("/ReviewRecords/submitReview", {
        method: "POST",
        body: JSON.stringify({ item, user, rating, comment }),
      }),

    updateReview: (
      reviewId: string,
      item: string,
      user: string,
      newRating?: number,
      newComment?: string
    ) =>
      apiRequest("/ReviewRecords/updateReview", {
        method: "POST",
        body: JSON.stringify({ reviewId, item, user, newRating, newComment }),
      }),

    deleteReview: (reviewId: string, item: string, user: string) =>
      apiRequest("/ReviewRecords/deleteReview", {
        method: "POST",
        body: JSON.stringify({ reviewId, item, user }),
      }),

    getReviewsForItem: (item: string) =>
      apiRequest<
        Array<{
          reviewId: string;
          user: string;
          rating: number;
          comment: string;
          timestamp: number;
        }>
      >("/ReviewRecords/_getReviewsForItem", {
        method: "POST",
        body: JSON.stringify({ item }),
      }),

    getReviewsByUser: (user: string) =>
      apiRequest<
        Array<{
          reviewId: string;
          item: string;
          rating: number;
          comment: string;
          timestamp: number;
        }>
      >("/ReviewRecords/_getReviewsByUser", {
        method: "POST",
        body: JSON.stringify({ user }),
      }),

    getAverageRatingForItem: (item: string) =>
      apiRequest<[{ averageRating: number }]>(
        "/ReviewRecords/_getAverageRatingForItem",
        {
          method: "POST",
          body: JSON.stringify({ item }),
        }
      ),
  },

  // Event Directory endpoints
  eventDirectory: {
    createEvent: (
      caller: string,
      name: string,
      requiredReadsPerApp: number,
      rubric: Array<{
        name: string;
        description: string;
        scaleMin: number;
        scaleMax: number;
      }>
    ) =>
      apiRequest<{ event: string }>("/EventDirectory/createEvent", {
        method: "POST",
        body: JSON.stringify({ caller, name, requiredReadsPerApp, rubric }),
      }),

    activateEvent: (caller: string, name: string) =>
      apiRequest("/EventDirectory/activateEvent", {
        method: "POST",
        body: JSON.stringify({ caller, name }),
      }),

    inactivateEvent: (caller: string, name: string) =>
      apiRequest("/EventDirectory/inactivateEvent", {
        method: "POST",
        body: JSON.stringify({ caller, name }),
      }),

    updateEventConfig: (
      caller: string,
      event: string,
      requiredReadsPerApp?: number,
      rubric?: Array<{
        name: string;
        description: string;
        scaleMin: number;
        scaleMax: number;
      }>,
      eligibilityCriteria?: string[]
    ) =>
      apiRequest("/EventDirectory/updateEventConfig", {
        method: "POST",
        body: JSON.stringify({
          caller,
          event,
          requiredReadsPerApp,
          rubric,
          eligibilityCriteria,
        }),
      }),

    addReader: (caller: string, event: string, user: string) =>
      apiRequest("/EventDirectory/addReader", {
        method: "POST",
        body: JSON.stringify({ caller, event, user }),
      }),

    removeReader: (caller: string, event: string, user: string) =>
      apiRequest("/EventDirectory/removeReader", {
        method: "POST",
        body: JSON.stringify({ caller, event, user }),
      }),

    addAdmin: (caller: string, user: string) =>
      apiRequest("/EventDirectory/addAdmin", {
        method: "POST",
        body: JSON.stringify({ caller, user }),
      }),

    removeAdmin: (caller: string, user: string) =>
      apiRequest("/EventDirectory/removeAdmin", {
        method: "POST",
        body: JSON.stringify({ caller, user }),
      }),

    getEventByName: (name: string) =>
      apiRequest<
        [
          {
            _id: string;
            name: string;
            active: boolean;
            requiredReadsPerApp: number;
            rubric: Array<{
              name: string;
              description: string;
              scaleMin: number;
              scaleMax: number;
            }>;
            eligibilityCriteria: string[];
          }
        ]
      >("/EventDirectory/_getEventByName", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),

    getVerifiedEventsForUser: (userId: string) =>
      apiRequest<
        Array<{
          event: string;
          name: string;
        }>
      >("/EventDirectory/_getVerifiedEventsForUser", {
        method: "POST",
        body: JSON.stringify({ user: userId }),
      }),

    getEventById: (eventId: string) =>
      apiRequest<{
        _id: string;
        name: string;
        active: boolean;
        requiredReadsPerApp: number;
        rubric: Array<{
          name: string;
          description: string;
          scaleMin: number;
          scaleMax: number;
        }>;
        eligibilityCriteria: string[];
        endDate?: string;
      }>("/EventDirectory/_getEventById", {
        method: "POST",
        body: JSON.stringify({ event: eventId }),
      }),
  },

  // Reader Statistics endpoints (these would need to be implemented in backend)
  readerStats: {
    getReaderStats: (eventId: string) =>
      apiRequest<
        Array<{
          userId: string;
          name: string;
          readCount: number;
          skipCount: number;
          averageTime: number;
        }>
      >("/ReaderStats/getReaderStats", {
        method: "POST",
        body: JSON.stringify({ event: eventId }),
      }),
  },

  // Application endpoints
  applications: {
    getNextApplication: (userId: string, eventId: string) =>
      apiRequest<{
        assignment: {
          _id: string;
          user: string;
          application: string;
          startTime: string;
          event: string;
        };
      }>("/ApplicationAssignments/getNextAssignment", {
        method: "POST",
        body: JSON.stringify({
          user: userId,
          event: eventId,
          startTime: new Date().toISOString(),
        }),
      }),

    getApplication: (applicationId: string) =>
      apiRequest<
        Array<{
          _id: string;
          event: string;
          applicantID: string;
          applicantYear: string;
          answers: string[];
        }>
      >("/ApplicationStorage/_getApplication", {
        method: "POST",
        body: JSON.stringify({ application: applicationId }),
      }),

    submitReview: (author: string, application: string, currentTime: string) =>
      apiRequest<{ review: string }>("/ReviewRecords/submitReview", {
        method: "POST",
        body: JSON.stringify({ author, application, currentTime }),
      }),

    setScore: (
      author: string,
      review: string,
      criterion: string,
      value: number
    ) =>
      apiRequest<{ application: string }>("/ReviewRecords/setScore", {
        method: "POST",
        body: JSON.stringify({ author, review, criterion, value }),
      }),

    skipAssignment: (user: string, assignment: any) =>
      apiRequest("/ApplicationAssignments/skipAssignment", {
        method: "POST",
        body: JSON.stringify({ user, assignment }),
      }),

    submitAndIncrement: (user: string, assignment: any, endTime: string) =>
      apiRequest<{ application: string }>(
        "/ApplicationAssignments/submitAndIncrement",
        {
          method: "POST",
          body: JSON.stringify({ user, assignment, endTime }),
        }
      ),
  },
};
