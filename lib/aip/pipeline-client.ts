import type { AipProcessingRunView } from "@/features/aip/types";

async function handleResponse(response: Response) {
  if (!response.ok) {
    throw new Error("Pipeline request failed.");
  }
  return response.json() as Promise<AipProcessingRunView>;
}

export async function createRun(aipId: string): Promise<AipProcessingRunView> {
  const response = await fetch("/api/aip/pipeline/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aipId }),
  });
  return handleResponse(response);
}

export async function getRun(runId: string): Promise<AipProcessingRunView> {
  const response = await fetch(`/api/aip/pipeline/run/${runId}`, {
    method: "GET",
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function getRunByAip(aipId: string): Promise<AipProcessingRunView | null> {
  const response = await fetch(`/api/aip/pipeline/by-aip/${aipId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (response.status === 404) return null;
  return handleResponse(response);
}
