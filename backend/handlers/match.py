import time
from typing import Any, Dict

from services.common import bad_request, get_env, handle_options, ok, parse_json_body, server_error
from services.dynamodb_service import get_donors
from services.scoring_service import rank_donors


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    try:
        body = parse_json_body(event)
    except ValueError as exc:
        return bad_request("Invalid request body.", str(exc))

    if not (body.get("requiredBloodGroup") or body.get("required_blood_group")):
        return bad_request("requiredBloodGroup is required.")
    if body.get("latitude") is None or body.get("longitude") is None:
        return bad_request("latitude and longitude are required.")

    try:
        start = time.perf_counter()
        donors = get_donors()
        top_n = int(get_env("MATCH_TOP_N_DONORS", "5"))
        results = rank_donors(donors, body)[:top_n]
        match_time_ms = round((time.perf_counter() - start) * 1000)
        eligible_candidates = sum(
            1 for donor in donors
            if donor.get("eligibility_status") == "eligible"
            and donor.get("user_donation_active_status") == "Active"
            and donor.get("has_valid_blood_group")
            and donor.get("has_valid_location")
        )
        return ok({
            "results": results,
            "matchTimeMs": match_time_ms,
            "totalCandidates": len(donors),
            "eligibleCandidates": eligible_candidates,
        })
    except Exception as exc:
        return server_error("SmartMatch failed.", exc)
