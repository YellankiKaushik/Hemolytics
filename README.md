# Hemolytics

Hemolytics is an AWS serverless MVP for blood donation coordination. It helps coordinators ingest donor/request data, view dashboard metrics, run SmartMatch prioritization, generate safe outreach, classify donor responses, and create anonymized awareness messages.

## Architecture

- Frontend: React + Vite + Tailwind
- Backend: API Gateway + Lambda + DynamoDB + AWS Bedrock Claude 3 Haiku + S3 + CloudWatch
- Frontend hosting: AWS Amplify Hosting or S3 static hosting
- Backend deployment: AWS SAM

Live backend API:

```text
https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

For production hosting, set this through environment variables instead of hardcoding it in source:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

## Run Locally

Install dependencies:

```bash
npm install
```

Run the frontend locally:

```bash
npm run dev
```

Without `VITE_API_BASE_URL`, the frontend runs in Mock Mode. With `VITE_API_BASE_URL`, it calls the deployed AWS backend.

## Build Frontend

Create a local environment file only on your machine:

```text
.env.production
```

Add:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

Then build:

```bash
npm run build
```

Do not commit `.env.production`.

## Deploy Backend With SAM

The backend remains separate from Amplify and is deployed through SAM/API Gateway.

Prerequisites:

- AWS CLI configured
- AWS SAM CLI installed
- Region: `us-east-1`
- Bedrock model access enabled for `anthropic.claude-3-haiku-20240307-v1:0`

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

## Deploy Frontend With Amplify

1. Push this repo to GitHub.
2. Open AWS Console -> Amplify.
3. Choose New app -> Host web app.
4. Choose GitHub.
5. Select `YellankiKaushik/Hemolytics`.
6. Select branch `main`.
7. Add environment variable:

```text
VITE_API_BASE_URL=https://w1nxgpj5ng.execute-api.us-east-1.amazonaws.com/Prod
```

8. Use the included `amplify.yml` build settings.
9. Deploy.

## Safety Note

Hemolytics does not certify donor health, donor eligibility, or blood safety. It assists coordinators with prioritization, outreach, response understanding, and awareness messaging. Final decisions remain with authorized human and medical staff.

## Data And Secrets

Do not commit:

- AWS credentials
- `.env` files with real values
- `Dataset.csv` if it contains real or sensitive rows
- build artifacts such as `dist/`
