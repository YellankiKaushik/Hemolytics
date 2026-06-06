from typing import Any, Dict

from services.common import APP_NAME, APP_VERSION, SAFETY_NOTICE, get_env, handle_options, ok


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    options = handle_options(event)
    if options:
        return options

    return ok({
        "status": "healthy",
        "app": APP_NAME,
        "version": APP_VERSION,
        "architecture": "API Gateway + Lambda + DynamoDB + Bedrock + S3 + CloudWatch",
        "region": get_env("AWS_REGION", "us-east-1"),
        "safety": SAFETY_NOTICE,
    })
