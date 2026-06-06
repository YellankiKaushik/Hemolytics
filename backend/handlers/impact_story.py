from typing import Any, Dict

from services.bedrock_service import generate_impact_story
from services.common import bad_request, handle_options, ok, parse_json_body, server_error


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        body = parse_json_body(event)
    except ValueError as exc:
        return bad_request("Invalid request body.", str(exc))

    try:
        return ok(generate_impact_story(body))
    except Exception as exc:
        return server_error("Impact story generation failed.", exc)
