from __future__ import annotations

from typing import Any


def retrieve_docs(
    *,
    supabase: Any,
    embeddings_model: str,
    question: str,
    k: int = 8,
    min_similarity: float = 0.0,
    retrieval_scope: dict[str, Any] | None = None,
) -> list[Any]:
    from langchain_core.documents import Document
    from langchain_openai import OpenAIEmbeddings

    embeddings = OpenAIEmbeddings(model=embeddings_model)
    query_vector = embeddings.embed_query(question)
    scope = retrieval_scope or {"mode": "global", "targets": []}
    scope_mode = str(scope.get("mode") or "global").strip().lower()
    targets = scope.get("targets") if isinstance(scope.get("targets"), list) else []

    own_barangay_id: str | None = None
    if scope_mode == "own_barangay":
        for target in targets:
            if not isinstance(target, dict):
                continue
            if str(target.get("scope_type") or "").lower() == "barangay":
                scope_id = str(target.get("scope_id") or "").strip()
                if scope_id:
                    own_barangay_id = scope_id
                    break

    result = supabase.rpc(
        "match_published_aip_chunks",
        {
            "query_embedding": query_vector,
            "match_count": k,
            "min_similarity": min_similarity,
            "scope_mode": scope_mode,
            "own_barangay_id": own_barangay_id,
            "scope_targets": targets,
        },
    ).execute()
    rows = (result.data or [])[:k]
    docs: list[Any] = []
    for row in rows:
        metadata = {
            "source_id": row.get("source_id"),
            "chunk_id": row.get("chunk_id"),
            "aip_id": row.get("aip_id"),
            "fiscal_year": row.get("fiscal_year"),
            "published_at": row.get("published_at"),
            "scope_type": row.get("scope_type"),
            "scope_id": row.get("scope_id"),
            "scope_name": row.get("scope_name"),
            "similarity": row.get("similarity"),
            "metadata": row.get("metadata") or {},
        }
        docs.append(
            Document(
                page_content=row.get("content") or "",
                metadata=metadata,
            )
        )
    return docs
