import "server-only";

import type { PipelineChatAnswer, RetrievalScopePayload } from "./types";

const DEFAULT_TIMEOUT_MS = 30000;

function requireEnv(name: "PIPELINE_API_BASE_URL" | "PIPELINE_INTERNAL_TOKEN"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function parsePipelineResponse(payload: unknown): PipelineChatAnswer {
  if (!payload || typeof payload !== "object") {
    throw new Error("Pipeline response is invalid.");
  }

  const data = payload as Record<string, unknown>;
  const answer = typeof data.answer === "string" ? data.answer : "";
  const refused = typeof data.refused === "boolean" ? data.refused : false;
  const citations = Array.isArray(data.citations) ? data.citations : [];
  const retrievalMeta =
    data.retrieval_meta && typeof data.retrieval_meta === "object"
      ? (data.retrieval_meta as PipelineChatAnswer["retrieval_meta"])
      : { reason: "unknown" as const };

  if (!answer.trim()) {
    throw new Error("Pipeline response missing answer.");
  }

  return {
    answer,
    refused,
    citations: citations as PipelineChatAnswer["citations"],
    retrieval_meta: retrievalMeta,
  };
}

function parseEmbeddingResponse(payload: unknown): {
  embedding: number[];
  model: string;
  dimensions: number;
} {
  if (!payload || typeof payload !== "object") {
    throw new Error("Embedding response is invalid.");
  }

  const data = payload as Record<string, unknown>;
  const embedding = Array.isArray(data.embedding) ? data.embedding : [];
  if (!embedding.length || !embedding.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Embedding response missing numeric vector.");
  }

  const model = typeof data.model === "string" && data.model.trim() ? data.model : "unknown";
  const dimensions =
    typeof data.dimensions === "number" && Number.isFinite(data.dimensions)
      ? data.dimensions
      : embedding.length;

  return {
    embedding: embedding as number[],
    model,
    dimensions,
  };
}

export async function requestPipelineChatAnswer(input: {
  question: string;
  retrievalScope: RetrievalScopePayload;
  topK?: number;
  minSimilarity?: number;
  timeoutMs?: number;
}): Promise<PipelineChatAnswer> {
  const baseUrl = requireEnv("PIPELINE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("PIPELINE_INTERNAL_TOKEN");
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/v1/chat/answer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pipeline-token": token,
      },
      body: JSON.stringify({
        question: input.question,
        retrieval_scope: input.retrievalScope,
        top_k: input.topK ?? 8,
        min_similarity: input.minSimilarity ?? 0.3,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response
      .json()
      .catch(() => ({ message: "Failed to parse pipeline response." }));

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail: unknown }).detail)
          : response.statusText;
      throw new Error(`Pipeline chat request failed (${response.status}): ${detail}`);
    }

    return parsePipelineResponse(payload);
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestPipelineQueryEmbedding(input: {
  text: string;
  modelName?: string;
  timeoutMs?: number;
}): Promise<{ embedding: number[]; model: string; dimensions: number }> {
  const baseUrl = requireEnv("PIPELINE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("PIPELINE_INTERNAL_TOKEN");
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/v1/chat/embed-query`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-pipeline-token": token,
      },
      body: JSON.stringify({
        text: input.text,
        model_name: input.modelName,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response
      .json()
      .catch(() => ({ message: "Failed to parse embedding response." }));

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail: unknown }).detail)
          : response.statusText;
      throw new Error(`Pipeline embedding request failed (${response.status}): ${detail}`);
    }

    return parseEmbeddingResponse(payload);
  } finally {
    clearTimeout(timeout);
  }
}
