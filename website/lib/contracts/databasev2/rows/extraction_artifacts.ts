import type { PipelineStage } from "../enums";
import type { ISODateTime, Json, UUID } from "../primitives";

export type ExtractionArtifactRow = {
  id: UUID;
  run_id: UUID;
  aip_id: UUID;
  artifact_type: PipelineStage;
  artifact_json: Json | null;
  artifact_text: string | null;
  created_at: ISODateTime;
};
