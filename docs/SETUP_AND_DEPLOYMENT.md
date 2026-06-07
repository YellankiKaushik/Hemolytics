# Hemolytics Setup and Deployment

## Prerequisites

Local tools:

```bash
aws --version
sam --version
python --version
node --version
npm --version
git --version
```

Expected region:

```text
us-east-1
```

Do not store AWS credentials in code, `.env` files, or committed documentation. Use AWS CLI configuration, SSO, or temporary hackathon credentials.

## AWS Configuration

Configure AWS CLI:

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

## Bedrock Model Access

Manual AWS console step:

```text
AWS Console -> Bedrock -> Model access -> enable Anthropic Claude Haiku
```

Backend SAM default model:

```text
anthropic.claude-3-5-haiku-20241022-v1:0
```

If model access is restricted, AI endpoints return safe fallback output rather than failing the user workflow.

## Frontend Local Setup

Install dependencies:

```bash
npm install
```

Run local dev server:

```bash
npm run dev
```

Run production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Frontend Environment

Create a local uncommitted `.env.local` if needed:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Do not commit `.env.local`, `.env.production`, or real secrets.

If `VITE_API_BASE_URL` is absent, the app runs in Mock Mode.

## Backend Syntax Check

From repository root:

```bash
python -m compileall backend
```

## Backend Deploy with Script

From repository root:

```bash
bash backend/scripts/deploy_sam.sh
```

On Windows, use Git Bash or WSL if PowerShell cannot run Bash scripts.

## Backend Deploy Manually

From repository root:

```bash
sam build --template-file backend/template.yaml
sam deploy --guided
```

After first deployment, `backend/samconfig.toml` can be used by:

```bash
cd backend
sam deploy
```

## Dataset Upload

After SAM deploy, identify the dataset bucket from stack outputs. Upload the dataset as:

```text
Dataset.csv
```

AWS CLI command:

```bash
aws s3 cp path/to/Dataset.csv s3://<bucket-name>/Dataset.csv --region us-east-1
```

The browser does not upload CSV directly to S3 in this MVP. The frontend button calls `/load-dataset`, and Lambda reloads `Dataset.csv` from S3 into DynamoDB.

## API Smoke Test

After backend deployment:

```bash
python backend/scripts/test_api_endpoints.py <ApiUrl from SAM output>
```

Current live API:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

## Bedrock Diagnostic

Use the diagnostic helper:

```bash
python backend/scripts/test_bedrock.py
```

It sends a tiny safe prompt and prints success/failure, exception class, exception message, model ID, and region.

## Amplify Frontend Deployment

Amplify build file:

```text
amplify.yml
```

Build config:

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

Amplify steps:

1. AWS Console -> Amplify -> New app -> Host web app
2. Connect GitHub repository
3. Select branch `main`
4. Set environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

5. Deploy

## S3 Static Frontend Alternative

Build locally:

```bash
npm run build
```

Upload `dist/` to an S3 static website bucket if Amplify is not used. CloudFront is optional and not required for the hackathon MVP.

## Demo Verification Checklist

Verify:

- Landing page loads
- API Settings shows AWS Connected Mode
- `GET /health` works
- Dataset reload calls `/load-dataset`
- Dashboard shows sampled metrics
- SmartMatch returns top donor candidates
- AI Outreach returns Bedrock or safe fallback message
- Response Tracking classifies confirm/decline/reschedule/no response
- Escalation returns next donor when applicable
- Impact Story returns awareness content and safety notice
- Mobile layout has no horizontal scroll

## Cost Controls

Avoid adding:

- RDS
- NAT Gateway
- OpenSearch
- Redshift
- SageMaker endpoints
- EC2
- ECS/EKS
- Shield Advanced

Monitor:

- Lambda
- API Gateway
- DynamoDB
- S3
- CloudWatch Logs
- Bedrock

## Troubleshooting

If `npm` is broken on Windows:

- Close and reopen PowerShell after Node installation.
- Reinstall Node.js LTS with Windows installer or `winget`.
- Confirm `node --version` and `npm --version`.

If SAM deploy fails:

- Run `sam validate --template-file backend/template.yaml`.
- Confirm AWS credentials and region.
- Confirm the S3 bucket name is globally unique or leave the parameter blank for generated naming.

If Bedrock falls back:

- Confirm model access in the AWS Bedrock console.
- Confirm region is `us-east-1`.
- Check CloudWatch logs for `BEDROCK_INVOKE_ERROR`.
- Run `backend/scripts/test_bedrock.py`.

## Not Applicable

- Docker deployment
- App Runner deployment
- ECS/EKS cluster setup
- RDS migration
- Redis setup
- OpenAI or direct Anthropic key setup

