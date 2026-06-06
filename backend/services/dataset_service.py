import csv
import io
from datetime import datetime
from typing import Any, Dict, Iterable, List, Tuple

from services.common import first_present, get_env, normalize_string, now_iso
from services.dynamodb_service import DONORS_TABLE, REQUESTS_TABLE, batch_write_items


AWS_REGION = get_env("AWS_REGION", "us-east-1")
S3_DATASET_BUCKET = get_env("S3_DATASET_BUCKET", "hemolytics-dataset-team")
S3_DATASET_KEY = get_env("S3_DATASET_KEY")

DATASET_FIELDS = [
    "user_id", "bridge_id", "role", "role_status", "bridge_status", "blood_group",
    "gender", "latitude", "longitude", "bridge_gender", "bridge_blood_group",
    "quantity_required", "last_transfusion_date", "expected_next_transfusion_date",
    "registration_date", "donor_type", "last_contacted_date", "last_donation_date",
    "next_eligible_date", "donations_till_date", "eligibility_status",
    "cycle_of_donations", "total_calls", "frequency_in_days", "status_of_bridge",
    "status", "donated_earlier", "last_bridge_donation_date",
    "calls_to_donations_ratio", "user_donation_active_status",
    "inactive_trigger_comment",
]

BLOOD_GROUP_MAP = {
    "A+": "A Positive",
    "A POSITIVE": "A Positive",
    "A-": "A Negative",
    "A NEGATIVE": "A Negative",
    "B+": "B Positive",
    "B POSITIVE": "B Positive",
    "B-": "B Negative",
    "B NEGATIVE": "B Negative",
    "AB+": "AB Positive",
    "AB POSITIVE": "AB Positive",
    "AB-": "AB Negative",
    "AB NEGATIVE": "AB Negative",
    "O+": "O Positive",
    "O POSITIVE": "O Positive",
    "O-": "O Negative",
    "O NEGATIVE": "O Negative",
    "BOMBAY": "Bombay Blood Group",
    "BOMBAY BLOOD GROUP": "Bombay Blood Group",
}


def normalize_blood_group(value: Any) -> str:
    raw = normalize_string(value)
    if not raw:
        return ""
    return BLOOD_GROUP_MAP.get(raw.upper(), raw)


def parse_safe_date(value: Any) -> str:
    raw = normalize_string(value)
    if not raw:
        return ""
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return raw


def to_number(value: Any, default: float | None = None) -> float | None:
    if value in (None, ""):
        return default
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return default


def validate_coordinates(latitude: Any, longitude: Any) -> bool:
    lat = to_number(latitude)
    lon = to_number(longitude)
    return lat is not None and lon is not None and lat != 0 and lon != 0 and -90 <= lat <= 90 and -180 <= lon <= 180


def normalize_active_status(value: Any) -> str:
    raw = normalize_string(value).lower()
    if raw in {"active", "yes", "y", "true", "1", "available"}:
        return "Active"
    if raw in {"inactive", "no", "n", "false", "0", "unavailable"}:
        return "Inactive"
    return normalize_string(value) or "Inactive"


def normalize_eligibility_status(value: Any) -> str:
    raw = normalize_string(value).lower()
    if raw in {"eligible", "yes", "y", "true", "1"}:
        return "eligible"
    if raw in {"not eligible", "ineligible", "no", "n", "false", "0"}:
        return "not_eligible"
    return raw or "unknown"


def _int_number(value: Any, default: int = 0) -> int:
    number = to_number(value)
    return int(number) if number is not None else default


def _ratio(value: Any) -> float | None:
    return to_number(value)


def clean_donor_row(row: Dict[str, Any]) -> Dict[str, Any]:
    donor: Dict[str, Any] = {}
    for field in DATASET_FIELDS:
        donor[field] = normalize_string(row.get(field))

    donor["user_id"] = normalize_string(first_present(row, "user_id", "donor_id", "id", default=""))
    donor["bridge_id"] = normalize_string(first_present(row, "bridge_id", "request_id", default=donor.get("bridge_id")))
    donor["role"] = normalize_string(donor.get("role")) or "Donor"
    donor["blood_group"] = normalize_blood_group(donor.get("blood_group"))
    donor["bridge_blood_group"] = normalize_blood_group(donor.get("bridge_blood_group"))
    donor["latitude"] = to_number(donor.get("latitude"), 0.0)
    donor["longitude"] = to_number(donor.get("longitude"), 0.0)
    donor["quantity_required"] = _int_number(donor.get("quantity_required"), 1)
    donor["donations_till_date"] = _int_number(donor.get("donations_till_date"), 0)
    donor["total_calls"] = _int_number(donor.get("total_calls"), 0)
    donor["frequency_in_days"] = _int_number(donor.get("frequency_in_days"), 0)
    donor["calls_to_donations_ratio"] = _ratio(donor.get("calls_to_donations_ratio"))
    donor["eligibility_status"] = normalize_eligibility_status(donor.get("eligibility_status"))
    donor["user_donation_active_status"] = normalize_active_status(donor.get("user_donation_active_status") or donor.get("status"))

    for date_field in [
        "last_transfusion_date", "expected_next_transfusion_date", "registration_date",
        "last_contacted_date", "last_donation_date", "next_eligible_date",
        "last_bridge_donation_date",
    ]:
        donor[date_field] = parse_safe_date(donor.get(date_field))

    donor["created_at"] = now_iso()
    donor["updated_at"] = now_iso()
    return derive_donor_fields(donor)


def _donor_experience_score(donor: Dict[str, Any]) -> float:
    return min(1.0, int(donor.get("donations_till_date") or 0) / 10)


def _engagement_score(donor: Dict[str, Any]) -> float:
    base = 1.0 if donor.get("user_donation_active_status") == "Active" else 0.3
    total_calls = int(donor.get("total_calls") or 0)
    call_signal = min(1.0, total_calls / 10)
    ratio = donor.get("calls_to_donations_ratio")
    ratio_signal = max(0.0, min(1.0, 1 / (1 + ratio))) if ratio is not None else 0.5
    return round((0.5 * base) + (0.2 * call_signal) + (0.3 * ratio_signal), 4)


def derive_donor_fields(donor: Dict[str, Any]) -> Dict[str, Any]:
    blood_group = donor.get("blood_group")
    has_valid_blood_group = bool(blood_group and blood_group.lower() != "do not know")
    has_valid_location = validate_coordinates(donor.get("latitude"), donor.get("longitude"))
    eligibility = donor.get("eligibility_status") == "eligible"
    active = donor.get("user_donation_active_status") == "Active"
    inactive = donor.get("user_donation_active_status") == "Inactive"
    has_comment = bool(donor.get("inactive_trigger_comment"))

    donor["has_valid_blood_group"] = has_valid_blood_group
    donor["has_valid_location"] = has_valid_location
    donor["is_match_eligible"] = has_valid_blood_group and has_valid_location and eligibility and active
    donor["donor_experience_score"] = round(_donor_experience_score(donor), 4)
    donor["engagement_score"] = _engagement_score(donor)
    donor["eligibility_score"] = 1.0 if eligibility else 0.0
    donor["location_quality_score"] = 1.0 if has_valid_location else 0.0
    if inactive and has_comment and int(donor.get("total_calls") or 0) >= 1:
        donor["reengagement_priority"] = "High"
    elif inactive and not has_comment:
        donor["reengagement_priority"] = "Medium"
    else:
        donor["reengagement_priority"] = "Low"
    donor["bridge_request_candidate"] = bool(
        donor.get("bridge_id") or donor.get("bridge_blood_group") or donor.get("expected_next_transfusion_date")
    )
    return donor


def _completeness_score(donor: Dict[str, Any], index: int) -> Tuple[int, int, int, int, int, int, str, int]:
    recent_date = max(donor.get("last_donation_date") or "", donor.get("last_contacted_date") or "")
    return (
        1 if donor.get("has_valid_blood_group") else 0,
        1 if donor.get("has_valid_location") else 0,
        1 if donor.get("eligibility_status") and donor.get("eligibility_status") != "unknown" else 0,
        1 if donor.get("user_donation_active_status") else 0,
        int(donor.get("donations_till_date") or 0),
        int(donor.get("total_calls") or 0),
        recent_date,
        -index,
    )


def _dedupe_donors(donors: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    best_by_user: Dict[str, Tuple[Dict[str, Any], Tuple[int, int, int, int, int, int, str, int]]] = {}
    generated_index = 0
    duplicate_count = 0

    for index, donor in enumerate(donors):
        if not donor.get("user_id"):
            generated_index += 1
            donor["user_id"] = f"DONOR-{now_iso().replace(':', '').replace('-', '').replace('.', '')}-{generated_index}"
        key = donor["user_id"]
        score = _completeness_score(donor, index)
        current = best_by_user.get(key)
        if current:
            duplicate_count += 1
        if not current or score > current[1]:
            best_by_user[key] = (donor, score)

    return [item[0] for item in best_by_user.values()], duplicate_count


def summarize_cleaning_results(raw_rows: List[Dict[str, Any]], cleaned_rows: List[Dict[str, Any]], donor_profiles: List[Dict[str, Any]], duplicate_count: int = 0) -> Dict[str, Any]:
    return {
        "rowsLoaded": len(raw_rows),
        "cleanedRows": len(cleaned_rows),
        "uniqueUsersCreated": len(donor_profiles),
        "duplicateGroupsHandled": duplicate_count,
        "duplicate_user_ids_detected": duplicate_count,
        "donor_deduplication_applied": True,
        "invalidBloodGroupsFlagged": sum(1 for donor in cleaned_rows if not donor.get("has_valid_blood_group")),
        "missingLocationFlagged": sum(1 for donor in cleaned_rows if not donor.get("has_valid_location")),
    }


def load_csv_from_s3(bucket: str, key: str) -> List[Dict[str, Any]]:
    import boto3

    obj = boto3.client("s3", region_name=AWS_REGION).get_object(Bucket=bucket, Key=key)
    text = obj["Body"].read().decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def _request_from_donor(donor: Dict[str, Any], row_index: int, used_request_ids: set[str]) -> Dict[str, Any] | None:
    if not donor.get("bridge_request_candidate"):
        return None
    bridge_id = normalize_string(donor.get("bridge_id"))
    user_id = normalize_string(donor.get("user_id")) or "UNKNOWN"
    base_request_id = bridge_id or f"REQ-{user_id}-{row_index}"
    request_id = base_request_id
    if request_id in used_request_ids:
        suffix_base = bridge_id or user_id
        request_id = f"REQ-{suffix_base}-{row_index}"
    while request_id in used_request_ids:
        request_id = f"REQ-{user_id}-{row_index}-{len(used_request_ids)}"
    used_request_ids.add(request_id)
    return {
        "request_id": request_id,
        "required_blood_group": donor.get("bridge_blood_group") or donor.get("blood_group"),
        "city": donor.get("city", ""),
        "latitude": donor.get("latitude"),
        "longitude": donor.get("longitude"),
        "urgency": "Routine",
        "quantity_required": donor.get("quantity_required") or 1,
        "needed_by": donor.get("expected_next_transfusion_date"),
        "status": donor.get("status_of_bridge") or donor.get("bridge_status") or "open",
        "source": "dataset",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }


def load_dataset_from_rows(rows: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    raw_rows = list(rows)
    cleaned = [clean_donor_row(row) for row in raw_rows]
    donor_profiles, duplicate_count = _dedupe_donors(cleaned)
    used_request_ids: set[str] = set()
    requests = [
        request
        for request in (_request_from_donor(donor, index, used_request_ids) for index, donor in enumerate(cleaned, start=1))
        if request
    ]

    donors_written = batch_write_items(DONORS_TABLE, donor_profiles, key_name="user_id") if donor_profiles else 0
    requests_written = batch_write_items(REQUESTS_TABLE, requests, key_name="request_id") if requests else 0
    summary = summarize_cleaning_results(raw_rows, cleaned, donor_profiles, duplicate_count)
    return {
        **summary,
        "donorsWrittenToHemolyticsDonors": donors_written,
        "requestsWrittenToHemolyticsRequests": requests_written,
        "loadStatus": "completed",
        "timestamp": now_iso(),
    }


def load_dataset(event_body: Dict[str, Any]) -> Dict[str, Any]:
    rows = event_body.get("rows")
    if rows is not None:
        if not isinstance(rows, list):
            raise ValueError("rows must be a list of objects.")
        return load_dataset_from_rows(rows)

    bucket = event_body.get("bucket") or event_body.get("s3Bucket") or S3_DATASET_BUCKET
    key = event_body.get("s3Key") or event_body.get("s3_key") or event_body.get("key") or S3_DATASET_KEY
    if not bucket or not key:
        raise ValueError("Provide rows or configure S3_DATASET_BUCKET and S3_DATASET_KEY.")
    return load_dataset_from_rows(load_csv_from_s3(bucket, key))
