# Hemolytics — Setup and Deployment Guide

## 1. Deployment Overview

Hemolytics is deployed as a hackathon-ready AWS-backed MVP:

- React, Vite, TypeScript, and Tailwind CSS frontend on AWS Amplify.
- Serverless backend deployed with AWS SAM / CloudFormation.
- Amazon API Gateway exposing Lambda-backed endpoints.
- AWS Lambda handlers implemented in Python 3.11.
- Amazon DynamoDB tables for donor, request, conversation, and response records.
- Amazon S3 as the `Dataset.csv` source layer.
- AWS Bedrock Runtime for AI Outreach and Impact Story generation, with safe fallback behavior.
- Amazon CloudWatch Logs for Lambda execution logs and safe diagnostics.

This guide documents the actual MVP setup and deployment path used by the repository. It is suitable for demo, judging, portfolio, and future developer onboarding. It does not describe a fully hardened production healthcare deployment.

## 2. Live Deployment Links

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

## 3. Repository Setup

Clone the repository:

```bash
git clone https://github.com/YellankiKaushik/Hemolytics.git
cd Hemolytics
```

The local development folder used during the hackathon was:

```text
C:\Users\YellankiKaushik\Desktop\Projects\AI for Good Hackathon\HEMOLYTICS - Coding Files
```

That path is developer-specific. Other contributors only need the cloned GitHub repository.

## 4. Prerequisites

Required local tools:

- Git
- Node.js and npm
- Python 3.11-compatible runtime for backend syntax checks and SAM builds
- AWS CLI
- AWS SAM CLI
- Browser for local/frontend testing
- AWS account access with permissions to deploy CloudFormation/SAM resources
- AWS region: `us-east-1`

Useful version checks:

```bash
git --version
node --version
npm --version
python --version
aws --version
sam --version
```

Notes:

- The SAM template uses `Runtime: python3.11`.
- `package-lock.json` records Vite 7.x packages; use a modern Node.js version compatible with Vite 7.
- AWS credentials must come from AWS CLI configuration, SSO, environment-provided temporary credentials, or another secure AWS-supported mechanism. Do not commit credentials.

## 5. Frontend Local Setup

Frontend scripts are defined in `package.json`:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Standard path: use npm scripts.

Environment-specific note: if local npm is broken on a particular machine, a direct local Vite binary invocation may work after dependencies are installed, but that is a local workaround and not the documented deployment path.

## 6. Frontend Environment Variables

The frontend reads API configuration from `src/config/apiConfig.ts`:

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const IS_AWS_CONNECTED = API_BASE_URL.length > 0;
```

Required variable for AWS Connected Mode:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Behavior:

- If `VITE_API_BASE_URL` is set, the app calls the deployed API Gateway backend.
- If `VITE_API_BASE_URL` is empty, the app runs in Mock Mode with local mock data and client-side helpers.

Local setup:

```text
.env.local
```

Example local contents:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Repository example:

```text
.env.example
```

Current `.env.example` contains:

```text
VITE_API_BASE_URL=https://your-api-gateway-url
```

Do not commit `.env`, `.env.local`, `.env.production`, credentials, or secrets.

## 7. Frontend Deployment on AWS Amplify

The frontend is hosted on AWS Amplify and connected to the GitHub `main` branch. Amplify builds the Vite app and serves the generated `dist` directory.

Build configuration is defined in `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Amplify deployment steps:

1. Open AWS Console.
2. Go to Amplify.
3. Choose New app -> Host web app.
4. Connect GitHub.
5. Select repository `YellankiKaushik/Hemolytics`.
6. Select branch `main`.
7. Add environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

8. Deploy.

Important frontend config facts:

- There is no `vite.config.ts` or `vite.config.js` in the current repo.
- The app relies on Vite defaults.
- `tailwind.config.js` includes:

```js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

- `postcss.config.js` enables `tailwindcss` and `autoprefixer`.
- `index.html` mounts `/src/main.tsx`.

## 8. Frontend Deployment Verification

After Amplify deploys, verify:

- Landing page loads.
- Routes work:
  - `/`
  - `/dashboard`
  - `/dataset-ingestion`
  - `/smartmatch`
  - `/ai-outreach`
  - `/response-tracking`
  - `/impact-story`
  - `/api-settings`
- Sidebar/navigation works on desktop.
- Mobile drawer/navigation works on phone widths.
- No raw unstyled HTML appears; Tailwind CSS is applied.
- Dataset Ingestion can call the backend.
- Dashboard loads sampled data.
- SmartMatch returns ranked donor candidates.
- AI Outreach returns Bedrock or fallback output.
- Response Tracking classifies replies.
- Impact Story generates Bedrock or fallback content.
- API Settings shows AWS Connected Mode and the live API URL.

## 9. Backend Architecture Deployment Overview

The backend is deployed with AWS SAM. The main infrastructure file is:

```text
backend/template.yaml
```

The SAM template defines:

- API Gateway REST API `HemolyticsApi` with stage `Prod`.
- Seven Lambda functions.
- Four DynamoDB tables.
- Private S3 dataset bucket.
- Shared Lambda IAM role.
- Lambda environment variables.
- Bedrock `InvokeModel` permissions.
- CloudFormation outputs.

API Gateway routes:

| Method | Path | Lambda handler |
| --- | --- | --- |
| GET | `/health` | `handlers.health.lambda_handler` |
| GET | `/dashboard` | `handlers.dashboard.lambda_handler` |
| POST | `/load-dataset` | `handlers.load_dataset.lambda_handler` |
| POST | `/match` | `handlers.match.lambda_handler` |
| POST | `/chat` | `handlers.chat.lambda_handler` |
| POST | `/response` | `handlers.response.lambda_handler` |
| POST | `/impact-story` | `handlers.impact_story.lambda_handler` |

Lambda logs are available in CloudWatch Logs.

## 10. Backend Local/Build Setup

Backend folder structure:

```text
backend/
  handlers/
  services/
  scripts/
  events/
  template.yaml
  samconfig.toml
  env.example
  requirements.txt
  README.md
```

Python dependency file:

```text
backend/requirements.txt
```

Current dependency:

```text
boto3>=1.34.0
```

Lambda includes AWS SDK support in the runtime, but the repository keeps `boto3` in requirements for local/SAM consistency.

Syntax check from repository root:

```bash
python -m compileall backend
```

SAM build from repository root:

```bash
sam build --template-file backend/template.yaml
```

Local handler runner:

```bash
python backend/scripts/run_local_handler.py handlers.health backend/events/health_event.json
```

Sample event files exist in `backend/events/`:

- `health_event.json`
- `dashboard_event.json`
- `load_dataset_event.json`
- `match_event.json`
- `chat_event.json`
- `response_event.json`
- `impact_story_event.json`

Handlers that call DynamoDB, S3, or Bedrock require deployed AWS resources and credentials unless those services are mocked.

## 11. Backend Deployment with SAM

Primary deployment script:

```bash
bash backend/scripts/deploy_sam.sh
```

What the script does:

1. Runs Python syntax checks:

```bash
python -m compileall backend
```

2. Builds the SAM app:

```bash
sam build --template-file backend/template.yaml
```

3. Uses stack name:

```text
hemolytics-backend
```

4. Uses region:

```text
us-east-1
```

5. If the stack exists, runs `sam deploy` from `backend/`.
6. If the stack does not exist, runs `sam deploy --guided` from `backend/`.
7. Prints stack outputs with:

```bash
sam list stack-outputs --stack-name hemolytics-backend --region us-east-1
```

Manual first deploy:

```bash
sam build --template-file backend/template.yaml
cd backend
sam deploy --guided
```

Manual deploy after `backend/samconfig.toml` is configured:

```bash
cd backend
sam deploy
```

Non-interactive deploy equivalent using the current stack configuration:

```bash
sam build --template-file backend/template.yaml
sam deploy `
  --template-file .aws-sam/build/template.yaml `
  --stack-name hemolytics-backend `
  --region us-east-1 `
  --capabilities CAPABILITY_IAM `
  --resolve-s3 `
  --no-confirm-changeset
```

For Bash shells, replace PowerShell backticks with backslashes:

```bash
sam build --template-file backend/template.yaml
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name hemolytics-backend \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset
```

Current live backend API:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

AWS credentials and deployment permissions are required.

## 12. AWS Region and Account Notes

Region used:

```text
us-east-1
```

The SAM template and docs assume backend resources are deployed in `us-east-1`.

AWS account notes:

- Do not publish account credentials.
- Do not commit access keys.
- Do not store AWS credentials in frontend source.
- Use AWS CLI configuration, SSO, or temporary credentials.
- The browser should only know the API Gateway base URL, not AWS secrets.

AWS CLI setup:

```bash
aws configure
```

Use:

```text
Default region name: us-east-1
Default output format: json
```

Verify identity:

```bash
aws sts get-caller-identity
```

## 13. DynamoDB Deployment

The DynamoDB tables are defined in `backend/template.yaml` and created by SAM/CloudFormation.

| Table | Primary key | Purpose | Verification |
| --- | --- | --- | --- |
| `HemolyticsDonors` | `user_id` | Deduplicated donor/user profiles and derived scoring fields | Confirm item count after `/load-dataset`; dashboard and SmartMatch depend on it |
| `HemolyticsRequests` | `request_id` | Generated request/bridge candidate records and response status updates | Confirm request records after `/load-dataset`; response tracking can update request status |
| `HemolyticsResponses` | `response_id` | Donor response classification and escalation records | Submit `/response` and confirm a new response item |
| `HemolyticsConversations` | `conversation_id` | AI Outreach conversation/message records | Submit `/chat` and confirm returned `conversationId` |

All four tables use DynamoDB on-demand billing (`PAY_PER_REQUEST`) in the SAM template.

## 14. S3 Dataset Setup

The dataset source is:

```text
Dataset.csv
```

It is stored in the configured S3 dataset bucket and is not committed to GitHub.

SAM bucket behavior:

- Template resource: `DatasetBucket`
- If `DatasetBucketName` is blank, SAM generates:

```text
hemolytics-dataset-<account-id>-<region>
```

- Dataset key parameter defaults to:

```text
Dataset.csv
```

After backend deployment, identify the dataset bucket from SAM stack outputs:

```bash
sam list stack-outputs --stack-name hemolytics-backend --region us-east-1
```

Upload the dataset:

```bash
aws s3 cp path/to/Dataset.csv s3://<bucket-name>/Dataset.csv --region us-east-1
```

The browser does not upload CSV directly to S3 in this MVP. The Dataset Ingestion page triggers the backend to reload the already-uploaded S3 object into DynamoDB.

Do not include raw dataset rows in documentation or commits.

## 15. Dataset Ingestion Deployment Verification

Verify ingestion through the frontend:

1. Open the deployed app.
2. Go to Dataset Ingestion.
3. Click `Load / Reload Dataset from S3`.
4. Confirm success metrics appear.

Verify ingestion through API:

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/load-dataset" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Known successful dataset processing metrics:

| Metric | Value |
| --- | ---: |
| Rows loaded | 7,033 |
| Unique users created | 6,946 |
| Duplicate groups handled | 87 |
| Invalid/unknown blood groups flagged | 2,036 |
| Missing locations flagged | 24 |
| Donor records written | 6,946 |
| Request records written | 786 |

These are dataset processing and coordination-readiness metrics. They are not medical outcome metrics.

## 16. API Endpoint Verification

You can run the bundled smoke test:

```bash
python backend/scripts/test_api_endpoints.py https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Manual curl checks:

### `GET /health`

Purpose: confirm API Gateway and Lambda are reachable.

```bash
curl "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/health"
```

Expected high-level result: JSON with `status`, `app`, `version`, architecture metadata, region, and safety statement.

### `GET /dashboard`

Purpose: confirm DynamoDB donor/request reads and sampled analytics work.

```bash
curl "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/dashboard"
```

Expected high-level result: dashboard metrics, distributions, `sampledRecords`, and `dashboardMode`.

### `POST /load-dataset`

Purpose: confirm S3 dataset load and DynamoDB writes work.

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/load-dataset" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Expected high-level result: row counts, duplicate handling, donors written, requests written, `loadStatus`, and timestamp.

### `POST /match`

Purpose: confirm SmartMatch can read donors and rank candidates.

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/match" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-DEMO-001",
    "requiredBloodGroup": "O Positive",
    "latitude": 17.385,
    "longitude": 78.4867,
    "city": "Hyderabad",
    "urgency": "Critical",
    "quantityRequired": 1,
    "neededBy": "2026-06-30"
  }'
```

Expected high-level result: `results`, `matchTimeMs`, `totalCandidates`, and `eligibleCandidates`.

Safety note: results are prioritized for coordinator review, not donor approval.

### `POST /chat`

Purpose: confirm AI Outreach generation and conversation record persistence.

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "donor": {
      "user_id": "DONOR-DEMO-001",
      "name": "Demo Donor",
      "blood_group": "O Positive"
    },
    "request": {
      "request_id": "REQ-DEMO-001",
      "required_blood_group": "O Positive",
      "city": "Hyderabad",
      "urgency": "Critical",
      "quantity_required": 1
    },
    "tone": "WhatsApp-style",
    "language": "English"
  }'
```

Expected high-level result: `message`, `model`, `provider`, `safetyNotice`, `conversationId`, `bedrock_available`, and `fallback_used`.

Fallback behavior: if Bedrock is unavailable or model access is restricted, the API returns a safe fallback message.

### `POST /response`

Purpose: confirm donor response classification and escalation state.

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/response" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-DEMO-001",
    "donorId": "DONOR-DEMO-001",
    "responseText": "Yes, I am available",
    "currentRank": 1,
    "rankedDonors": [
      { "rank": 1, "donor_id": "DONOR-DEMO-001" },
      { "rank": 2, "donor_id": "DONOR-DEMO-002" }
    ]
  }'
```

Expected high-level result: `detectedIntent`, `responseStatus`, `aiSummary`, `nextAction`, `escalationTriggered`, `nextDonorId`, and `updatedRequestStatus`.

### `POST /impact-story`

Purpose: confirm anonymized awareness content generation.

```bash
curl -X POST "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/impact-story" \
  -H "Content-Type: application/json" \
  -d '{
    "donorsContacted": 25,
    "responsesReceived": 8,
    "potentialMatches": 3,
    "campaignCity": "Hyderabad",
    "bloodGroup": "O Positive",
    "patientSafeContext": "Anonymized recurring transfusion support request",
    "tone": "warm"
  }'
```

Expected high-level result: `awarenessMessage`, `socialPost`, `coordinatorSummary`, `safetyNotice`, and Bedrock/fallback flags.

Fallback behavior: if Bedrock is unavailable, the API returns safe deterministic fallback awareness content.

## 17. Bedrock Setup and Fallback Verification

Bedrock is used by:

- AI Outreach: `POST /chat`
- Impact Story: `POST /impact-story`

Current backend model configuration:

```text
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
AWS_BEDROCK_FALLBACK_MODEL_ID=anthropic.claude-3-5-haiku-20241022-v1:0
```

Manual AWS console step:

```text
AWS Console -> Bedrock -> Model access -> enable Anthropic Claude Haiku
```

Model access can depend on account permissions, region, model availability, and IAM policy. The MVP is designed so the demo still works when Bedrock invocation fails:

- `/chat` returns a safe outreach fallback.
- `/impact-story` returns safe fallback awareness content.
- Responses include `bedrock_available` and `fallback_used`.
- When fallback is used, a non-sensitive `bedrock_error_type` may be returned.

Run direct diagnostic:

```bash
python backend/scripts/test_bedrock.py
```

The diagnostic uses a tiny safe prompt:

```text
Say hello from Hemolytics.
```

It prints success/failure, exception class, exception message, model ID, and region. Do not paste AWS credentials or secrets into diagnostics.

## 18. CloudWatch Logs and Debugging

Lambda logs are available in Amazon CloudWatch Logs. They are useful for debugging:

- API Gateway/Lambda invocation failures.
- Dataset ingestion errors.
- S3 bucket/key configuration issues.
- DynamoDB write/read errors.
- Dashboard timeout or scan performance issues.
- Bedrock fallback causes.
- Unexpected handler exceptions.

Safe Bedrock diagnostic log pattern:

```text
BEDROCK_INVOKE_ERROR: <ExceptionType>: <message> | model_id=<model> | bedrock_region=<region> | operation=invoke_model | fallback_used=true
```

Logging boundary:

- Do not log AWS credentials.
- Do not log secrets.
- Do not log raw private dataset rows.
- Do not log patient PII.
- Avoid logging full prompts when they may include donor/request context.

## 19. GitHub Repo Hygiene

`.gitignore` protects:

- `node_modules/`
- `dist/`
- `.env*`
- `!.env.example`
- `.aws-sam/`
- `backend/.aws-sam/`
- `backend/.build/`
- `__pycache__/`
- `**/__pycache__/`
- `*.pyc`
- `Dataset.csv`
- `*.zip`
- credentials patterns
- `.aws/`
- `.DS_Store`

Before any commit:

```bash
git status
```

Do not commit:

- `.env`
- `.env.local`
- `.env.production`
- `Dataset.csv`
- AWS credentials
- `node_modules/`
- `dist/`
- `.aws-sam/`
- zip files
- pycache files
- secrets or access keys

## 20. Build and Deployment Commands Summary

| Purpose | Command | Where to run | Notes |
| --- | --- | --- | --- |
| Clone repo | `git clone https://github.com/YellankiKaushik/Hemolytics.git` | parent folder | First-time setup |
| Enter repo | `cd Hemolytics` | parent folder | Use cloned folder |
| Check repo status | `git status` | repo root | Use before staging/committing |
| Install frontend deps | `npm install` | repo root | Uses `package-lock.json` |
| Run frontend dev | `npm run dev` | repo root | Starts Vite dev server |
| Build frontend | `npm run build` | repo root | Produces `dist/` |
| Preview frontend build | `npm run preview` | repo root | Serves built Vite output |
| Backend syntax check | `python -m compileall backend` | repo root | Also run by deploy script |
| SAM validate | `sam validate --template-file backend/template.yaml` | repo root | Useful before deploy |
| SAM build | `sam build --template-file backend/template.yaml` | repo root | Builds backend |
| Scripted backend deploy | `bash backend/scripts/deploy_sam.sh` | repo root | Uses guided deploy on first stack |
| Manual first backend deploy | `sam deploy --guided` | `backend/` after build | Writes/uses `samconfig.toml` |
| Manual subsequent deploy | `sam deploy` | `backend/` | Uses `samconfig.toml` |
| List stack outputs | `sam list stack-outputs --stack-name hemolytics-backend --region us-east-1` | repo root or backend | Finds API URL and dataset bucket |
| Upload dataset | `aws s3 cp path/to/Dataset.csv s3://<bucket-name>/Dataset.csv --region us-east-1` | anywhere | Do not commit dataset |
| Smoke test API | `python backend/scripts/test_api_endpoints.py <ApiUrl>` | repo root | Tests core endpoints |
| Bedrock diagnostic | `python backend/scripts/test_bedrock.py` | repo root | Requires AWS credentials/model access |
| Stage setup doc | `git add docs/SETUP_AND_DEPLOYMENT.md` | repo root | Stage only intended file |
| Commit | `git commit -m "..."` | repo root | Use descriptive message |
| Push | `git push origin main` | repo root | Triggers Amplify frontend deploy |

## 21. Common Issues and Fixes

### Local npm is broken or missing

Symptoms:

- `npm --version` fails.
- Node was installed but PowerShell still cannot find npm.
- Errors mention missing `npm-cli.js`.

Fixes:

- Close and reopen PowerShell after installing Node.js.
- Reinstall Node.js LTS.
- Verify:

```bash
node --version
npm --version
```

Direct Vite execution can be a machine-specific workaround after dependencies exist, but the standard command remains `npm run build`.

### Amplify deployed unstyled/raw HTML

Likely causes:

- Tailwind directives missing from global CSS.
- `src/main.tsx` missing global CSS import.
- Tailwind content paths incorrect.
- PostCSS config missing Tailwind/autoprefixer.
- Amplify artifact directory not set to `dist`.

Current repo safeguards:

- `tailwind.config.js` scans `index.html` and `src/**/*.{js,ts,jsx,tsx}`.
- `postcss.config.js` enables Tailwind and Autoprefixer.
- `amplify.yml` uses `npm run build` and `dist`.

### Wrong `VITE_API_BASE_URL`

Symptoms:

- API Settings shows Mock Mode.
- Backend data does not load.
- Fetch errors appear in pages.

Fix:

- Set Amplify environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

- Redeploy frontend after changing Amplify env vars.

### API Gateway URL typo

Symptoms:

- Health endpoint fails.
- CORS/fetch errors.
- API Settings displays an unexpected base URL.

Fix:

```bash
curl "https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod/health"
```

Confirm the URL has `/Prod` at the end.

### SAM deploy fails

Checks:

```bash
sam validate --template-file backend/template.yaml
aws sts get-caller-identity
```

Common causes:

- AWS credentials not configured.
- Wrong region.
- Missing IAM/CloudFormation permissions.
- Custom S3 bucket name already taken.
- Bedrock/IAM permissions changed.

### Dataset ingestion duplicate key error

Original risk: DynamoDB `BatchWriteItem` cannot receive duplicate primary keys in the same batch.

Current fix:

- donor profiles are deduplicated by `user_id`
- request records receive unique `request_id`
- `batch_write_items(..., key_name=...)` includes a final duplicate-key safety guard

### Dashboard timeout risk

Original risk: scanning the full real dataset synchronously could cause API Gateway 502/Lambda timeout.

Current fix:

- dashboard uses `scan_limited()`
- donor sample defaults to `1000`
- request sample defaults to `500`
- response includes `dashboardMode: "sampled"`

### Bedrock model access restriction

Symptoms:

- `/chat` or `/impact-story` returns `fallback_used: true`
- CloudWatch logs show `BEDROCK_INVOKE_ERROR`

Fixes:

- Confirm Bedrock model access in `us-east-1`.
- Confirm IAM allows `bedrock:InvokeModel`.
- Run:

```bash
python backend/scripts/test_bedrock.py
```

Fallback output is expected and safe when Bedrock is unavailable.

### Mobile/sidebar layout regression

After frontend deployment, verify:

- desktop sidebar is stable
- mobile drawer opens/closes
- no horizontal scrolling
- cards/forms stack on mobile
- API Settings URL wraps safely

## 22. Production Deployment Limitations

Current MVP deployment limitations:

- no production authentication/RBAC
- no WAF/rate limiting
- no production compliance certification
- no full CI/CD test gate
- no separate dev/staging/prod stacks
- no automated backup/restore documentation
- no production Secrets Manager/Parameter Store workflow
- no CloudWatch alarms/budget alerts configured as code
- no DynamoDB GSIs/geospatial indexing
- no production WhatsApp/SMS/email sending
- no audit approval workflow

These are future production hardening tasks, not blockers for the hackathon MVP demo.

See `docs/FUTURE_ENHANCEMENTS.md` for the broader roadmap.

## 23. Recommended Future Deployment Improvements

Recommended deployment improvements:

- Separate AWS dev, staging, and production environments.
- Separate frontend/backend environment variables per environment.
- CI/CD checks before deploy.
- Automated frontend build validation.
- Backend unit and integration tests.
- API contract tests.
- SAM validation in CI.
- Secrets Manager or Parameter Store for sensitive config.
- WAF/rate limiting for public APIs.
- CloudWatch alarms for Lambda errors, throttles, duration, and API 5xxs.
- AWS budget alerts.
- DynamoDB backup and restore plan.
- Rollback playbook.
- Auth/RBAC.
- Audit logs for sensitive actions.
- Per-function least-privilege IAM roles.

## 24. Final Deployment Checklist

- [ ] GitHub repo is clean.
- [ ] No `.env` files are staged.
- [ ] No `Dataset.csv` is staged.
- [ ] No AWS credentials are staged.
- [ ] No `node_modules/`, `dist/`, `.aws-sam/`, zip, or pycache files are staged.
- [ ] `npm install` succeeds.
- [ ] `npm run build` succeeds.
- [ ] Amplify deploy passes.
- [ ] `VITE_API_BASE_URL` is configured in Amplify.
- [ ] `python -m compileall backend` succeeds.
- [ ] `sam build --template-file backend/template.yaml` succeeds.
- [ ] `sam deploy` succeeds.
- [ ] `/health` works.
- [ ] `/dashboard` works.
- [ ] `/load-dataset` works.
- [ ] `/match` works.
- [ ] `/chat` returns Bedrock or fallback output.
- [ ] `/response` works.
- [ ] `/impact-story` returns Bedrock or fallback output.
- [ ] Dataset metrics appear after ingestion.
- [ ] Mobile layout is verified.
- [ ] API Settings shows AWS Connected Mode.
- [ ] Documentation is updated.

## 25. Setup and Deployment Summary

Hemolytics is deployed as a live AWS-backed hackathon MVP with a React/Vite/Tailwind frontend on AWS Amplify and a serverless backend on API Gateway, Lambda, DynamoDB, S3, Bedrock, and CloudWatch. The frontend and backend are deployed separately: Amplify hosts the static app, while SAM/CloudFormation manages backend infrastructure.

The deployment is suitable for demo, portfolio presentation, GitHub review, and future developer onboarding. Production deployment would require additional hardening, including authentication, role-based access, monitoring alarms, budget controls, compliance review, secure secrets management, optimized DynamoDB access patterns, audit logs, and formal rollback/backup plans.
