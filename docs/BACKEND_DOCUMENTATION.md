# Hemolytics — Backend Documentation

## 1. Backend Overview

The Hemolytics backend is an AWS serverless backend built with Amazon API Gateway, AWS Lambda, DynamoDB, S3, AWS Bedrock, CloudWatch, and AWS SAM.

It powers the deployed hackathon MVP behind the React/Vite/Tailwind frontend and supports:

- dataset ingestion
- dashboard analytics
- donor matching
- AI outreach generation
- donor response classification
- impact story generation
- health checks

The backend is designed for coordinator decision support in a Blood Warriors / AI for Good hackathon context. It is not a production-certified healthcare system, blood bank system, emergency dispatch system, or medical decision engine.

## 2. Backend Responsibilities

The backend is responsible for:

- accepting API Gateway requests from the frontend
- parsing and validating JSON request bodies
- returning frontend-safe JSON responses
- reading and writing DynamoDB records
- loading `Dataset.csv` from S3
- cleaning and normalizing dataset rows
- deduplicating donor profiles by `user_id`
- generating request records from bridge/request-like dataset rows
- ranking donor candidates through SmartMatch scoring
- generating safe AI outputs through AWS Bedrock
- returning deterministic fallback content when Bedrock is unavailable
- classifying donor replies into simple response intents
- updating request status after response classification when possible
- logging operational diagnostics to CloudWatch without intentionally exposing secrets or private prompt content

The backend does not certify donor health, certify blood safety, send WhatsApp messages automatically, replace coordinators, or make medical decisions.

## 3. Backend Architecture Diagram

```text
Amazon API Gateway
  |
  | Routes:
  | GET /health
  | GET /dashboard
  | POST /load-dataset
  | POST /match
  | POST /chat
  | POST /response
  | POST /impact-story
  v
Lambda Handlers
  |
  | backend/handlers/*.py
  v
Service Layer
  |
  | common.py
  | dynamodb_service.py
  | dataset_service.py
  | scoring_service.py
  | bedrock_service.py
  | response_service.py
  v
AWS Data and AI Services
  |
  +--> DynamoDB
  |      - HemolyticsDonors
  |      - HemolyticsRequests
  |      - HemolyticsConversations
  |      - HemolyticsResponses
  |
  +--> S3
  |      - Dataset.csv in the configured dataset bucket
  |
  +--> AWS Bedrock Runtime
  |      - Claude Haiku model invocation
  |      - deterministic safe fallback when unavailable
  |
  v
CloudWatch Logs
  |
  +--> Lambda execution logs
  +--> safe Bedrock diagnostics
  +--> deployment and runtime troubleshooting
```

The backend is deployed with AWS SAM/CloudFormation from `backend/template.yaml`. The frontend is hosted separately through AWS Amplify and calls the backend through `VITE_API_BASE_URL`.

## 4. Backend Folder Structure

Actual backend structure inspected in the repository:

```text
backend/
├── events/
│   ├── chat_event.json
│   ├── dashboard_event.json
│   ├── health_event.json
│   ├── impact_story_event.json
│   ├── load_dataset_event.json
│   ├── match_event.json
│   └── response_event.json
├── handlers/
│   ├── chat.py
│   ├── dashboard.py
│   ├── health.py
│   ├── impact_story.py
│   ├── load_dataset.py
│   ├── match.py
│   └── response.py
├── scripts/
│   ├── deploy_sam.sh
│   ├── package_lambda.py
│   ├── run_local_handler.py
│   ├── test_api_endpoints.py
│   └── test_bedrock.py
├── services/
│   ├── bedrock_service.py
│   ├── common.py
│   ├── dataset_service.py
│   ├── dynamodb_service.py
│   ├── response_service.py
│   └── scoring_service.py
├── env.example
├── README.md
├── requirements.txt
├── samconfig.toml
└── template.yaml
```

Folder and file roles:

- `backend/handlers/`: Lambda entrypoints mapped to API Gateway routes.
- `backend/services/`: shared business logic and AWS service wrappers.
- `backend/events/`: API Gateway proxy-style sample events for local handler testing.
- `backend/scripts/`: deployment, smoke test, local handler, packaging, and Bedrock diagnostic helpers.
- `backend/template.yaml`: SAM infrastructure template.
- `backend/samconfig.toml`: SAM build/deploy defaults.
- `backend/requirements.txt`: Python dependency list. It currently includes `boto3>=1.34.0`.
- `backend/env.example`: non-secret environment variable example.
- `backend/README.md`: backend deployment and operation guide.

Generated folders such as `.aws-sam`, `.build`, `__pycache__`, and zip artifacts are not part of the source documentation target and should not be committed.

## 5. AWS SAM Infrastructure

Infrastructure is defined in:

```text
backend/template.yaml
```

The SAM template defines:

- one API Gateway REST API: `HemolyticsApi`
- seven Lambda functions
- one shared Lambda execution role: `HemolyticsLambdaRole`
- four DynamoDB tables
- one S3 dataset bucket
- CloudFormation outputs for API URL, table names, and dataset bucket name

Runtime and global function settings:

- Runtime: `python3.11`
- CodeUri: `.`
- Architecture: `x86_64`
- Tracing: `Active`
- Stage: `Prod`
- CORS methods: `GET,POST,OPTIONS`
- CORS headers: `Content-Type,Authorization`
- CORS origin: `*`

Lambda functions and route mapping:

| SAM function | Handler | Method/path | Memory | Timeout |
|---|---|---|---:|---:|
| `HealthFunction` | `handlers.health.lambda_handler` | `GET /health` | 128 MB | 10 sec |
| `DashboardFunction` | `handlers.dashboard.lambda_handler` | `GET /dashboard` | 512 MB | 30 sec |
| `LoadDatasetFunction` | `handlers.load_dataset.lambda_handler` | `POST /load-dataset` | 512 MB | 60 sec |
| `MatchFunction` | `handlers.match.lambda_handler` | `POST /match` | 512 MB | 30 sec |
| `ChatFunction` | `handlers.chat.lambda_handler` | `POST /chat` | 512 MB | 45 sec |
| `ResponseFunction` | `handlers.response.lambda_handler` | `POST /response` | 256 MB | 20 sec |
| `ImpactStoryFunction` | `handlers.impact_story.lambda_handler` | `POST /impact-story` | 512 MB | 45 sec |

DynamoDB tables:

| Logical resource | Table name | Partition key |
|---|---|---|
| `DonorsTable` | `HemolyticsDonors` | `user_id` |
| `RequestsTable` | `HemolyticsRequests` | `request_id` |
| `ConversationsTable` | `HemolyticsConversations` | `conversation_id` |
| `ResponsesTable` | `HemolyticsResponses` | `response_id` |

The conversations table has TTL enabled on the `ttl` attribute. The current code does not require every conversation record to include `ttl`.

S3:

- `DatasetBucket` is created by the stack.
- If `DatasetBucketName` is blank, the bucket name is generated as `hemolytics-dataset-${AWS::AccountId}-${AWS::Region}`.
- If a custom bucket name is provided, SAM uses that value.
- The dataset key defaults to `Dataset.csv`.

IAM:

- `AWSLambdaBasicExecutionRole` managed policy for CloudWatch logs.
- Inline DynamoDB permissions: `GetItem`, `PutItem`, `UpdateItem`, `Scan`, `BatchWriteItem`.
- Inline S3 permissions: `ListBucket`, `GetObject`, `PutObject`.
- Inline Bedrock permission: `bedrock:InvokeModel` for configured Claude Haiku model resources and practical Haiku wildcard resources used by the MVP.

Outputs:

- `ApiUrl`
- `DonorsTableName`
- `RequestsTableName`
- `ConversationsTableName`
- `ResponsesTableName`
- `DatasetBucketName`

Deployment is performed through SAM/CloudFormation, not Docker/ECR, App Runner, FastAPI, RDS, Redis, OpenAI, direct Anthropic API, or SageMaker.

## 6. Lambda Handler Layer

### `backend/handlers/health.py`

- Endpoint: `GET /health`
- Purpose: returns app health, version, architecture, region, and safety notice.
- Expected input: no JSON body.
- Output summary: `status`, `app`, `version`, `architecture`, `region`, `safety`.
- Services used: `services.common`.
- AWS dependency: environment variables and Lambda runtime only.
- Frontend usage: API Settings / deployment checks; smoke test script.
- Failure/fallback behavior: no external data dependency, so failures normally indicate deployment/routing/runtime issues.
- Safety boundary: explicitly states AI assists coordination only.

### `backend/handlers/dashboard.py`

- Endpoint: `GET /dashboard`
- Purpose: returns fast dashboard metrics from donor/request records.
- Expected input: no JSON body.
- Output summary: dashboard metrics such as active donors, eligible donors, missing blood groups, missing location, blood group distribution, role distribution, top eligible donor pool, `sampledRecords`, and `dashboardMode`.
- Services used: `services.dynamodb_service`, `services.common`.
- AWS dependency: DynamoDB donors and requests tables.
- Frontend page: `src/pages/Dashboard.tsx`.
- Failure behavior: DynamoDB read failure returns `server_error("Unable to read dashboard data from DynamoDB.", exc)`.
- Safety boundary: dashboard metrics are coordination-support indicators, not confirmed medical outcomes.

Implementation detail: the handler uses `scan_limited` with projection expressions and default limits of `1000` donor records and `500` request records to avoid Lambda timeout on the real dataset.

### `backend/handlers/load_dataset.py`

- Endpoint: `POST /load-dataset`
- Purpose: triggers dataset loading from S3 or request-provided rows.
- Expected input: `{}` for S3 loading, or `{ "rows": [...] }` for local/test row ingestion.
- Output summary: row counts, cleaned rows, unique users, duplicate groups handled, invalid blood groups flagged, missing locations flagged, donors written, requests written, load status, timestamp.
- Services used: `services.dataset_service`, `services.common`.
- AWS dependency: S3 and DynamoDB.
- Frontend page: `src/pages/DatasetIngestion.tsx`.
- Failure behavior: invalid JSON returns `400`; invalid rows/configuration return `400`; unexpected S3/DynamoDB failures return `500`.
- Safety boundary: data quality metrics do not imply donor medical approval.

### `backend/handlers/match.py`

- Endpoint: `POST /match`
- Purpose: ranks donor candidates for a blood request.
- Expected input: request body with `requiredBloodGroup` or `required_blood_group`, plus `latitude` and `longitude`. Optional fields include `requestId`, `city`, `urgency`, `quantityRequired`, and `neededBy`.
- Output summary: `results`, `matchTimeMs`, `totalCandidates`, and `eligibleCandidates`.
- Services used: `services.dynamodb_service`, `services.scoring_service`, `services.common`.
- AWS dependency: DynamoDB donors table.
- Frontend page: `src/pages/SmartMatch.tsx`.
- Failure behavior: missing required fields return `400`; unexpected scoring/DynamoDB errors return `500`.
- Safety boundary: SmartMatch ranks donors to contact first. It does not guarantee availability, donor eligibility, donation completion, or blood safety.

### `backend/handlers/chat.py`

- Endpoint: `POST /chat`
- Purpose: generates safe coordinator-ready donor outreach copy.
- Expected input: JSON object with `donor` and `request`; optional `tone` and `language`.
- Output summary: `message`, `model`, `provider`, `safetyNotice`, `conversationId`, `bedrock_available`, `fallback_used`, and `bedrock_error_type` when fallback is used.
- Services used: `services.bedrock_service`, `services.dynamodb_service`, `services.common`.
- AWS dependency: AWS Bedrock Runtime and DynamoDB conversations table.
- Frontend page: `src/pages/AiOutreach.tsx`.
- Failure/fallback behavior: Bedrock failures return a safe fallback message from `bedrock_service`; conversation save or unexpected handler errors return `500`.
- Safety boundary: message generation does not send WhatsApp messages and does not certify donor health or blood safety.

### `backend/handlers/response.py`

- Endpoint: `POST /response`
- Purpose: classifies donor reply text, suggests next action, saves response record, and updates request status when possible.
- Expected input: `requestId` or `request_id`, `donorId` or `donor_id`, optional `responseText`, `currentRank`, and `rankedDonors`.
- Output summary: `detectedIntent`, `responseStatus`, `aiSummary`, `nextAction`, `escalationTriggered`, `nextDonorId`, and `updatedRequestStatus`.
- Services used: `services.response_service`, `services.common`.
- AWS dependency: DynamoDB responses and requests tables.
- Frontend page: `src/pages/ResponseTracking.tsx`.
- Failure behavior: missing request/donor IDs return `400`; DynamoDB or update failures return `500` unless handled as request update warning inside the service.
- Safety boundary: response classification supports follow-up; it does not approve donors medically.

### `backend/handlers/impact_story.py`

- Endpoint: `POST /impact-story`
- Purpose: generates anonymized awareness content and coordinator summaries from safe campaign-level metrics.
- Expected input: campaign fields such as `donorsContacted`, `responsesReceived`, `potentialMatches`, `campaignCity`, `bloodGroup`, `patientSafeContext`, and `tone`.
- Output summary: `awarenessMessage`, `socialPost`, `coordinatorSummary`, `safetyNotice`, `bedrock_available`, `fallback_used`, and optional `bedrock_error_type`.
- Services used: `services.bedrock_service`, `services.common`.
- AWS dependency: AWS Bedrock Runtime.
- Frontend page: `src/pages/ImpactStory.tsx`.
- Failure/fallback behavior: Bedrock failures return deterministic fallback awareness content; unexpected handler errors return `500`.
- Safety boundary: no patient PII, no confirmed lives-saved claims, no medical outcome claims.

## 7. Backend Service Layer

### `backend/services/common.py`

Purpose: shared utilities for all handlers.

Key responsibilities:

- construct API Gateway Lambda proxy responses
- attach CORS headers
- serialize JSON safely
- convert DynamoDB `Decimal` values to JSON-safe ints/floats
- parse request bodies, including base64-encoded API Gateway bodies
- return `400` and `500` error response shapes
- return `OPTIONS` preflight responses
- provide app constants such as `APP_NAME`, `APP_VERSION`, and `SAFETY_NOTICE`
- normalize strings and parse basic numeric helpers

Handlers using it: all handlers.

AWS dependency: none directly.

Important behavior: `parse_json_body` returns `{}` when the request body is absent or empty, which allows endpoints such as `/load-dataset` to use environment-configured S3 defaults.

Limitations: error responses are intentionally simple and not a full typed error contract.

### `backend/services/dynamodb_service.py`

Purpose: central DynamoDB wrapper.

Key responsibilities:

- create `boto3.resource("dynamodb", region_name=AWS_REGION)`
- read table names from environment variables
- define known primary keys for all four MVP tables
- generate missing primary keys where safe
- remove `None` values before DynamoDB writes
- convert Python floats to `Decimal` before writes
- convert DynamoDB `Decimal` values back to JSON-safe types on reads
- scan all records when needed
- perform limited scans for dashboard performance
- get, put, update, and batch-write items
- deduplicate batch writes by a key name to avoid DynamoDB `BatchWriteItem` duplicate key failures

Handlers/services using it:

- dashboard handler
- match handler
- chat handler
- response service
- dataset service

AWS dependency: DynamoDB.

Important behavior: `batch_write_items(table_name, items, key_name=None)` deduplicates by `key_name` or known table primary key before writing. This is important because DynamoDB `BatchWriteItem` cannot accept duplicate keys in a single batch.

Limitations: scans are MVP-friendly but are not optimized for large production workloads.

### `backend/services/dataset_service.py`

Purpose: dataset ingestion, cleaning, derivation, deduplication, and write orchestration.

Key responsibilities:

- read rows from request body or S3 CSV
- normalize Blood Warriors dataset fields
- normalize blood group values
- parse safe date values
- parse numeric fields
- validate latitude/longitude
- normalize active status and eligibility status
- derive match/scoring fields
- deduplicate donors by `user_id`
- generate request records for bridge/request candidates
- write donor profiles to `HemolyticsDonors`
- write request records to `HemolyticsRequests`
- return frontend-visible load summary metrics

Handlers using it:

- `backend/handlers/load_dataset.py`

AWS dependency: S3 and DynamoDB.

Important behavior:

- donor deduplication keeps the most complete record by valid blood group, valid location, known eligibility, active status presence, higher donations, higher calls, and recent contact/donation date.
- request records are not deduplicated only by `user_id`; they receive unique `request_id` values.
- batch writes pass `key_name="user_id"` for donors and `key_name="request_id"` for requests.

Limitations:

- ingestion is synchronous inside the Lambda.
- production-scale ingestion may need SQS/EventBridge/Step Functions or background jobs.
- raw dataset rows are not documented and should not be committed.

### `backend/services/scoring_service.py`

Purpose: donor matching and SmartMatch ranking.

Key responsibilities:

- compute Haversine distance in kilometers
- perform exact normalized blood group matching
- calculate proximity score
- calculate donor experience score
- calculate engagement score
- calculate eligibility score
- calculate location quality score
- calculate confidence labels
- rank donors by weighted score
- provide backup candidates by relaxing active status when fewer than five strict matches are found

Handlers using it:

- `backend/handlers/match.py`

AWS dependency: none directly. It operates on donor records loaded from DynamoDB by the handler.

Important behavior:

- missing blood group and `Do not Know` blood group donors are excluded.
- non-eligible donors are excluded.
- invalid-location donors are excluded.
- strict candidates must be active.
- backup candidates may relax active status but still require valid blood group, eligibility, and location.

Limitations:

- matching is scan/ranking based.
- no DynamoDB GSI, geospatial index, or cached candidate pool is implemented yet.
- blood group matching is exact in current code.

### `backend/services/bedrock_service.py`

Purpose: AI generation through AWS Bedrock Runtime with safe fallback behavior.

Key responsibilities:

- configure Bedrock region and model IDs from environment variables
- call `boto3.client("bedrock-runtime").invoke_model`
- use Claude message request format with `anthropic_version`
- generate Priya-style outreach copy
- generate anonymized impact story content
- parse impact story JSON when Bedrock returns JSON-like text
- return safe deterministic fallback content when Bedrock fails
- expose `bedrock_available`, `fallback_used`, and `bedrock_error_type`
- log safe Bedrock invocation diagnostics to CloudWatch

Handlers using it:

- `backend/handlers/chat.py`
- `backend/handlers/impact_story.py`

AWS dependency: AWS Bedrock Runtime.

Important behavior:

- configured model candidates are tried in order: `AWS_BEDROCK_MODEL_ID`, then `AWS_BEDROCK_FALLBACK_MODEL_ID` if different.
- fallback content is generated locally and safely.
- safety prompt prohibits donor health certification, blood safety certification, medical decisions, guaranteed outcomes, and patient PII.

Limitations:

- Bedrock model access depends on the AWS account, region, IAM permission, and model availability.
- fallback is deliberately safe but less personalized than a successful model response.
- there is no AI output moderation service beyond prompt constraints and deterministic fallback wording.

### `backend/services/response_service.py`

Purpose: donor response classification, summarization, escalation, persistence, and request update.

Key responsibilities:

- classify reply intent into `confirm`, `decline`, `reschedule`, or `no_response`
- summarize reply meaning for coordinators
- select next coordinator action
- determine escalation and next donor when ranked donors are provided
- build response records with generated `response_id`
- save response records into DynamoDB
- update request status in `HemolyticsRequests` when possible

Handlers using it:

- `backend/handlers/response.py`

AWS dependency: DynamoDB.

Important behavior:

- empty string, `timeout`, `no response`, and `no_response` become `no_response`.
- reschedule phrases such as `later`, `tomorrow`, `after`, `evening`, `another time`, and `reschedule` become `reschedule`.
- decline phrases such as `not possible`, `unavailable`, `cannot`, `can't`, and `no` become `decline`.
- confirm phrases such as `yes`, `available`, `i can come`, `ok`, `sure`, and `confirmed` become `confirm`.

Limitations:

- classification is rule-based.
- no multilingual response classifier is implemented yet.
- no full request lifecycle workflow engine exists yet.

## 8. Common Response and Utility Patterns

Shared response helpers live in:

```text
backend/services/common.py
```

Lambda proxy response shape:

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  },
  "body": "{\"example\":\"value\"}"
}
```

Success:

```python
ok(payload)
```

Bad request:

```python
bad_request(message, details=None)
```

Server error:

```python
server_error(message, details=None)
```

CORS:

- all common responses include JSON and CORS headers
- `OPTIONS` preflight returns `{"status": "ok"}`

Request body parsing:

- `parse_json_body(event)` supports normal string bodies, dict bodies, and base64-encoded bodies
- empty body returns `{}`
- non-object JSON returns a `ValueError`

Serialization:

- `decimal_to_float_safe` converts DynamoDB `Decimal` to JSON-safe numeric values
- date/datetime objects serialize to ISO strings

Safe logging and data exposure:

- Bedrock diagnostics do not intentionally log prompts, credentials, or secrets
- docs and code avoid raw dataset contents
- user-facing safety notices keep medical decision boundaries visible

## 9. Dataset Ingestion Backend Flow

Dataset ingestion starts at:

```text
POST /load-dataset
backend/handlers/load_dataset.py
```

The flow:

1. The frontend Dataset Ingestion page calls `loadDataset()` in `src/services/api.ts`.
2. `load_dataset.py` parses the JSON body.
3. If `rows` is supplied, the service ingests those rows.
4. If `rows` is absent, the service reads the configured S3 bucket/key.
5. `dataset_service.load_csv_from_s3` reads `Dataset.csv` using `boto3.client("s3")`.
6. CSV rows are parsed through `csv.DictReader`.
7. Each row is cleaned by `clean_donor_row`.
8. Fields are normalized and derived fields are added.
9. Donor profiles are deduplicated by `user_id`.
10. Request records are generated for bridge/request candidate rows.
11. Donors are batch-written to `HemolyticsDonors`.
12. Requests are batch-written to `HemolyticsRequests`.
13. A summary response is returned to the frontend.

Cleaning and normalization include:

- known Blood Warriors dataset fields
- blood group normalization such as `O+` to `O Positive`
- date parsing into ISO-like date strings when possible
- numeric parsing for coordinates, quantity, donations, calls, frequency, and ratios
- active status normalization to `Active` or `Inactive`
- eligibility normalization to `eligible`, `not_eligible`, or `unknown`
- coordinate validation

Derived donor fields include:

- `has_valid_blood_group`
- `has_valid_location`
- `is_match_eligible`
- `donor_experience_score`
- `engagement_score`
- `eligibility_score`
- `location_quality_score`
- `reengagement_priority`
- `bridge_request_candidate`

Duplicate key fix:

- DynamoDB `BatchWriteItem` cannot accept multiple items with the same primary key in one batch.
- Real dataset rows can contain duplicate `user_id` values because one user may appear in multiple bridge/activity rows.
- `dataset_service._dedupe_donors` keeps one donor profile per `user_id`.
- `dynamodb_service.batch_write_items` includes a second safety guard that deduplicates by provided key before writing.

Known load metrics from the deployed dataset:

- `7033` rows loaded
- `6946` unique users created
- `87` duplicate groups handled
- `2036` invalid/unknown blood groups flagged
- `24` missing locations flagged
- `6946` donors written
- `786` requests written

No raw dataset rows or private dataset contents are included here.

## 10. Dashboard Backend Flow

Dashboard starts at:

```text
GET /dashboard
backend/handlers/dashboard.py
```

The dashboard reads:

- donor sample from `HemolyticsDonors`
- request sample from `HemolyticsRequests`

Performance approach:

- donor scan limit defaults to `DASHBOARD_SCAN_LIMIT=1000`
- request scan limit defaults to `DASHBOARD_REQUEST_SCAN_LIMIT=500`
- handler uses `scan_limited`
- handler tries projection expressions for only needed fields
- if projection fails, it falls back to normal limited scan

This sampling design prevents timeout on the real loaded dataset while keeping dashboard metrics useful for hackathon demo speed.

Metrics calculated include:

- `totalRecords`
- `uniqueUsers`
- `totalDonorLikeUsers`
- `activeDonors`
- `inactiveDonors`
- `eligibleDonors`
- `notEligibleDonors`
- `missingBloodGroup`
- `missingLocation`
- `locationCoveragePercent`
- `reengagementCandidates`
- `activeBridgeCount`
- `bloodGroupDistribution`
- `roleDistribution`
- `topEligibleDonorPool`
- `recentActivity`
- `sampledRecords`
- `dashboardMode`

Limitations:

- values are sampled dashboard indicators, not full production analytics
- no precomputed aggregate table exists yet
- no DynamoDB Streams or background aggregation job exists yet
- dashboard numbers should be framed as coordination-support metrics

## 11. SmartMatch Backend Flow

SmartMatch starts at:

```text
POST /match
backend/handlers/match.py
```

The handler:

1. parses the request body
2. validates `requiredBloodGroup` or `required_blood_group`
3. validates `latitude` and `longitude`
4. loads donors from `HemolyticsDonors`
5. calls `scoring_service.rank_donors`
6. returns the top `MATCH_TOP_N_DONORS`, default `5`

Candidate and scoring behavior:

- blood group match is exact after normalization
- donors with missing blood group are excluded
- donors with `Do not Know` blood group are excluded
- donors must have `eligibility_status == "eligible"`
- strict candidates must have `user_donation_active_status == "Active"`
- donors must have valid coordinates
- distance uses Haversine distance
- proximity score decreases with distance up to a max radius of 100 km in the scoring function
- engagement uses active status, total calls, and calls-to-donations ratio
- experience uses prior donation count
- confidence label uses data completeness signals

Current score weights:

- proximity: `0.30`
- engagement: `0.25`
- experience: `0.15`
- eligibility: `0.15`
- location quality: `0.15`

Fallback candidate behavior:

- if fewer than five strict matches are found, the scoring service may relax active status
- it still excludes missing blood group, invalid location, and not-eligible donors
- relaxed candidates are described as backup candidates for coordinator review only

Output shape includes:

- `rank`
- `donor_id`
- `user_id`
- `blood_group`
- `distance_km`
- `eligibility_status`
- `active_status`
- `donations_till_date`
- `total_calls`
- `calls_to_donations_ratio`
- `donor_type`
- `score`
- `match_score`
- `confidence_label`
- `reason_for_ranking`
- `reason`
- `recommended_action`

The handler wraps results with:

- `results`
- `matchTimeMs`
- `totalCandidates`
- `eligibleCandidates`

No candidate handling: if no donors pass filters, `results` is an empty array.

Safety boundary: SmartMatch ranks donors to contact first. It does not guarantee availability, donor eligibility, donation completion, or blood safety.

## 12. AI Outreach Backend Flow

AI Outreach starts at:

```text
POST /chat
backend/handlers/chat.py
```

The handler:

1. parses JSON request body
2. requires `donor` and `request`
3. reads optional `tone` and `language`
4. calls `bedrock_service.generate_outreach_message`
5. saves a conversation record to `HemolyticsConversations`
6. returns generated or fallback message with metadata

Bedrock request behavior:

- uses `boto3.client("bedrock-runtime", region_name=AWS_BEDROCK_REGION)`
- calls `invoke_model`
- sends Claude message format with `anthropic_version: bedrock-2023-05-31`
- uses the Priya coordinator system prompt
- tries configured model candidates from environment variables

Safety prompt boundaries:

- never certify donor health
- never certify blood safety
- never make medical decisions
- never imply guaranteed outcomes
- never include patient PII
- ask only for availability and coordinator follow-up

Fallback behavior:

- if Bedrock fails, backend returns a safe locally generated message
- response includes `bedrock_available: false`
- response includes `fallback_used: true`
- response includes a non-sensitive `bedrock_error_type`

No automatic WhatsApp sending:

- `POST /chat` generates text only
- the frontend copy/mark-as-sent controls are coordinator workflow aids
- there is no production WhatsApp API integration in the backend

Human verification boundary: outreach text asks for availability and coordinator follow-up only. Eligibility, logistics, and blood safety remain human-led.

## 13. Response Tracking Backend Flow

Response Tracking starts at:

```text
POST /response
backend/handlers/response.py
```

The handler:

1. parses JSON request body
2. requires `requestId` or `request_id`
3. requires `donorId` or `donor_id`
4. calls `response_service.apply_response_to_request`
5. returns intent, summary, next action, escalation, and request status fields

Classification categories:

- `confirm`
- `decline`
- `reschedule`
- `no_response`

Rule examples:

- `yes`, `available`, `i can come`, `ok`, `sure`, `confirmed` -> `confirm`
- `no`, `not possible`, `unavailable`, `cannot`, `can't` -> `decline`
- `later`, `tomorrow`, `after`, `evening`, `another time`, `reschedule` -> `reschedule`
- empty text, `timeout`, `no response`, `no_response` -> `no_response`

Escalation logic:

- confirm -> `donor_confirmed`
- reschedule -> `needs_follow_up`
- decline/no response -> next ranked donor when available
- no next donor -> `needs_coordinator_attention`

Storage:

- writes response record to `HemolyticsResponses`
- updates matching `HemolyticsRequests` status, `updated_at`, and `last_response_id` when possible

Frontend display:

- `src/pages/ResponseTracking.tsx` shows detected intent, response status, summary, next action, escalation state, and next donor ID.

Safety boundary: response classification supports coordinator follow-up only. It does not medically approve donors or confirm donation completion.

## 14. Impact Story Backend Flow

Impact Story starts at:

```text
POST /impact-story
backend/handlers/impact_story.py
```

The handler:

1. parses JSON request body
2. passes campaign-level payload to `bedrock_service.generate_impact_story`
3. returns generated or fallback content

Expected content fields:

- `awarenessMessage`
- `socialPost`
- `coordinatorSummary`
- `safetyNotice`
- `bedrock_available`
- `fallback_used`
- optional `model`
- optional `provider`
- optional `bedrock_error_type`

Input is campaign-level and safe-context oriented, for example:

- donors contacted
- responses received
- potential matches
- campaign city
- blood group
- patient-safe context
- tone

Fallback behavior:

- if Bedrock fails, `_impact_fallback` creates anonymized factual content
- fallback content frames metrics as potential matches and coordinator review

Safety:

- no patient PII
- no confirmed lives-saved claims
- no medical outcome claims
- no donor health certification
- no blood safety certification
- impact metrics are coordination-support indicators unless verified outcome data exists

## 15. DynamoDB Backend Usage

### `HemolyticsDonors`

- Key: `user_id`
- Written by: `dataset_service.py` through `batch_write_items`
- Read by: `dashboard.py`, `match.py`
- Purpose: donor/user profile storage after dataset cleaning and deduplication.
- Example field types: blood group, coordinates, role, eligibility status, active status, donation/call history, derived scoring fields.
- Limitations: no GSIs or geospatial indexes yet; matching uses scans.

### `HemolyticsRequests`

- Key: `request_id`
- Written by: `dataset_service.py`
- Read by: `dashboard.py`
- Updated by: `response_service.py`
- Purpose: bridge/request records derived from dataset rows.
- Example field types: required blood group, location, quantity required, needed-by date, status, source timestamps.
- Limitations: no full request lifecycle state machine yet.

### `HemolyticsResponses`

- Key: `response_id`
- Written by: `response_service.py`
- Read by: not currently required by the main handlers for dashboard display.
- Purpose: saved response classification records.
- Example field types: request ID, donor ID, response text, detected intent, response status, summary, next action, escalation state.
- Limitations: no response history API endpoint yet.

### `HemolyticsConversations`

- Key: `conversation_id`
- Written by: `chat.py` through `save_conversation`.
- Read by: not currently exposed through a read endpoint.
- Purpose: stores AI Outreach generation records.
- Example field types: type, request ID, donor ID, generated message, model, provider, Bedrock/fallback flags, created timestamp.
- Limitations: table has TTL configured, but current write path does not require TTL on every record.

## 16. S3 Backend Usage

S3 is used as the dataset source for the backend ingestion pipeline.

Current behavior:

- SAM creates a private dataset bucket.
- `S3_DATASET_BUCKET` points Lambda functions to that bucket.
- `S3_DATASET_KEY` defaults to `Dataset.csv`.
- `dataset_service.load_csv_from_s3` reads the object with `boto3.client("s3").get_object`.
- The browser does not upload directly to S3 in the current MVP.

Why S3:

- simple storage for a large CSV dataset
- cheap and serverless
- easy to reload into DynamoDB during demo/deployment
- avoids committing real/sensitive dataset rows to GitHub

Repository safety:

- `Dataset.csv` should not be committed.
- `.gitignore` is expected to exclude dataset files and build artifacts.
- S3 bucket access is handled by Lambda IAM permissions, not hardcoded credentials.

## 17. Bedrock Backend Usage

Bedrock is used in:

- `POST /chat`
- `POST /impact-story`

Implementation file:

```text
backend/services/bedrock_service.py
```

Model configuration:

- `AWS_BEDROCK_REGION`
- `AWS_BEDROCK_MODEL_ID`
- `AWS_BEDROCK_FALLBACK_MODEL_ID`

Current default model in code/template examples:

```text
anthropic.claude-3-5-haiku-20241022-v1:0
```

Invocation pattern:

- AWS Bedrock Runtime through `boto3`
- `invoke_model`
- Claude message body with:
  - `anthropic_version`
  - `max_tokens`
  - `temperature`
  - `system`
  - `messages`

Fallback importance:

- hackathon/demo accounts may have incomplete Bedrock access
- model availability can vary by region/account
- IAM permissions can be misconfigured during deployment
- fallback avoids breaking user-facing flows
- frontend can still show safe coordinator-ready content

The backend does not use OpenAI or direct Anthropic APIs.

## 18. CloudWatch and Diagnostics

CloudWatch receives Lambda execution logs from all functions.

Useful diagnostics:

- Lambda START/END/REPORT records
- handler exceptions returned through `server_error`
- dataset ingestion exceptions
- dashboard DynamoDB scan issues
- Bedrock invocation diagnostics

Bedrock diagnostic log pattern:

```text
BEDROCK_INVOKE_ERROR: <ExceptionType>: <message> | model_id=<model> | bedrock_region=<region> | operation=invoke_model | fallback_used=<true|false>
```

This is intended to identify IAM, model access, model ID, request format, and region issues.

Do not log:

- AWS credentials
- secrets
- `.env` contents
- raw private donor data
- patient PII
- full prompts when they may contain sensitive data

Future production hardening should add structured logs, metrics, alarms, dashboards, and trace correlation IDs.

## 19. Backend Environment Variables

Environment variables visible in SAM/code:

| Variable | Purpose | Default/source |
|---|---|---|
| `AWS_REGION` | DynamoDB/S3 region fallback in code | `us-east-1` fallback in services; Lambda also provides AWS region context |
| `AWS_BEDROCK_REGION` | Bedrock Runtime region | `us-east-1` |
| `AWS_BEDROCK_MODEL_ID` | Primary Bedrock model ID | SAM parameter `BedrockModelId` |
| `AWS_BEDROCK_FALLBACK_MODEL_ID` | fallback Bedrock model ID | `anthropic.claude-3-5-haiku-20241022-v1:0` |
| `DYNAMODB_DONORS_TABLE` | donors table name | `HemolyticsDonors` |
| `DYNAMODB_REQUESTS_TABLE` | requests table name | `HemolyticsRequests` |
| `DYNAMODB_CONVERSATIONS_TABLE` | conversations table name | `HemolyticsConversations` |
| `DYNAMODB_RESPONSES_TABLE` | responses table name | `HemolyticsResponses` |
| `S3_DATASET_BUCKET` | dataset S3 bucket | SAM `DatasetBucket` |
| `S3_DATASET_KEY` | dataset object key | `Dataset.csv` |
| `MATCH_TOP_N_DONORS` | returned donor count | `5` |
| `MATCH_DEFAULT_RADIUS_KM` | configured match radius variable | `25` |
| `MATCH_MAX_RADIUS_KM` | configured max match radius variable | `100` |
| `DASHBOARD_SCAN_LIMIT` | dashboard donor sample limit | `1000` |
| `DASHBOARD_REQUEST_SCAN_LIMIT` | dashboard request sample limit | `500` |

No credentials should be stored in these variables inside source control. AWS credentials belong in AWS CLI/SAM deployment configuration, temporary hackathon credentials, or the AWS runtime role, not in code.

## 20. Backend Deployment Flow

Primary deploy helper:

```bash
bash backend/scripts/deploy_sam.sh
```

What the script does:

1. checks that SAM CLI is installed
2. runs Python syntax checks with `python -m compileall backend`
3. builds SAM with `sam build --template-file backend/template.yaml`
4. deploys an existing stack with `sam deploy` from `backend/`
5. starts `sam deploy --guided` if no existing stack is found
6. prints stack outputs with `sam list stack-outputs`

Manual deploy commands:

```bash
sam build --template-file backend/template.yaml
sam deploy --guided
```

Deployment infrastructure:

- SAM packages Lambda code
- CloudFormation creates/updates API Gateway, Lambda functions, DynamoDB tables, S3 bucket, IAM role, and outputs
- frontend deployment is separate through Amplify

Current backend base URL:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

The frontend consumes this via `VITE_API_BASE_URL`.

## 21. Backend Testing and Verification

Existing scripts:

### `backend/scripts/test_api_endpoints.py`

Smoke tests deployed API endpoints:

- `GET /health`
- `GET /dashboard`
- `POST /match`
- `POST /chat`
- `POST /response`
- `POST /impact-story`

Usage:

```bash
python backend/scripts/test_api_endpoints.py https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Note: this script does not call `/load-dataset` to avoid reloading data during a basic smoke test.

### `backend/scripts/run_local_handler.py`

Runs a handler locally with a JSON event file:

```bash
python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json
```

It adds the backend root to `sys.path`, imports the handler module, calls `lambda_handler(event, None)`, and prints pretty JSON.

### `backend/scripts/test_bedrock.py`

Calls Bedrock directly with the safe prompt:

```text
Say hello from Hemolytics.
```

It prints region, model ID, operation, success/failure, exception class, and exception message.

### `backend/scripts/deploy_sam.sh`

Runs syntax checks, SAM build, SAM deploy, and stack output listing.

### `backend/scripts/package_lambda.py`

Optional packaging helper present in the repo. SAM deployment is the primary deployment path.

Local events:

- `backend/events/health_event.json`
- `backend/events/dashboard_event.json`
- `backend/events/load_dataset_event.json`
- `backend/events/match_event.json`
- `backend/events/chat_event.json`
- `backend/events/response_event.json`
- `backend/events/impact_story_event.json`

Basic verification:

- `/health` returns healthy metadata
- `/dashboard` loads without timeout
- `/load-dataset` loads dataset and returns load metrics
- `/match` returns ranked donors or empty results
- `/chat` returns Bedrock or fallback message
- `/response` classifies reply and returns next action
- `/impact-story` returns generated or fallback awareness content

## 22. Backend Error Handling

Invalid input:

- malformed JSON returns HTTP `400`
- non-object JSON body returns HTTP `400`
- missing required fields return HTTP `400`

Missing body:

- `parse_json_body` returns `{}`
- this is valid for endpoints that can use defaults, such as `/load-dataset`
- handlers with required fields still validate and return `400`

DynamoDB failures:

- dashboard read failures return `500`
- match donor scan failures return `500`
- response save/update failures return `500`, except request update warnings are captured inside `apply_response_to_request`

S3 failures:

- missing S3 configuration can return `400`
- object read failures return `500`

Bedrock failures:

- Bedrock invocation errors are caught inside `bedrock_service.py`
- `/chat` returns safe outreach fallback
- `/impact-story` returns safe impact fallback
- responses include `bedrock_available: false`, `fallback_used: true`, and a non-sensitive `bedrock_error_type`

Serialization:

- DynamoDB `Decimal` values are converted before JSON response
- dates/datetimes serialize to ISO strings
- Python floats are converted to `Decimal` before DynamoDB write

Frontend safety:

- errors use JSON response bodies
- `src/services/api.ts` throws readable `API error <status>` messages
- frontend pages show visible loading/error states

## 23. Backend Security Boundaries

Current MVP protections and boundaries:

- no secrets are committed intentionally
- `.gitignore` excludes common local secrets and build artifacts
- `Dataset.csv` should not be committed to GitHub
- AWS credentials are not stored in code
- Lambda uses an IAM role rather than hardcoded credentials
- S3 dataset bucket is private in SAM configuration
- Bedrock fallback avoids exposing raw model failures to users
- no automatic outbound donor messaging is implemented
- no medical certification logic is implemented
- Impact Story content is designed to avoid patient PII and medical outcome claims

Current MVP limitations:

- no production authentication
- no role-based authorization
- permissive CORS for hackathon frontend access
- shared Lambda role rather than per-function least-privilege roles
- no WAF/rate limiting configuration in the template
- no audit log API
- no formal PII masking layer

Future production needs:

- authentication
- authorization/RBAC
- least-privilege IAM review
- origin-restricted CORS
- WAF and rate limiting
- PII masking
- audit logs
- consent handling
- security testing
- compliance/security review

This separation matters: the current backend is a hackathon MVP, while the listed future needs are production hardening requirements.

## 24. Backend Limitations

Current backend limitations:

- no auth/RBAC yet
- dashboard uses sampled analytics
- SmartMatch uses scan/ranking rather than production indexes or geospatial queries
- no caching layer
- no background jobs
- no EventBridge schedule for re-engagement workflows
- no SQS queue for asynchronous escalation
- no Step Functions request lifecycle state machine
- no DynamoDB Streams aggregation or audit workflow
- no donor availability API
- no coordinator assignment API
- no response history API
- no real WhatsApp sending or webhooks
- Bedrock may fall back depending on model access, model ID, IAM permissions, or region
- no production healthcare compliance certification

These limitations are acceptable for a hackathon MVP but must be addressed before real production use.

## 25. Future Backend Enhancements

The detailed roadmap is documented in:

```text
docs/FUTURE_ENHANCEMENTS.md
```

Future backend improvements may include:

- DynamoDB GSIs for faster donor/request access
- geospatial indexing for location-aware candidate queries
- cached candidate pools
- precomputed donor ranking jobs
- EventBridge scheduled jobs
- SQS queues for async outreach/escalation workflows
- Step Functions for request lifecycle orchestration
- DynamoDB Streams for derived metrics and audit trails
- authentication and RBAC
- WhatsApp Business API integration
- SMS/email notification integrations
- webhook processing for donor replies
- audit logging APIs
- CloudWatch alarms and dashboards
- budget/cost alerts
- WAF/rate limiting
- Secrets Manager or Parameter Store for sensitive runtime configuration
- stricter IAM boundaries
- production privacy/security hardening

These are future enhancements, not current deployed backend features unless implemented in the repository.

## 26. Backend Summary

The Hemolytics backend is a working AWS serverless MVP that supports dataset ingestion, donor intelligence, SmartMatch ranking, AI-assisted outreach, response tracking, and safe impact story generation.

It uses API Gateway and Lambda for API execution, DynamoDB for donor/request/response/conversation storage, S3 for dataset ingestion, Bedrock for safe AI-assisted text generation, CloudWatch for diagnostics, and SAM/CloudFormation for deployment.

The backend is designed for coordinator decision support. It must not be interpreted as donor medical approval, donor eligibility certification, donation completion confirmation, or blood safety certification. Production evolution should focus on authentication, privacy, auditability, optimized data access, communication integrations, workflow orchestration, monitoring, and compliance review.
