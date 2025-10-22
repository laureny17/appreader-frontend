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

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();

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
    register: (username: string, password: string) =>
      apiRequest<{ user: string }>("/AuthAccounts/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    login: (username: string, password: string) =>
      apiRequest<{ user: string }>("/AuthAccounts/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    getUsername: (user: string) =>
      apiRequest<[{ username: string }]>("/AuthAccounts/_getUsername", {
        method: "POST",
        body: JSON.stringify({ user }),
      }),
  },

  // Application Storage endpoints
  applicationStorage: {
    put: (application: string, content: string) =>
      apiRequest("/ApplicationStorage/put", {
        method: "POST",
        body: JSON.stringify({ application, content }),
      }),

    delete: (application: string) =>
      apiRequest("/ApplicationStorage/delete", {
        method: "POST",
        body: JSON.stringify({ application }),
      }),

    get: (application: string) =>
      apiRequest<[{ content: string }]>("/ApplicationStorage/_get", {
        method: "POST",
        body: JSON.stringify({ application }),
      }),
  },

  // Application Assignments endpoints
  applicationAssignments: {
    assign: (application: string, reviewer: string) =>
      apiRequest<{ assignment: string }>("/ApplicationAssignments/assign", {
        method: "POST",
        body: JSON.stringify({ application, reviewer }),
      }),

    unassign: (application: string, reviewer: string) =>
      apiRequest("/ApplicationAssignments/unassign", {
        method: "POST",
        body: JSON.stringify({ application, reviewer }),
      }),

    getAssignments: (application: string) =>
      apiRequest<Array<{ assignment: string; reviewer: string }>>(
        "/ApplicationAssignments/_getAssignments",
        {
          method: "POST",
          body: JSON.stringify({ application }),
        }
      ),
  },

  // Review Records endpoints
  reviewRecords: {
    save: (
      application: string,
      reviewer: string,
      score: number,
      comment: string
    ) =>
      apiRequest<{ record: string }>("/ReviewRecords/save", {
        method: "POST",
        body: JSON.stringify({ application, reviewer, score, comment }),
      }),

    delete: (application: string, reviewer: string) =>
      apiRequest("/ReviewRecords/delete", {
        method: "POST",
        body: JSON.stringify({ application, reviewer }),
      }),

    get: (application: string, reviewer: string) =>
      apiRequest<[{ score: number; comment: string }]>("/ReviewRecords/_get", {
        method: "POST",
        body: JSON.stringify({ application, reviewer }),
      }),

    listForApplication: (application: string) =>
      apiRequest<
        Array<{
          record: string;
          reviewer: string;
          score: number;
          comment: string;
        }>
      >("/ReviewRecords/_listForApplication", {
        method: "POST",
        body: JSON.stringify({ application }),
      }),

    listForReviewer: (reviewer: string) =>
      apiRequest<
        Array<{
          record: string;
          application: string;
          score: number;
          comment: string;
        }>
      >("/ReviewRecords/_listForReviewer", {
        method: "POST",
        body: JSON.stringify({ reviewer }),
      }),
  },

  // Event Directory endpoints
  eventDirectory: {
    create: (description: string, timestamp: number) =>
      apiRequest<{ event: string }>("/EventDirectory/create", {
        method: "POST",
        body: JSON.stringify({ description, timestamp }),
      }),

    delete: (event: string) =>
      apiRequest("/EventDirectory/delete", {
        method: "POST",
        body: JSON.stringify({ event }),
      }),

    get: (event: string) =>
      apiRequest<[{ description: string; timestamp: number }]>(
        "/EventDirectory/_get",
        {
          method: "POST",
          body: JSON.stringify({ event }),
        }
      ),

    list: () =>
      apiRequest<
        Array<{ event: string; description: string; timestamp: number }>
      >("/EventDirectory/_list", {
        method: "POST",
        body: JSON.stringify({}),
      }),
  },
};
