from __future__ import annotations

import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from supabase.client import create_client, Client

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or not OPENAI_API_KEY:
    raise RuntimeError("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

EMBED_MODEL = "text-embedding-3-large"   # must match vector(3072)
CHAT_MODEL = "gpt-5.2"

embeddings = OpenAIEmbeddings(model=EMBED_MODEL)
llm = ChatOpenAI(model=CHAT_MODEL, temperature=0)

# Optional metadata filter (must match your match_documents function: metadata @> filter)
FILTER = {"lgu": "Cabuyao", "year": 2025, "type": "aip_projects"}


prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are a RAG assistant. Answer ONLY using the provided context. "
     "If the context does not contain the answer, say you can't find it in the sources. "
     "Cite sources as [S#] using the source list."),
    ("user", "Question:\n{question}\n\nContext:\n{context}\n\nSources:\n{sources}")
])


def format_docs(docs: List[Document]) -> str:
    return "\n\n---\n\n".join(d.page_content for d in docs)


def format_sources(docs: List[Document]) -> str:
    out = []
    for i, d in enumerate(docs, start=1):
        m = d.metadata or {}
        out.append(
            f"[S{i}] source_file={m.get('source_file')} "
            f"project_index={m.get('project_index')} "
            f"aip_ref_code={m.get('aip_ref_code')}"
        )
    return "\n".join(out)


def retrieve_docs(question: str, k: int = 6, meta_filter: Dict[str, Any] | None = None) -> List[Document]:
    # 1) embed the question
    qvec = embeddings.embed_query(question)

    # 2) call your Supabase RPC: match_documents(query_embedding, filter)
    # NOTE: Your SQL function orders by similarity; we apply limit on client-side to stay SDK-compatible.
    res = supabase.rpc("match_documents", {
        "query_embedding": qvec,
        "filter": meta_filter or {},
    }).execute()

    rows = res.data or []
    rows = rows[:k]

    # 3) convert returned rows -> LangChain Documents
    docs: List[Document] = []
    for r in rows:
        docs.append(Document(
            page_content=r.get("content") or "",
            metadata=r.get("metadata") or {}
        ))
    return docs


def retrieve(question: str):
    docs = retrieve_docs(question, k=6, meta_filter=FILTER)
    return {
        "question": question,
        "context": format_docs(docs),
        "sources": format_sources(docs),
    }


chain = RunnableLambda(retrieve) | prompt | llm


if __name__ == "__main__":
    q = "Integral of x squared"
    resp = chain.invoke(q)
    print(resp.content)
