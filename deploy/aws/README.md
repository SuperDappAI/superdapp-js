# AWS Lambda Deployment

This directory contains configuration for deploying SuperDapp agents to AWS Lambda.

## Prerequisites

1. Install AWS CLI:
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. Install SAM CLI:
   ```bash
   wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
   unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
   sudo ./sam-installation/install
   ```

3. Configure AWS credentials:
   ```bash
   aws configure
   ```

## Deployment

### Build and Deploy
```bash
# Build the project
npm run build

# Deploy to staging
sam build
sam deploy --parameter-overrides Environment=staging ApiToken=your-token

# Deploy to production
sam deploy --parameter-overrides Environment=production ApiToken=your-token
```

### Local Testing
```bash
# Start local API
sam local start-api

# Invoke function locally
sam local invoke SuperDappAgentFunction --event events/scheduled.json
```

## Configuration

- `template.yaml`: SAM template with Lambda function configuration
- `trust-policy.json`: IAM role trust policy
- `events/`: Sample event payloads for testing

## Monitoring

View logs:
```bash
sam logs -n SuperDappAgentFunction --stack-name superdapp-agent-staging --tail
```

View metrics in CloudWatch console.
