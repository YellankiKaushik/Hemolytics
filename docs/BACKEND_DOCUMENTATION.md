# Hemolytics Backend Documentation

## Overview

The Hemolytics backend is an AWS serverless application deployed with SAM. It exposes API Gateway routes backed by Lambda functions and uses DynamoDB, S3, Bedrock, and CloudWatch.

Source root:

```text
backend/
```

SAM template:

```text
backend/template.yaml
```

## Runtime

- Python 3.11
- AWS Lambda proxy integration
- `boto3` for AWS services
- `us-east-1` default region

`backend/requirements.txt` is minimal because Lambda includes `boto3`.

## Handlers

| File | Lambda handler | Route |
| --- | --- | --- |
| `handlers/health.py` | `handlers.health.lambda_handler` | `GET /health` |
| `handlers/dashboard.py` | `handlers.dashboard.lambda_handler` | `GET /dashboard` |
| `handlers/load_dataset.py` | `handlers.load_dataset.lambda_handler` | `POST /load-dataset` |
| `handlers/match.py` | `handlers.match.lambda_handler` | `POST /match` |
| `handlers/chat.py` | `handlers.chat.lambda_handler` | `POST /chat` |
| `handlers/response.py` | `handlers.response.lambda_handler` | `POST /response` |
| `handlers/impact_story.py` | `handlers.impact_story.lambda_handler` | `POST /impact-story` |

## Common Handler Behavior

Implemented in `services/common.py`:

- `json_response`
- `ok`
- `bad_request`
- `server_error`
- `parse_json_body`
- `get_env`
- `now_iso`
- `decimal_to_float_safe`
- `normalize_string`

All handlers use CORS-compatible API Gateway proxy responses.

## Services

### DynamoDB Service

`services/dynamodb_service.py`

Responsibilities:

- Create DynamoDB resource with `boto3.resource("dynamodb", region_name=AWS_REGION)`
- Read table names from env
- Safely convert floats to Decimal before DynamoDB writes
- Convert Decimal values back before JSON responses
- Provide scan, limited scan, put, get, update, and batch write helpers
- Deduplicate batch writes when a key name is provided

### Dataset Service

`services/dataset_service.py`

Responsibilities:

- Load CSV from S3 or provided rows
- Normalize blood group, dates, numbers, coordinates, active status, and eligibility status
- Derive match/scoring fields
- Deduplicate donor profiles by `user_id`
- Generate unique request IDs for request records
- Write donors and requests to DynamoDB
- Return load summary fields used by the frontend

### Scoring Service

`services/scoring_service.py`

Responsibilities:

- Haversine distance calculation
- Blood group exact matching
- Proximity scoring
- Donor confidence labels
- Donor ranking with hard filters and backup fallback rules

### Bedrock Service

`services/bedrock_service.py`

Responsibilities:

- Invoke AWS Bedrock Runtime with Claude message format
- Generate safe Priya-style outreach messages
- Generate safe anonymized impact stories
- Log Bedrock errors safely in CloudWatch
- Return safe fallback content when Bedrock is unavailable

### Response Service

`services/response_service.py`

Responsibilities:

- Classify donor response intent
- Summarize donor response
- Select next coordinator action
- Determine escalation
- Build and save response records
- Update request status when possible

## Environment Variables

Configured by SAM:

```text
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
AWS_BEDROCK_FALLBACK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
DYNAMODB_DONORS_TABLE=HemolyticsDonors
DYNAMODB_REQUESTS_TABLE=HemolyticsRequests
DYNAMODB_CONVERSATIONS_TABLE=HemolyticsConversations
DYNAMODB_RESPONSES_TABLE=HemolyticsResponses
S3_DATASET_BUCKET=<generated or provided bucket>
S3_DATASET_KEY=Dataset.csv
MATCH_TOP_N_DONORS=5
MATCH_DEFAULT_RADIUS_KM=25
MATCH_MAX_RADIUS_KM=100
DASHBOARD_SCAN_LIMIT=1000
DASHBOARD_REQUEST_SCAN_LIMIT=500
```

## SAM Resources

`backend/template.yaml` creates:

- `HemolyticsApi`
- `HemolyticsLambdaRole`
- Four DynamoDB tables
- Dataset S3 bucket
- Seven Lambda functions

Function settings include:

- Runtime: `python3.11`
- CodeUri: `.`
- Shared role: `HemolyticsLambdaRole`
- API Gateway events for each route

## IAM Permissions

The shared role includes:

- CloudWatch logging through `AWSLambdaBasicExecutionRole`
- DynamoDB `GetItem`, `PutItem`, `UpdateItem`, `Scan`, `BatchWriteItem`
- S3 `ListBucket`, `GetObject`, `PutObject`
- Bedrock `InvokeModel`

## Backend Scripts

| Script | Purpose |
| --- | --- |
| `backend/scripts/deploy_sam.sh` | Compile, build, and deploy SAM |
| `backend/scripts/test_api_endpoints.py` | Smoke test deployed API endpoints |
| `backend/scripts/run_local_handler.py` | Run Lambda handlers with local event files |
| `backend/scripts/test_bedrock.py` | Direct Bedrock diagnostic prompt |
| `backend/scripts/package_lambda.py` | Optional packaging helper |

## Local Events

`backend/events/` contains API Gateway proxy-style event samples for local handler runs.

Example:

```bash
python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json
```

## Deployment

From repository root:

```bash
bash backend/scripts/deploy_sam.sh
```

Manual:

```bash
sam build --template-file backend/template.yaml
sam deploy --guided
```

## Smoke Testing

After deploy:

```bash
python backend/scripts/test_api_endpoints.py <ApiUrl from SAM output>
```

## Safety Controls

Backend safety rules:

- No donor health certification
- No blood safety certification
- No medical decisions
- No guaranteed outcomes
- No patient PII in AI-generated messages
- Safe fallback content when Bedrock fails
- Human/coordinator review language in ranking and outreach

## Backend Limitations

- No custom authorizer or auth middleware
- No WAF or throttling configuration beyond API Gateway defaults
- Shared IAM role is pragmatic rather than least-privilege per function
- No CI/CD pipeline for backend deployment
- No automated unit test suite
- SmartMatch uses scan-based retrieval
- Dashboard uses sampled metrics, not full aggregation

## Not Applicable

- FastAPI app server
- Dockerfile/ECR deployment
- RDS migrations
- Redis workers
- Celery/background queue
- OpenAI or direct Anthropic SDK usage
- SageMaker model endpoint

