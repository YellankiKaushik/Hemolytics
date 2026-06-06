from typing import Any, Dict

from services.common import bad_request, handle_options, ok, parse_json_body, server_error
from services.dataset_service import load_dataset


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        body = parse_json_body(event)
    except ValueError as exc:
        return bad_request("Invalid request body.", str(exc))

    try:
        return ok(load_dataset(body))
    except ValueError as exc:
        return bad_request(str(exc))
    except Exception as exc:
        return server_error("Dataset load failed.", exc)
