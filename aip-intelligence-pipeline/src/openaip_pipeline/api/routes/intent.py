from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from openaip_pipeline.services.intent import IntentRouter

MAX_INTENT_TEXT_LENGTH = 2000

router = APIRouter(prefix="/intent", tags=["intent"])

_INTENT_ROUTER = IntentRouter()


class IntentClassifyRequest(BaseModel):
    text: str


@router.post("/classify")
def classify_intent(payload: IntentClassifyRequest) -> dict[str, str | float | None]:
    text = payload.text
    # Truncate oversized payloads instead of rejecting them to keep the endpoint easy to consume.
    if len(text) > MAX_INTENT_TEXT_LENGTH:
        text = text[:MAX_INTENT_TEXT_LENGTH]

    result = _INTENT_ROUTER.route(text)
    return result.to_dict()
