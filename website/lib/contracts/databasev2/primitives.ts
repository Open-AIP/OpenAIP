export type UUID = string;

/**
 * Postgres timestamptz serialized as ISO string via Supabase/JSON.
 * Example: "2026-02-01T14:22:11.123Z"
 */
export type ISODateTime = string;

/**
 * Lightweight Json type compatible with Supabase generated types.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
