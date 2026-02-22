from __future__ import annotations

from typing import Any


def retrieve_docs(
    *,
    supabase: Any,
    embeddings_model: str,
    question: str,
    k: int = 6,
    meta_filter: dict[str, Any] | None = None,
) -> list[Any]:
    from langchain_core.documents import Document
    from langchain_openai import OpenAIEmbeddings

    embeddings = OpenAIEmbeddings(model=embeddings_model)
    query_vector = embeddings.embed_query(question)
    result = supabase.rpc(
        "match_documents",
        {"query_embedding": query_vector, "filter": meta_filter or {}},
    ).execute()
    rows = (result.data or [])[:k]
    docs: list[Any] = []
    for row in rows:
        docs.append(
            Document(
                page_content=row.get("content") or "",
                metadata=row.get("metadata") or {},
            )
        )
    return docs
