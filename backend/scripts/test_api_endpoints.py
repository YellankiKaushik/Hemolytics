import argparse
import json
import sys
from typing import Any, Dict, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request_json(base_url: str, method: str, path: str, payload: Dict[str, Any] | None = None) -> Tuple[int, str]:
    url = base_url.rstrip("/") + path
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=30) as response:
            return response.status, response.read().decode("utf-8")
    except HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except URLError as exc:
        return 0, str(exc)


def snippet(text: str, max_len: int = 240) -> str:
    compact = " ".join(text.split())
    return compact[:max_len] + ("..." if len(compact) > max_len else "")


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test deployed Hemolytics API endpoints.")
    parser.add_argument("api_base_url", help="API base URL from SAM output, e.g. https://id.execute-api.us-east-1.amazonaws.com/Prod")
    args = parser.parse_args()

    tests = [
        ("GET", "/health", None),
        ("GET", "/dashboard", None),
        ("POST", "/match", {
            "requestId": "REQ-LOCAL-TEST",
            "requiredBloodGroup": "O Positive",
            "latitude": 17.385,
            "longitude": 78.4867,
            "city": "Hyderabad",
            "urgency": "Critical",
            "quantityRequired": 1,
            "neededBy": "2026-06-20",
        }),
        ("POST", "/chat", {
            "donor": {"user_id": "DONOR-001", "name": "Asha Rao", "blood_group": "O Positive"},
            "request": {
                "request_id": "REQ-LOCAL-TEST",
                "required_blood_group": "O Positive",
                "city": "Hyderabad",
                "urgency": "Critical",
                "quantity_required": 1,
            },
            "tone": "WhatsApp-style",
            "language": "English",
            "coordinatorPersona": "Priya",
        }),
        ("POST", "/response", {
            "requestId": "REQ-LOCAL-TEST",
            "donorId": "DONOR-001",
            "responseText": "Yes, I am available",
            "currentRank": 1,
            "rankedDonors": [{"rank": 1, "donor_id": "DONOR-001"}],
        }),
        ("POST", "/impact-story", {
            "donorsContacted": 25,
            "responsesReceived": 8,
            "potentialMatches": 3,
            "campaignCity": "Hyderabad",
            "bloodGroup": "O Positive",
            "patientSafeContext": "Anonymized recurring transfusion support request",
            "tone": "warm",
        }),
    ]

    failures = 0
    for method, path, payload in tests:
        status, body = request_json(args.api_base_url, method, path, payload)
        ok = 200 <= status < 300
        failures += 0 if ok else 1
        label = "PASS" if ok else "FAIL"
        print(f"{label} {method} {path} -> {status}")
        print(f"  {snippet(body)}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
