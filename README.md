# Hemolytics

Hemolytics is an AI-powered blood donation coordination platform built for Blood Warriors and the AI for Good Hackathon. It helps coordinators load donor/request data, understand dataset readiness, prioritize donor outreach, classify responses, handle escalation, and generate safe anonymized awareness content.

## Live Links

- Frontend: https://main.d2sj4v5ffjc9ah.amplifyapp.com
- Backend API: https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
- GitHub: https://github.com/YellankiKaushik/Hemolytics

## Technical Documentation

- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Documentation](docs/DATABASE_DOCUMENTATION.md)
- [Frontend Documentation](docs/FRONTEND_DOCUMENTATION.md)
- [Backend Documentation](docs/BACKEND_DOCUMENTATION.md)
- [Setup and Deployment](docs/SETUP_AND_DEPLOYMENT.md)
- [Hackathon Project Summary](docs/HACKATHON_PROJECT_SUMMARY.md)

## Architecture

- Frontend: React + Vite + Tailwind, hosted on AWS Amplify
- Backend: Amazon API Gateway + AWS Lambda
- Data store: Amazon DynamoDB
- Dataset storage: Amazon S3 dataset bucket with `Dataset.csv`
- AI: AWS Bedrock Claude Haiku with safe fallback behavior
- Observability: Amazon CloudWatch Logs

The backend intentionally avoids PostgreSQL/RDS as primary storage, Redis, FastAPI as the primary backend, App Runner as the default runtime, mandatory Docker/ECR, direct Anthropic API calls, direct OpenAI API calls, production WhatsApp API, SageMaker pipelines, and a full community platform.

## Core Features

- Dataset ingestion from S3 into DynamoDB
- Dashboard metrics for donor network, data quality, requests, and re-engagement
- SmartMatch donor prioritization for coordinator review
- AI Outreach message drafting through AWS Bedrock
- Response Tracking with donor intent classification and escalation status
- Impact Story generation for anonymized awareness messaging
- API Settings / AWS visibility page for demo transparency

## Dataset Load Stats

Latest successful dataset load:

- 7,033 rows loaded
- 6,946 unique users
- 786 request records
- 87 duplicate user groups handled
- 2,036 invalid/unknown blood groups flagged
- 24 missing locations flagged

## Safety Statement

Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human/medical staff.

## Bedrock Fallback Note

AI Outreach and Impact Story are wired through AWS Bedrock with safe fallback behavior. If a selected model is restricted by AWS account/model permissions, the app returns safe coordinator-ready fallback output instead of failing.

Current backend configuration uses an active Claude Haiku model ID:

```text
anthropic.claude-3-5-haiku-20241022-v1:0
```

## Run Locally

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Without `VITE_API_BASE_URL`, the frontend runs in Mock Mode. With `VITE_API_BASE_URL`, it calls the deployed AWS backend.

## Frontend Build

Set the backend URL only in your local or Amplify environment, not in committed source files:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Build:

```bash
npm run build
```

## Backend Deployment

The backend is deployed separately with AWS SAM.

Prerequisites:

- AWS CLI configured
- AWS SAM CLI installed
- Region: `us-east-1`
- Bedrock model access enabled for Claude Haiku in AWS Bedrock

Deploy:

```bash
bash backend/scripts/deploy_sam.sh
```

After deployment, upload the dataset CSV to the SAM output bucket as `Dataset.csv`:

```bash
aws s3 cp path/to/Dataset.csv s3://<bucket-name>/Dataset.csv --region us-east-1
```

Test the API:

```bash
python backend/scripts/test_api_endpoints.py <ApiUrl from SAM output>
```

## Frontend Deployment

AWS Amplify Hosting is configured through `amplify.yml`.

1. Connect this GitHub repository to Amplify.
2. Select branch `main`.
3. Add environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

4. Deploy.

## Production Roadmap

- WhatsApp Business API integration
- Patient/coordinator notifications
- Donor mobile experience
- Emergency broadcast workflow
- Community awareness campaigns
- Role-based access and audit approvals
- DynamoDB GSI optimization
- Background jobs and escalation workflows

## Repository Hygiene

Do not commit:

- AWS credentials
- `.env` files with real values
- `Dataset.csv` if it contains real or sensitive rows
- `node_modules/`
- `dist/`
- SAM build artifacts
- zip packages
