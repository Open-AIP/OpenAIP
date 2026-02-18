import type { PipelineStage, PipelineStatus } from "@/lib/contracts/databasev2";

export type PipelineStageUi = PipelineStage;

export type PipelineStatusUi = PipelineStatus;

export type AipProcessingRunView = {
  runId: string;
  aipId: string;
  status: PipelineStatusUi;
  stage: PipelineStageUi;
  progressByStage: Record<PipelineStageUi, number>;
  message: string;
  updatedAt: string;
};
