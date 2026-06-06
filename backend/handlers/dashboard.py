from collections import Counter
from typing import Any, Dict

from services.common import get_env, handle_options, ok, server_error
from services.dynamodb_service import DONORS_TABLE, REQUESTS_TABLE, scan_limited


DONOR_PROJECTION_NAMES = {
    "#user_id": "user_id",
    "#role": "role",
    "#blood_group": "blood_group",
    "#eligibility_status": "eligibility_status",
    "#active_status": "user_donation_active_status",
    "#has_valid_location": "has_valid_location",
    "#has_valid_blood_group": "has_valid_blood_group",
    "#reengagement_priority": "reengagement_priority",
    "#is_match_eligible": "is_match_eligible",
    "#donations_till_date": "donations_till_date",
    "#total_calls": "total_calls",
    "#donor_type": "donor_type",
    "#latitude": "latitude",
    "#longitude": "longitude",
}

REQUEST_PROJECTION_NAMES = {
    "#request_id": "request_id",
    "#bridge_id": "bridge_id",
    "#bridge_status": "bridge_status",
    "#status_of_bridge": "status_of_bridge",
    "#bridge_blood_group": "bridge_blood_group",
    "#quantity_required": "quantity_required",
    "#expected_next_transfusion_date": "expected_next_transfusion_date",
}


def _scan_dashboard_sample(table_name: str, limit: int, names: Dict[str, str]) -> list[Dict[str, Any]]:
    projection = ", ".join(names.keys())
    try:
        return scan_limited(table_name, limit=limit, projection_expression=projection, expression_attribute_names=names)
    except Exception:
        return scan_limited(table_name, limit=limit)


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"true", "1", "yes", "y"}


def _safe_int(value: Any) -> int:
    try:
        if value in (None, ""):
            return 0
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        donors_limit = int(get_env("DASHBOARD_SCAN_LIMIT", "1000"))
        requests_limit = int(get_env("DASHBOARD_REQUEST_SCAN_LIMIT", "500"))
        donors = _scan_dashboard_sample(DONORS_TABLE, donors_limit, DONOR_PROJECTION_NAMES)
        requests = _scan_dashboard_sample(REQUESTS_TABLE, requests_limit, REQUEST_PROJECTION_NAMES)
    except Exception as exc:
        return server_error("Unable to read dashboard data from DynamoDB.", exc)

    active_donors = [d for d in donors if d.get("user_donation_active_status") == "Active"]
    inactive_donors = [d for d in donors if d.get("user_donation_active_status") == "Inactive"]
    eligible_donors = [d for d in donors if d.get("eligibility_status") == "eligible"]
    missing_location = [d for d in donors if not _truthy(d.get("has_valid_location"))]
    location_coverage = round(((len(donors) - len(missing_location)) / len(donors)) * 100, 1) if donors else 0
    blood_group_counts = Counter(d.get("blood_group") or "Unknown" for d in donors)
    role_counts = Counter(d.get("role") or "Unknown" for d in donors)
    top_eligible_pool = [
        donor for donor in eligible_donors
        if donor.get("user_donation_active_status") == "Active" and _truthy(donor.get("has_valid_blood_group"))
    ][:10]
    active_bridge_statuses = {"open", "escalated", "needs_follow_up", "routine", "active", "pending"}

    return ok({
        "totalRecords": len(donors),
        "uniqueUsers": len({d.get("user_id") for d in donors if d.get("user_id")}),
        "totalDonorLikeUsers": sum(1 for d in donors if (d.get("role") or "").lower() in {"donor", "volunteer"}),
        "activeDonors": len(active_donors),
        "inactiveDonors": len(inactive_donors),
        "eligibleDonors": len(eligible_donors),
        "notEligibleDonors": sum(1 for d in donors if d.get("eligibility_status") != "eligible"),
        "missingBloodGroup": sum(1 for d in donors if not _truthy(d.get("has_valid_blood_group"))),
        "missingLocation": len(missing_location),
        "locationCoveragePercent": location_coverage,
        "reengagementCandidates": sum(1 for d in donors if d.get("reengagement_priority") in {"High", "Medium"}),
        "activeBridgeCount": sum(
            1 for req in requests
            if str(req.get("status_of_bridge") or req.get("bridge_status") or "open").lower() in active_bridge_statuses
        ),
        "bloodGroupDistribution": [{"group": group, "count": count} for group, count in blood_group_counts.items()],
        "roleDistribution": [{"role": role, "count": count} for role, count in role_counts.items()],
        "topEligibleDonorPool": top_eligible_pool,
        "recentActivity": [
            {
                "time": "now",
                "event": f"Dashboard sampled {len(donors)} donors and {len(requests)} requests",
                "type": "system",
            }
        ],
        "sampledRecords": len(donors),
        "dashboardMode": "sampled",
    })
