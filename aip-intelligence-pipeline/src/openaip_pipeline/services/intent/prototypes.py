from __future__ import annotations

from .types import IntentType

INTENT_PROTOTYPES: dict[IntentType, list[str]] = {
    IntentType.GREETING: [
        "hello",
        "hi",
        "good morning",
        "good evening",
        "kumusta",
    ],
    IntentType.THANKS: [
        "thank you",
        "thanks",
        "salamat",
        "many thanks",
        "thank you for the help",
    ],
    IntentType.COMPLAINT: [
        "this is wrong",
        "your answer is incorrect",
        "that does not match the document",
        "you gave me the wrong budget",
        "this result is inaccurate",
    ],
    IntentType.CLARIFY: [
        "can you clarify",
        "what do you mean",
        "explain that again",
        "please be more specific",
        "can you rephrase the answer",
    ],
    IntentType.TOTAL_AGGREGATION: [
        "total investment",
        "total budget for 2025",
        "how much is the total AIP",
        "sum of all projects",
        "overall cost",
    ],
    IntentType.CATEGORY_AGGREGATION: [
        "total by sector",
        "budget breakdown by category",
        "show totals per fund source",
        "how much per sector",
        "compare budget by category",
    ],
    IntentType.LINE_ITEM_LOOKUP: [
        "what is ref 2025-001",
        "details of project code",
        "tell me about ref code",
        "project with reference number",
        "what is project code abc123",
    ],
    IntentType.PROJECT_DETAIL: [
        "tell me about the road repair project",
        "show project details for drainage improvement",
        "what is the timeline for this project",
        "who is implementing this project",
        "what is the expected output of the project",
    ],
    IntentType.DOCUMENT_EXPLANATION: [
        "explain this AIP document",
        "what does this section mean",
        "summarize the budget page",
        "help me understand this line in the AIP",
        "what is the purpose of this document entry",
    ],
    IntentType.OUT_OF_SCOPE: [
        "who is the contractor",
        "predict next year's budget",
        "who won the bidding",
        "what did you eat",
        "who is the mayor",
    ],
    IntentType.SCOPE_NEEDS_CLARIFICATION: [
        "use our barangay",
        "for that city",
        "check this municipality",
        "show me the budget there",
        "compare that place to ours",
    ],
}


def validate_prototypes() -> None:
    """
    Raise ValueError if:
    - any intent except UNKNOWN has no prototypes
    - any prototype list is empty
    """

    required_intents = {intent for intent in IntentType if intent is not IntentType.UNKNOWN}
    missing_intents = sorted(
        (intent.value for intent in required_intents if intent not in INTENT_PROTOTYPES)
    )
    if missing_intents:
        raise ValueError(f"Missing prototypes for intents: {', '.join(missing_intents)}")

    for intent, phrases in INTENT_PROTOTYPES.items():
        if not phrases:
            raise ValueError(f"Prototype list for {intent.value} must not be empty.")
