import type { ISODateTime, Json, UUID } from "../primitives";

export type AipChunkRow = {
  id: UUID;
  aip_id: UUID;
  uploaded_file_id: UUID | null;
  run_id: UUID | null;
  chunk_index: number;
  chunk_text: string;
  metadata: Json;
  created_at: ISODateTime;
};

