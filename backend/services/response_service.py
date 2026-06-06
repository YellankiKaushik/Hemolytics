from typing import Any, Dict, List

from services.common import first_present, now_iso
from services.dynamodb_service import REQUESTS_TABLE, RESPONSES_TABLE, put_item, update_item


def classify_response_intent(text: str) -> str:
    normalized = (text or "").strip().lower()
    if not normalized or normalized in {"timeout", "no response", "no_response"}:
        return "no_response"
    if any(token in normalized for token in ["later", "tomorrow", "after", "evening", "another time", "reschedule"]):
        return "reschedule"
    if any(token in normalized for token in ["not possible", "unavailable", "cannot", "can't", "no"]):
        return "decline"
    if any(token in normalized for token in ["yes", "available", "i can come", "ok", "sure", "confirmed"]):
        return "confirm"
    return "no_response"


def summarize_response(text: str, intent: str) -> str:
    if intent == "confirm":
        return "Donor appears available. Coordinator must verify availability, logistics, and eligibility through the normal human process."
    if intent == "decline":
        return "Donor declined or appears unavailable. Escalate to the next ranked donor if the request remains open."
    if intent == "reschedule":
        return "Donor may be available at another time. Coordinator follow-up is needed."
    return "No clear donor availability was detected. Treat as no response until a coordinator confirms otherwise."


def next_action_for_intent(intent: str) -> str:
    return {
        "confirm": "Call donor and continue coordinator-managed eligibility and logistics checks.",
        "decline": "Escalate to the next ranked donor and keep the request open.",
        "no_response": "Escalate to the next ranked donor when the response window has passed.",
        "reschedule": "Create a coordinator follow-up and keep backup donors available.",
    }.get(intent, "Coordinator review required.")


def determine_escalation(intent: str, current_rank: int, ranked_donors: List[Dict[str, Any]]) -> Dict[str, Any]:
    if intent == "confirm":
        return {"action": "donor_confirmed", "nextDonorId": None, "requestStatus": "donor_confirmed"}
    if intent == "reschedule":
        return {"action": "needs_follow_up", "nextDonorId": None, "requestStatus": "needs_follow_up"}

    next_index = max(current_rank, 0)
    if next_index < len(ranked_donors):
        next_donor = ranked_donors[next_index]
        return {
            "action": "escalate_to_next_donor",
            "nextDonorId": next_donor.get("donor_id") or next_donor.get("user_id"),
            "requestStatus": "escalated",
        }
    return {"action": "needs_coordinator_attention", "nextDonorId": None, "requestStatus": "needs_coordinator_attention"}


def build_response_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    text = first_present(payload, "responseText", "response_text", default="")
    intent = classify_response_intent(text)
    ranked_donors = first_present(payload, "rankedDonors", "ranked_donors", default=[]) or []
    current_rank = int(first_present(payload, "currentRank", "current_rank", default=1) or 1)
    escalation = determine_escalation(intent, current_rank, ranked_donors)
    request_id = first_present(payload, "requestId", "request_id", default="")
    donor_id = first_present(payload, "donorId", "donor_id", default="")
    return {
        "response_id": first_present(payload, "responseId", "response_id", default=f"RESP-{now_iso().replace(':', '').replace('-', '').replace('.', '')}"),
        "request_id": request_id,
        "donor_id": donor_id,
        "response_text": text,
        "detected_intent": intent,
        "response_status": escalation["requestStatus"],
        "ai_summary": summarize_response(text, intent),
        "next_action": next_action_for_intent(intent),
        "escalation_triggered": escalation["action"] == "escalate_to_next_donor",
        "next_donor_id": escalation["nextDonorId"],
        "updated_request_status": escalation["requestStatus"],
        "created_at": now_iso(),
    }


def apply_response_to_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    record = build_response_record(payload)
    saved = put_item(RESPONSES_TABLE, record)
    request_update_warning = None
    if record.get("request_id"):
        try:
            update_item(
                REQUESTS_TABLE,
                {"request_id": record["request_id"]},
                "SET #status = :status, updated_at = :updated_at, last_response_id = :response_id",
                {
                    ":status": record["updated_request_status"],
                    ":updated_at": now_iso(),
                    ":response_id": record["response_id"],
                },
                {"#status": "status"},
            )
        except Exception as exc:
            request_update_warning = str(exc)
    return {**record, "saved_response": saved, "request_update_warning": request_update_warning}


# Backward-compatible aliases for the initial skeleton.
def intent_to_response_status(intent: str) -> str:
    return {
        "confirm": "donor_confirmed",
        "decline": "escalate_to_next_donor",
        "no_response": "escalate_to_next_donor",
        "reschedule": "needs_follow_up",
    }.get(intent, "needs_coordinator_attention")


suggested_action = next_action_for_intent
