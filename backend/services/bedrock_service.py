import json
from typing import Any, Dict, List

from services.common import SAFETY_NOTICE, get_env, normalize_string


BEDROCK_REGION = get_env("AWS_BEDROCK_REGION", "us-east-1")
MODEL_ID = get_env("AWS_BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
PROVIDER = "AWS Bedrock"

PRIYA_SYSTEM_PROMPT = (
    "You are Priya, a warm Blood Warriors coordinator assistant. Keep messages short, "
    "safe, and WhatsApp-style when asked. Never certify donor health, never certify "
    "blood safety, never make medical decisions, never imply guaranteed outcomes, "
    "and never include patient PII. Ask only for availability and coordinator follow-up."
)


def _bedrock_error_type(exc: Exception) -> str:
    response = getattr(exc, "response", None)
    if isinstance(response, dict):
        code = response.get("Error", {}).get("Code")
        if code:
            return str(code)
    return exc.__class__.__name__


def _log_bedrock_error(exc: Exception) -> None:
    print(
        "BEDROCK_INVOKE_ERROR: "
        f"{_bedrock_error_type(exc)}: {str(exc)} | "
        f"model_id={MODEL_ID} | "
        f"bedrock_region={BEDROCK_REGION} | "
        "operation=invoke_model | "
        "fallback_used=true"
    )


def invoke_bedrock_claude(
    messages: List[Dict[str, str]],
    system_prompt: str | None = None,
    max_tokens: int = 300,
    temperature: float = 0.7,
) -> str:
    import boto3

    client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system_prompt or PRIYA_SYSTEM_PROMPT,
        "messages": messages,
    }
    try:
        result = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(result["body"].read())
        content = payload.get("content", [])
        return "".join(part.get("text", "") for part in content if part.get("type") == "text").strip()
    except Exception as exc:
        _log_bedrock_error(exc)
        raise


def _safe_outreach_fallback(donor: Dict[str, Any], request: Dict[str, Any]) -> str:
    name = normalize_string(donor.get("name")) or "there"
    first_name = name.split(" ")[0]
    blood_group = request.get("required_blood_group") or request.get("requiredBloodGroup") or "the requested blood group"
    city = request.get("city") or "your area"
    return (
        f"Hi {first_name}, this is Priya from Blood Warriors. We have a request for {blood_group} "
        f"in {city}. Are you available to speak with a coordinator today? Final eligibility and "
        "blood safety checks will be handled by authorized staff."
    )


def generate_outreach_message(
    donor: Dict[str, Any],
    request: Dict[str, Any],
    tone: str = "WhatsApp-style",
    language: str = "English",
) -> Dict[str, Any]:
    prompt = (
        "Generate one safe donor outreach message.\n"
        f"Donor first name: {(normalize_string(donor.get('name')) or 'Donor').split(' ')[0]}\n"
        f"Blood group needed: {request.get('required_blood_group') or request.get('requiredBloodGroup')}\n"
        f"City: {request.get('city')}\n"
        f"Urgency: {request.get('urgency')}\n"
        f"Tone: {tone}\n"
        f"Language: {language}\n"
        "No patient PII. No medical approval. No blood safety certification. No guaranteed outcome."
    )
    try:
        message = invoke_bedrock_claude([{"role": "user", "content": prompt}], PRIYA_SYSTEM_PROMPT, 300, 0.7)
        return {
            "message": message or _safe_outreach_fallback(donor, request),
            "model": MODEL_ID,
            "provider": PROVIDER,
            "safetyNotice": SAFETY_NOTICE,
            "bedrock_available": bool(message),
            "fallback_used": not bool(message),
        }
    except Exception as exc:
        return {
            "message": _safe_outreach_fallback(donor, request),
            "model": MODEL_ID,
            "provider": PROVIDER,
            "safetyNotice": SAFETY_NOTICE,
            "bedrock_available": False,
            "fallback_used": True,
            "bedrock_error_type": _bedrock_error_type(exc),
        }


def _impact_fallback(payload: Dict[str, Any]) -> Dict[str, Any]:
    city = payload.get("campaignCity") or "the community"
    blood_group = payload.get("bloodGroup") or "needed blood group"
    contacted = payload.get("donorsContacted", 0)
    responses = payload.get("responsesReceived", 0)
    matches = payload.get("potentialMatches", 0)
    return {
        "awarenessMessage": (
            f"In {city}, a {blood_group} donor outreach effort contacted {contacted} community members, "
            f"with {responses} responses and {matches} potential matches for coordinator review. "
            "All details are anonymized."
        ),
        "socialPost": (
            f"{city} blood donation update: {contacted} contacted, {responses} responses, "
            f"{matches} potential matches for coordinator review. No medical claims, no patient PII."
        ),
        "coordinatorSummary": (
            f"Campaign city: {city}. Blood group focus: {blood_group}. Donors contacted: {contacted}. "
            f"Responses received: {responses}. Potential matches: {matches}. Content anonymized."
        ),
    }


def _parse_story_json(text: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    try:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            parsed = json.loads(text[start:end + 1])
            return {**fallback, **{key: parsed.get(key) for key in fallback if parsed.get(key)}}
    except json.JSONDecodeError:
        pass
    return fallback


def generate_impact_story(payload: Dict[str, Any]) -> Dict[str, Any]:
    fallback = _impact_fallback(payload)
    prompt = (
        "Create safe anonymized blood donation awareness content as JSON with keys "
        "awarenessMessage, socialPost, coordinatorSummary.\n"
        f"Donors contacted: {payload.get('donorsContacted')}\n"
        f"Responses received: {payload.get('responsesReceived')}\n"
        f"Potential matches: {payload.get('potentialMatches')}\n"
        f"Campaign city: {payload.get('campaignCity')}\n"
        f"Blood group: {payload.get('bloodGroup')}\n"
        f"Safe context: {payload.get('patientSafeContext')}\n"
        f"Tone: {payload.get('tone')}\n"
        "No patient PII, no medical approval, no blood safety certification, no guaranteed outcome."
    )
    try:
        text = invoke_bedrock_claude([{"role": "user", "content": prompt}], PRIYA_SYSTEM_PROMPT, 600, 0.7)
        generated = _parse_story_json(text, fallback) if text else fallback
        return {
            **generated,
            "safetyNotice": SAFETY_NOTICE,
            "bedrock_available": bool(text),
            "fallback_used": not bool(text),
        }
    except Exception as exc:
        return {
            **fallback,
            "safetyNotice": SAFETY_NOTICE,
            "bedrock_available": False,
            "fallback_used": True,
            "bedrock_error_type": _bedrock_error_type(exc),
        }


# Backward-compatible wrappers for the initial skeleton.
def invoke_haiku(prompt: str, max_tokens: int = 500, temperature: float = 0.4) -> str:
    return invoke_bedrock_claude([{"role": "user", "content": prompt}], PRIYA_SYSTEM_PROMPT, max_tokens, temperature)


def parse_json_or_fallback(text: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    return _parse_story_json(text, fallback)
