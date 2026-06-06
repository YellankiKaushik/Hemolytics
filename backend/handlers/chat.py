from typing import Any, Dict

from services.bedrock_service import generate_outreach_message
from services.common import bad_request, handle_options, now_iso, ok, parse_json_body, server_error
from services.dynamodb_service import save_conversation


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        body = parse_json_body(event)
    except ValueError as exc:
        return bad_request("Invalid request body.", str(exc))

    donor = body.get("donor") or {}
    request = body.get("request") or {}
    if not donor or not request:
        return bad_request("donor and request are required.")

    try:
        generated = generate_outreach_message(
            donor,
            request,
            tone=body.get("tone", "WhatsApp-style"),
            language=body.get("language", "English"),
        )
        conversation = save_conversation({
            "type": "outreach",
            "request_id": request.get("request_id") or request.get("requestId"),
            "donor_id": donor.get("user_id") or donor.get("donor_id"),
            "message": generated["message"],
            "model": generated["model"],
            "provider": generated["provider"],
            "bedrock_available": generated["bedrock_available"],
            "fallback_used": generated["fallback_used"],
            "created_at": now_iso(),
        })
        return ok({
            **generated,
            "conversationId": conversation.get("conversation_id"),
        })
    except Exception as exc:
        return server_error("Outreach generation or conversation save failed.", exc)
