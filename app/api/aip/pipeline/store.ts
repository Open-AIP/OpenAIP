import type {
  AipProcessingRunView,
  PipelineStageUi,
  PipelineStatusUi,
} from "@/lib/types/viewmodels/aip-processing.vm";

type RunRecord = {
  runId: string;
  aipId: string;
  createdAt: number;
};

const runs = new Map<string, RunRecord>();

const STAGES: PipelineStageUi[] = [
  "extract",
  "validate",
  "summarize",
  "categorize",
  "embed",
];
const STAGE_DURATIONS = [6000, 5000, 5000, 6000, 5000];
const QUEUE_MS = 500;

const getStageMessage = (stage: PipelineStageUi) => {
  switch (stage) {
    case "extract":
      return "Extracting data from document...";
    case "validate":
      return "Validating extracted information...";
    case "summarize":
      return "Generating summary and insights...";
    case "embed":
      return "Generating semantic embeddings...";
    default:
      return "Categorizing projects and entries...";
  }
};

const buildView = (record: RunRecord): AipProcessingRunView => {
  const elapsed = Date.now() - record.createdAt;
  const progressByStage: Record<PipelineStageUi, number> = {
    extract: 0,
    validate: 0,
    summarize: 0,
    categorize: 0,
    embed: 0,
  };

  let remaining = Math.max(0, elapsed - QUEUE_MS);
  let currentStageIndex = 0;

  STAGES.forEach((stage, index) => {
    const duration = STAGE_DURATIONS[index];
    if (remaining <= 0) {
      progressByStage[stage] = 0;
      return;
    }
    if (remaining >= duration) {
      progressByStage[stage] = 100;
      remaining -= duration;
      currentStageIndex = Math.min(index + 1, STAGES.length - 1);
      return;
    }
    progressByStage[stage] = Math.round((remaining / duration) * 100);
    remaining = 0;
    currentStageIndex = index;
  });

  const isComplete = STAGES.every((stage) => progressByStage[stage] >= 100);
  const stage = isComplete ? "embed" : STAGES[currentStageIndex];
  const status: PipelineStatusUi = isComplete
    ? "succeeded"
    : elapsed < QUEUE_MS
      ? "queued"
      : "running";

  return {
    runId: record.runId,
    aipId: record.aipId,
    status,
    stage,
    progressByStage,
    message: getStageMessage(stage),
    updatedAt: new Date().toISOString(),
  };
};

const findLatestRunByAip = (aipId: string) => {
  const records = Array.from(runs.values()).filter((run) => run.aipId === aipId);
  if (!records.length) return null;
  return records.sort((a, b) => b.createdAt - a.createdAt)[0];
};

export const createRunRecord = (aipId: string) => {
  const existing = findLatestRunByAip(aipId);
  if (existing) {
    const view = buildView(existing);
    if (view.status !== "succeeded") return view;
  }

  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: RunRecord = {
    runId,
    aipId,
    createdAt: Date.now(),
  };
  runs.set(runId, record);
  return buildView(record);
};

export const getRunRecord = (runId: string) => {
  const record = runs.get(runId);
  if (!record) return null;
  return buildView(record);
};

export const getRunByAip = (aipId: string) => {
  const record = findLatestRunByAip(aipId);
  if (!record) return null;
  return buildView(record);
};
