import type { ISODateTime, UUID } from "../primitives";

/**
 * Supabase may serialize vector columns as number[] or a string form.
 */
export type Vector3072 = number[] | string;

export type AipChunkEmbeddingRow = {
  id: UUID;
  chunk_id: UUID;
  aip_id: UUID;
  embedding: Vector3072;
  embedding_model: string;
  created_at: ISODateTime;
};

