import type {
  CreateProjectFeedbackPayload,
  CreateProjectFeedbackReplyPayload,
  CreateProjectFeedbackResponse,
  ListProjectFeedbackResponse,
  ProjectFeedbackApiErrorPayload,
} from "./feedback.types";

export class ProjectFeedbackRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readErrorMessage(payload: ProjectFeedbackApiErrorPayload | null): string {
  const message = payload?.error ?? payload?.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }
  return "Request failed.";
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const payload = await parseJson<T & ProjectFeedbackApiErrorPayload>(response);

  if (!response.ok) {
    throw new ProjectFeedbackRequestError(response.status, readErrorMessage(payload));
  }

  if (!payload) {
    throw new ProjectFeedbackRequestError(500, "Missing response payload.");
  }

  return payload as T;
}

export async function listProjectFeedback(
  projectId: string
): Promise<ListProjectFeedbackResponse> {
  const params = new URLSearchParams({ projectId });
  return requestJson<ListProjectFeedbackResponse>(
    `/api/citizen/feedback?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function createProjectFeedback(
  payload: CreateProjectFeedbackPayload
): Promise<CreateProjectFeedbackResponse> {
  return requestJson<CreateProjectFeedbackResponse>("/api/citizen/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function createProjectFeedbackReply(
  payload: CreateProjectFeedbackReplyPayload
): Promise<CreateProjectFeedbackResponse> {
  return requestJson<CreateProjectFeedbackResponse>("/api/citizen/feedback/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
