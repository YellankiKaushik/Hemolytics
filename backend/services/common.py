import base64
import json
import os
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict


APP_NAME = "Hemolytics"
APP_VERSION = "1.0.0"
SAFETY_NOTICE = (
    "AI assists coordination only; final medical eligibility and blood safety "
    "remain with authorized humans."
)


CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


def decimal_to_float_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)
    if isinstance(value, dict):
        return {key: decimal_to_float_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [decimal_to_float_safe(item) for item in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def json_response(status_code: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(decimal_to_float_safe(payload)),
    }


def ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    return json_response(200, payload)


def bad_request(message: str, details: Any = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"status": "error", "error": message}
    if details is not None:
        payload["details"] = details
    return json_response(400, payload)


def server_error(message: str, details: Any = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"status": "error", "error": message}
    if details is not None:
        payload["details"] = str(details)
    return json_response(500, payload)


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body = event.get("body")
    if body in (None, ""):
        return {}
    if isinstance(body, dict):
        return body
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON body: {exc}") from exc
    if not isinstance(parsed, dict):
        raise ValueError("JSON body must be an object.")
    return parsed


def get_env(name: str, default: Any = None) -> Any:
    return os.environ.get(name, default)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_string(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().split())


def handle_options(event: Dict[str, Any]) -> Dict[str, Any] | None:
    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method")
    if method == "OPTIONS":
        return json_response(200, {"status": "ok"})
    return None


def first_present(record: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        value = record.get(key)
        if value not in (None, ""):
            return value
    return default


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value in (None, ""):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value: Any, default: int = 0) -> int:
    try:
        if value in (None, ""):
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


# Backward-compatible aliases for the initial skeleton.
env = get_env
parse_body = parse_json_body
response = json_response


def error(status_code: int, message: str, **details: Any) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"status": "error", "error": message}
    payload.update(details)
    return json_response(status_code, payload)
