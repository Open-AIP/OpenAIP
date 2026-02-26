begin;

create table if not exists public.aip_line_item_embeddings (
  line_item_id uuid primary key references public.aip_line_items(id) on delete cascade,
  embedding extensions.vector(3072) not null,
  model text not null default 'text-embedding-3-large',
  created_at timestamptz not null default now()
);

-- NOTE:
-- ivfflat in pgvector cannot index vectors with >2000 dimensions.
-- We use 3072-dim embeddings, so keep this migration compatible by skipping
-- ANN index creation here. Add an ANN index later via halfvec/HNSW if needed.

alter table public.aip_line_item_embeddings enable row level security;

commit;
