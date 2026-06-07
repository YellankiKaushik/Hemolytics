# Hemolytics Backend MVP

AWS serverless backend for the Hemolytics MVP. It supports the completed React + Vite + Tailwind frontend through API Gateway Lambda proxy responses.

## Architecture

React + Vite + Tailwind frontend -> Amplify or S3 -> API Gateway -> Lambda -> DynamoDB -> AWS Bedrock Claude 3.5 Haiku -> S3 -> CloudWatch.

This backend intentionally avoids PostgreSQL/RDS as primary storage, Redis, FastAPI as the primary backend, App Runner as the default runtime, mandatory Docker/ECR, direct Anthropic API calls, direct OpenAI API calls, production WhatsApp API, SageMaker pipelines, a full community platform, and mandatory crisis simulation flows.

## Prerequisites

- AWS account with CLI credentials configured.
- AWS SAM CLI installed.
- Python 3.11 available locally.
- AWS region `us-east-1`.
- Bedrock model access enabled for `anthropic.claude-3-5-haiku-20241022-v1:0` in `us-east-1`.

## Folder Structure

```text
backend/
├── handlers/
│   ├── health.py
│   ├── dashboard.py
│   ├── load_dataset.py
│   ├── match.py
│   ├── chat.py
│   ├── response.py
│   └── impact_story.py
├── services/
│   ├── dynamodb_service.py
│   ├── bedrock_service.py
│   ├── dataset_service.py
│   ├── scoring_service.py
│   ├── response_service.py
│   └── common.py
├── events/
├── scripts/
├── template.yaml
├── samconfig.toml
├── env.example
├── requirements.txt
└── README.md
```

## Environment Variables

See `env.example`.

SAM configures the Lambda functions with:

```text
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
AWS_BEDROCK_FALLBACK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
DYNAMODB_DONORS_TABLE=HemolyticsDonors
DYNAMODB_REQUESTS_TABLE=HemolyticsRequests
DYNAMODB_CONVERSATIONS_TABLE=HemolyticsConversations
DYNAMODB_RESPONSES_TABLE=HemolyticsResponses
S3_DATASET_BUCKET=<DatasetBucketName>
S3_DATASET_KEY=Dataset.csv
MATCH_TOP_N_DONORS=5
MATCH_DEFAULT_RADIUS_KM=25
MATCH_MAX_RADIUS_KM=100
```

AWS Lambda provides `AWS_REGION` automatically at runtime. The backend defaults to `us-east-1` when it is absent in local runs.

## DynamoDB Tables

SAM creates on-demand DynamoDB tables:

- `HemolyticsDonors`, primary key `user_id`
- `HemolyticsRequests`, primary key `request_id`
- `HemolyticsConversations`, primary key `conversation_id`, TTL attribute `ttl`
- `HemolyticsResponses`, primary key `response_id`

## Endpoint Mapping

| Method | Route | Lambda |
| --- | --- | --- |
| GET | `/health` | `HealthFunction` |
| GET | `/dashboard` | `DashboardFunction` |
| POST | `/load-dataset` | `LoadDatasetFunction` |
| POST | `/match` | `MatchFunction` |
| POST | `/chat` | `ChatFunction` |
| POST | `/response` | `ResponseFunction` |
| POST | `/impact-story` | `ImpactStoryFunction` |

API Gateway CORS is enabled for `GET,POST,OPTIONS`.

## S3 Dataset Bucket

`template.yaml` uses the parameter `DatasetBucketName`. Leave it blank to generate:

```text
hemolytics-dataset-<account-id>-<region>
```

S3 bucket names are globally unique. If you provide a custom bucket name and deployment fails because it is already taken, redeploy with a unique value during `sam deploy --guided`.

Upload the CSV as `Dataset.csv`, or change the `DatasetKey` parameter.

## Local Syntax Check

From the repository root:

```bash
python -m compileall backend
```

## Local Handler Test

Run a sample Lambda proxy event:

```bash
python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json
```

Handlers that call DynamoDB/S3/Bedrock require AWS credentials and deployed resources unless mocked. Bedrock-backed AI Outreach and Impact Story generation include safe fallback behavior if Bedrock is unavailable or if the selected model is restricted by account/model permissions.

## Package Lambda Source

SAM uses `backend/` as the Lambda source root so imports like `from services.common import ok` work.

Optional clean package folder:

```bash
python backend/scripts/package_lambda.py
```

Lambda includes `boto3`, so dependencies are intentionally minimal.

## SAM Deployment

From the repository root:

```bash
bash backend/scripts/deploy_sam.sh
```

Or manually:

```bash
cd backend
sam build
sam deploy --guided
```

After the first deployment, use:

```bash
cd backend
sam deploy
```

SAM outputs `ApiUrl`, table names, and the dataset bucket name.

## API Smoke Test

After deployment:

```bash
python backend/scripts/test_api_endpoints.py <ApiUrl from SAM output>
```

The test script checks:

- `GET /health`
- `GET /dashboard`
- `POST /match`
- `POST /chat`
- `POST /response`
- `POST /impact-story`

## Frontend Integration

Set the frontend environment variable to the SAM output:

```text
VITE_API_BASE_URL=<ApiUrl from SAM output>
```

Then rebuild/redeploy the frontend through Amplify or S3.

## AWS Deployment Assumptions

- API Gateway uses Lambda proxy integration.
- IAM permissions are kept simple for hackathon use: DynamoDB read/write to the four tables, S3 get/put/list for the dataset bucket, Bedrock `InvokeModel` for Claude 3.5 Haiku, and CloudWatch logs.
- The SAM template creates the dataset bucket. Leave `DatasetBucketName` blank for a generated account/region-specific name, or provide a globally unique custom bucket name.

## Safety Limitations

AI assists coordination only. It must not certify donor health, certify blood safety, make medical decisions, expose patient PII, or promise outcomes. Final donor eligibility and blood safety remain with authorized humans, coordinators, and medical staff.

## Cost Warning

Stay under your AWS budget. This MVP intentionally avoids RDS, NAT Gateway, OpenSearch, Redshift, SageMaker endpoints, EC2, ECS, and EKS. Monitor Lambda, API Gateway, DynamoDB, S3, CloudWatch Logs, and Bedrock usage during demos.
