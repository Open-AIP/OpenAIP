import type { ISODateTime, UUID } from "../primitives";

export type UploadedFileRow = {
  id: UUID;
  aip_id: UUID;
  bucket_id: string;
  object_name: string;
  original_file_name: string | null;
  mime_type: string;
  size_bytes: number | null;
  sha256_hex: string | null;
  is_current: boolean;
  uploaded_by: UUID;
  created_at: ISODateTime;
};

