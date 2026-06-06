from typing import Any, Dict, Iterable, List
from decimal import Decimal

from services.common import decimal_to_float_safe, get_env, now_iso


AWS_REGION = get_env("AWS_REGION", "us-east-1")
DONORS_TABLE = get_env("DYNAMODB_DONORS_TABLE", "HemolyticsDonors")
REQUESTS_TABLE = get_env("DYNAMODB_REQUESTS_TABLE", "HemolyticsRequests")
CONVERSATIONS_TABLE = get_env("DYNAMODB_CONVERSATIONS_TABLE", "HemolyticsConversations")
RESPONSES_TABLE = get_env("DYNAMODB_RESPONSES_TABLE", "HemolyticsResponses")

PRIMARY_KEYS = {
    DONORS_TABLE: "user_id",
    REQUESTS_TABLE: "request_id",
    CONVERSATIONS_TABLE: "conversation_id",
    RESPONSES_TABLE: "response_id",
}

ID_PREFIXES = {
    DONORS_TABLE: "DONOR",
    REQUESTS_TABLE: "REQ",
    CONVERSATIONS_TABLE: "CONV",
    RESPONSES_TABLE: "RESP",
}


def _resource():
    import boto3

    return boto3.resource("dynamodb", region_name=AWS_REGION)


def get_table(table_name: str):
    return _resource().Table(table_name)


def _to_decimal(value: Any) -> Any:
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {key: _to_decimal(item) for key, item in value.items() if item is not None}
    if isinstance(value, list):
        return [_to_decimal(item) for item in value]
    return value


def _ensure_primary_key(table_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
    key_name = PRIMARY_KEYS.get(table_name)
    if not key_name or item.get(key_name):
        return item
    prefix = ID_PREFIXES.get(table_name, "ITEM")
    generated = f"{prefix}-{now_iso().replace(':', '').replace('-', '').replace('.', '')}"
    return {**item, key_name: generated}


def safe_dynamodb_item(item: Dict[str, Any], table_name: str | None = None) -> Dict[str, Any]:
    cleaned = {key: value for key, value in item.items() if value is not None}
    if table_name:
        cleaned = _ensure_primary_key(table_name, cleaned)
    return _to_decimal(cleaned)


def scan_all(table_name: str, limit: int | None = None) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    kwargs: Dict[str, Any] = {}
    if limit:
        kwargs["Limit"] = limit

    while True:
        result = get_table(table_name).scan(**kwargs)
        items.extend(result.get("Items", []))
        if limit and len(items) >= limit:
            return decimal_to_float_safe(items[:limit])
        last_key = result.get("LastEvaluatedKey")
        if not last_key:
            return decimal_to_float_safe(items)
        kwargs["ExclusiveStartKey"] = last_key


def scan_limited(
    table_name: str,
    limit: int = 1000,
    projection_expression: str | None = None,
    expression_attribute_names: Dict[str, str] | None = None,
) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    kwargs: Dict[str, Any] = {"Limit": min(max(limit, 1), 1000)}
    if projection_expression:
        kwargs["ProjectionExpression"] = projection_expression
    if expression_attribute_names:
        kwargs["ExpressionAttributeNames"] = expression_attribute_names

    while len(items) < limit:
        result = get_table(table_name).scan(**kwargs)
        items.extend(result.get("Items", []))
        last_key = result.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
        kwargs["Limit"] = min(max(limit - len(items), 1), 1000)

    return decimal_to_float_safe(items[:limit])


def put_item(table_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
    safe_item = safe_dynamodb_item(item, table_name)
    get_table(table_name).put_item(Item=safe_item)
    return decimal_to_float_safe(safe_item)


def get_item(table_name: str, key: Dict[str, Any]) -> Dict[str, Any] | None:
    result = get_table(table_name).get_item(Key=safe_dynamodb_item(key))
    item = result.get("Item")
    return decimal_to_float_safe(item) if item else None


def update_item(
    table_name: str,
    key: Dict[str, Any],
    update_expression: str,
    expression_values: Dict[str, Any],
    expression_names: Dict[str, str] | None = None,
) -> Dict[str, Any] | None:
    kwargs: Dict[str, Any] = {
        "Key": safe_dynamodb_item(key),
        "UpdateExpression": update_expression,
        "ExpressionAttributeValues": safe_dynamodb_item(expression_values),
        "ReturnValues": "ALL_NEW",
    }
    if expression_names:
        kwargs["ExpressionAttributeNames"] = expression_names
    result = get_table(table_name).update_item(**kwargs)
    attributes = result.get("Attributes")
    return decimal_to_float_safe(attributes) if attributes else None


def batch_write_items(table_name: str, items: Iterable[Dict[str, Any]], key_name: str | None = None) -> int:
    safe_items = [safe_dynamodb_item(item, table_name) for item in items]
    dedupe_key = key_name or PRIMARY_KEYS.get(table_name)
    if dedupe_key:
        deduped: Dict[Any, Dict[str, Any]] = {}
        for item in safe_items:
            key_value = item.get(dedupe_key)
            if key_value in (None, ""):
                continue
            # Keep the last item for a duplicate key as a final BatchWriteItem safety guard.
            deduped[key_value] = item
        safe_items = list(deduped.values())

    count = 0
    with get_table(table_name).batch_writer() as batch:
        for item in safe_items:
            batch.put_item(Item=item)
            count += 1
    return count


def get_donors() -> List[Dict[str, Any]]:
    return scan_all(DONORS_TABLE)


def get_requests() -> List[Dict[str, Any]]:
    return scan_all(REQUESTS_TABLE)


def save_conversation(item: Dict[str, Any]) -> Dict[str, Any]:
    return put_item(CONVERSATIONS_TABLE, item)


def save_response(item: Dict[str, Any]) -> Dict[str, Any]:
    return put_item(RESPONSES_TABLE, item)


# Backward-compatible alias for the initial skeleton.
batch_put = batch_write_items
