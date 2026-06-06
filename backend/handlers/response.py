from typing import Any, Dict

from services.common import bad_request, handle_options, ok, parse_json_body, server_error
from services.response_service import apply_response_to_request


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        body = parse_json_body(event)
    except ValueError as exc:
        return bad_request("Invalid request body.", str(exc))

    if not (body.get("requestId") or body.get("request_id")):
        return bad_request("requestId is required.")
    if not (body.get("donorId") or body.get("donor_id")):
        return bad_request("donorId is required.")

    try:
        record = apply_response_to_request(body)
        return ok({
            "detectedIntent": record["detected_intent"],
            "responseStatus": record["response_status"],
            "aiSummary": record["ai_summary"],
            "nextAction": record["next_action"],
            "escalationTriggered": record["escalation_triggered"],
            "nextDonorId": record["next_donor_id"],
            "updatedRequestStatus": record["updated_request_status"],
        })
    except Exception as exc:
        return server_error("Response handling failed.", exc)
