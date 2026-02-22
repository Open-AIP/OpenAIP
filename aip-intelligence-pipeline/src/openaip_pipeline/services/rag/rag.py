from __future__ import annotations

from typing import Any

from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.rag.retriever import retrieve_docs


def _format_docs(docs: list[Any]) -> str:
    return "\n\n---\n\n".join(getattr(doc, "page_content", "") for doc in docs)


def _format_sources(docs: list[Any]) -> str:
    lines: list[str] = []
    for index, doc in enumerate(docs, start=1):
        metadata = getattr(doc, "metadata", {}) or {}
        lines.append(
            f"[S{index}] source_file={metadata.get('source_file')} "
            f"project_index={metadata.get('project_index')} "
            f"aip_ref_code={metadata.get('aip_ref_code')}"
        )
    return "\n".join(lines)


def answer_with_rag(
    *,
    supabase_url: str,
    supabase_service_key: str,
    openai_api_key: str,
    embeddings_model: str,
    chat_model: str,
    question: str,
    metadata_filter: dict[str, Any] | None = None,
) -> dict[str, Any]:
    from langchain_openai import ChatOpenAI
    from supabase.client import create_client

    supabase = create_client(supabase_url, supabase_service_key)
    docs = retrieve_docs(
        supabase=supabase,
        embeddings_model=embeddings_model,
        question=question,
        k=6,
        meta_filter=metadata_filter,
    )
    system_prompt = read_text("prompts/rag/system.txt")
    llm = ChatOpenAI(model=chat_model, temperature=0)
    user_prompt = (
        f"Question:\n{question}\n\n"
        f"Context:\n{_format_docs(docs)}\n\n"
        f"Sources:\n{_format_sources(docs)}"
    )
    response = llm.invoke(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    return {
        "question": question,
        "answer": getattr(response, "content", ""),
        "sources": [getattr(doc, "metadata", {}) for doc in docs],
        "context_count": len(docs),
    }
