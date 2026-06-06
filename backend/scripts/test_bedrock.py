import json
import os

import boto3


REGION = os.environ.get("AWS_BEDROCK_REGION", "us-east-1")
MODEL_ID = os.environ.get("AWS_BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")


def error_type(exc: Exception) -> str:
    response = getattr(exc, "response", None)
    if isinstance(response, dict):
        code = response.get("Error", {}).get("Code")
        if code:
            return str(code)
    return exc.__class__.__name__


def main() -> int:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 50,
        "temperature": 0.2,
        "messages": [
            {"role": "user", "content": "Say hello from Hemolytics."}
        ],
    }

    print(f"region={REGION}")
    print(f"model_id={MODEL_ID}")
    print("operation=invoke_model")

    try:
        client = boto3.client("bedrock-runtime", region_name=REGION)
        result = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(result["body"].read())
        content = payload.get("content", [])
        text = "".join(part.get("text", "") for part in content if part.get("type") == "text").strip()
        print("success=true")
        print(f"response={text}")
        return 0
    except Exception as exc:
        print("success=false")
        print(f"exception_class={error_type(exc)}")
        print(f"exception_message={exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
