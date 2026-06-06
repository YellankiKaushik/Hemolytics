#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${BACKEND_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

if ! command -v sam >/dev/null 2>&1; then
  echo "AWS SAM CLI is not installed. Install it first: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-python}"

echo "Running Python syntax checks..."
"${PYTHON_BIN}" -m compileall backend

echo "Building SAM application..."
sam build --template-file backend/template.yaml

STACK_NAME="${STACK_NAME:-hemolytics-backend}"
REGION="${AWS_REGION:-us-east-1}"

if command -v aws >/dev/null 2>&1 && aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" >/dev/null 2>&1; then
  echo "Existing stack found. Deploying with samconfig.toml..."
  cd "${BACKEND_DIR}"
  sam deploy
else
  echo "No existing stack detected. Starting guided deploy..."
  cd "${BACKEND_DIR}"
  sam deploy --guided
fi

echo "Deployment outputs:"
sam list stack-outputs --stack-name "${STACK_NAME}" --region "${REGION}" || true
