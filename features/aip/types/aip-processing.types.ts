export type PipelineStageUi = "extract" | "validate" | "summarize" | "categorize";

export type PipelineStatusUi = "queued" | "running" | "succeeded" | "failed";

export type AipProcessingRunView = {
  runId: string;
  aipId: string;
  status: PipelineStatusUi;
  stage: PipelineStageUi;
  progressByStage: Record<PipelineStageUi, number>;
  message: string;
  updatedAt: string;
};
