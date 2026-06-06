import math
from typing import Any, Dict, List

from services.common import first_present, normalize_string, to_float, to_int


EARTH_RADIUS_KM = 6371


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def blood_group_matches(donor_blood_group: Any, required_blood_group: Any) -> bool:
    return normalize_string(donor_blood_group).lower() == normalize_string(required_blood_group).lower()


def _valid_coordinates(lat: Any, lon: Any) -> bool:
    latitude = to_float(lat)
    longitude = to_float(lon)
    return latitude != 0 and longitude != 0 and -90 <= latitude <= 90 and -180 <= longitude <= 180


def calculate_proximity_score(distance_km: float, max_radius_km: float = 100) -> float:
    return max(0.0, min(1.0, 1 - (distance_km / max_radius_km)))


def _donor_experience_score(donor: Dict[str, Any]) -> float:
    existing = donor.get("donor_experience_score")
    if existing not in (None, ""):
        return to_float(existing)
    return min(1.0, to_int(donor.get("donations_till_date")) / 10)


def _engagement_score(donor: Dict[str, Any]) -> float:
    existing = donor.get("engagement_score")
    if existing not in (None, ""):
        return to_float(existing)
    base = 1.0 if donor.get("user_donation_active_status") == "Active" else 0.3
    call_signal = min(1.0, to_int(donor.get("total_calls")) / 10)
    ratio_present = donor.get("calls_to_donations_ratio") not in (None, "")
    ratio = to_float(donor.get("calls_to_donations_ratio"))
    ratio_signal = max(0.0, min(1.0, 1 / (1 + ratio))) if ratio_present else 0.5
    return (0.5 * base) + (0.2 * call_signal) + (0.3 * ratio_signal)


def _eligibility_score(donor: Dict[str, Any]) -> float:
    existing = donor.get("eligibility_score")
    if existing not in (None, ""):
        return to_float(existing)
    return 1.0 if donor.get("eligibility_status") == "eligible" else 0.0


def _location_quality_score(donor: Dict[str, Any]) -> float:
    existing = donor.get("location_quality_score")
    if existing not in (None, ""):
        return to_float(existing)
    return 1.0 if _valid_coordinates(donor.get("latitude"), donor.get("longitude")) else 0.0


def calculate_confidence_label(donor: Dict[str, Any]) -> str:
    complete = [
        bool(donor.get("blood_group")),
        _valid_coordinates(donor.get("latitude"), donor.get("longitude")),
        donor.get("eligibility_status") == "eligible",
        donor.get("user_donation_active_status") == "Active",
        to_int(donor.get("donations_till_date")) > 0,
        to_int(donor.get("total_calls")) > 0,
    ]
    count = sum(1 for item in complete if item)
    if count >= 5:
        return "High"
    if count >= 3:
        return "Medium"
    return "Low"


def _score_donor(donor: Dict[str, Any], match_request: Dict[str, Any], relax_active_status: bool = False) -> Dict[str, Any] | None:
    required = first_present(match_request, "requiredBloodGroup", "required_blood_group", default="")
    request_lat = to_float(match_request.get("latitude"))
    request_lon = to_float(first_present(match_request, "longitude", "lon", "lng", default=0))

    if not donor.get("blood_group") or str(donor.get("blood_group")).lower() == "do not know":
        return None
    if not blood_group_matches(donor.get("blood_group"), required):
        return None
    if donor.get("eligibility_status") != "eligible":
        return None
    if not relax_active_status and donor.get("user_donation_active_status") != "Active":
        return None
    if not _valid_coordinates(donor.get("latitude"), donor.get("longitude")):
        return None

    distance = haversine_distance_km(request_lat, request_lon, to_float(donor.get("latitude")), to_float(donor.get("longitude")))
    proximity = calculate_proximity_score(distance)
    engagement = _engagement_score(donor)
    experience = _donor_experience_score(donor)
    eligibility = _eligibility_score(donor)
    location_quality = _location_quality_score(donor)
    raw_score = (
        (proximity * 0.30)
        + (engagement * 0.25)
        + (experience * 0.15)
        + (eligibility * 0.15)
        + (location_quality * 0.15)
    )
    score = round(max(0, min(1, raw_score)) * 100)
    distance_km = round(distance, 1)
    donor_id = donor.get("donor_id") or donor.get("user_id")
    reason = (
        f"Matched {donor.get('blood_group')}, eligible, {donor.get('user_donation_active_status')}, "
        f"{distance_km} km away, {to_int(donor.get('donations_till_date'))} prior donations, "
        f"{'strong' if engagement >= 0.7 else 'moderate' if engagement >= 0.45 else 'limited'} engagement score."
    )
    action = (
        "Prioritized for coordinator review; verify availability, logistics, and eligibility through human process."
        if not relax_active_status
        else "Backup candidate for coordinator review only; active status needs human confirmation."
    )
    return {
        "rank": 0,
        "donor_id": donor_id,
        "user_id": donor.get("user_id") or donor_id,
        "blood_group": donor.get("blood_group"),
        "distance_km": distance_km,
        "eligibility_status": donor.get("eligibility_status"),
        "active_status": donor.get("user_donation_active_status"),
        "donations_till_date": to_int(donor.get("donations_till_date")),
        "total_calls": to_int(donor.get("total_calls")),
        "calls_to_donations_ratio": to_float(donor.get("calls_to_donations_ratio")),
        "donor_type": donor.get("donor_type"),
        "score": score,
        "match_score": score,
        "confidence_label": calculate_confidence_label(donor),
        "reason_for_ranking": reason,
        "reason": reason,
        "recommended_action": action,
    }


def rank_donors(donors: List[Dict[str, Any]], match_request: Dict[str, Any]) -> List[Dict[str, Any]]:
    strict_matches = [match for donor in donors if (match := _score_donor(donor, match_request, False))]
    strict_matches.sort(key=lambda item: item["score"], reverse=True)
    matches = strict_matches[:5]

    if len(matches) < 5:
        existing_ids = {match["user_id"] for match in matches}
        relaxed = [
            match for donor in donors
            if (donor.get("user_id") not in existing_ids and (match := _score_donor(donor, match_request, True)))
        ]
        relaxed.sort(key=lambda item: item["score"], reverse=True)
        matches.extend(relaxed[: 5 - len(matches)])

    return [{**match, "rank": index + 1} for index, match in enumerate(matches[:5])]


def rank_donors_for_request(donors: List[Dict[str, Any]], request: Dict[str, Any], top_n: int = 5) -> List[Dict[str, Any]]:
    return rank_donors(donors, request)[:top_n]


def reengagement_priority(donor: Dict[str, Any]) -> str:
    inactive = donor.get("user_donation_active_status") == "Inactive"
    if inactive and donor.get("inactive_trigger_comment") and to_int(donor.get("total_calls")) >= 1:
        return "High"
    if inactive and not donor.get("inactive_trigger_comment"):
        return "Medium"
    return "Low"


def bridge_request_candidate(donor: Dict[str, Any]) -> bool:
    return bool(donor.get("bridge_id") or donor.get("bridge_blood_group") or donor.get("expected_next_transfusion_date"))
