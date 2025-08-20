import fs from 'fs/promises';
import path from 'path';

interface ProjectConfig {
  name: string;
  template?: string;
  runtime: string;
  description: string;
}

interface TemplateFile {
  path: string;
  content: string;
}

export async function createProjectStructure(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Create main directory
  await fs.mkdir(projectPath, { recursive: true });

  // Get template files
  const templateFiles = getTemplateFiles(config);

  // Create all files
  for (const file of templateFiles) {
    const filePath = path.join(projectPath, file.path);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file.content);
  }
}

function getPackageJsonForRuntime(config: ProjectConfig): any {
  const basePackage = {
    name: config.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: '1.0.0',
    description: config.description,
    main: 'dist/index.js',
    dependencies: {
      '@superdapp/agents': '^1.0.0',
    },
    devDependencies: {
      '@types/node': '^20.12.12',
      typescript: '^5.4.5',
    },
  };

  switch (config.runtime) {
    case 'node':
      return {
        ...basePackage,
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
          dev: 'tsx watch src/index.ts',
          clean: 'rm -rf dist',
        },
        dependencies: {
          ...basePackage.dependencies,
          dotenv: '^16.4.5',
          express: '^4.18.2',
          cors: '^2.8.5',
        },
        devDependencies: {
          ...basePackage.devDependencies,
          tsx: '^4.10.5',
          '@types/express': '^4.17.21',
          '@types/cors': '^2.8.17',
        },
        engines: {
          node: '>=18.0.0',
        },
      };

    case 'cloudflare':
      return {
        ...basePackage,
        scripts: {
          build: 'tsc',
          dev: 'wrangler dev',
          deploy: 'wrangler deploy',
          'deploy:staging': 'wrangler deploy --env staging',
          'deploy:production': 'wrangler deploy --env production',
          'cf-typegen': 'wrangler types',
        },
        devDependencies: {
          ...basePackage.devDependencies,
          wrangler: '^4.19.2',
          '@cloudflare/workers-types': '^4.20240208.0',
        },
      };

    case 'aws':
      return {
        ...basePackage,
        scripts: {
          bundle:
            'esbuild src/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js',
          build: 'npm run bundle && sam build',
          dev: 'sam local start-api --docker-network host --env-vars env.json --port 8787',
          'deploy:dev':
            'npm run build && sam deploy --config-env development --resolve-s3',
          'deploy:prod':
            'npm run build && sam deploy --config-env production --resolve-s3',
          'undeploy:dev':
            'sam delete --stack-name my-bot-development --region us-east-2',
          'undeploy:prod':
            'sam delete --stack-name my-bot-production --region us-east-2',
        },
        devDependencies: {
          ...basePackage.devDependencies,
          esbuild: '^0.25.9',
        },
      };

    default:
      return basePackage;
  }
}

function getBaseFiles(config: ProjectConfig): TemplateFile[] {
  // Generate package.json based on runtime
  const packageJson = getPackageJsonForRuntime(config);

  const baseFiles: TemplateFile[] = [
    {
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
    },
  ];

  // Include tsconfig.json for all runtimes
  baseFiles.push({
    path: 'tsconfig.json',
    content: JSON.stringify(
      {
        compilerOptions: {
          target: 'es2021',
          lib: ['es2021'],
          module: 'commonjs',
          moduleResolution: 'node',
          outDir: './dist',
          rootDir: './src',
          resolveJsonModule: true,
          allowJs: true,
          checkJs: false,
          isolatedModules: true,
          allowSyntheticDefaultImports: true,
          forceConsistentCasingInFileNames: true,
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    ),
  });

  baseFiles.push(
    {
      path: {
        aws: 'env.json',
        node: '.env.example',
        cloudflare: '.dev.vars',
      }[config.runtime || 'node'] as string,
      content:
        config.runtime === 'aws'
          ? `{
  "myBotFunction": {
    "API_TOKEN": "your_api_token_here",
    "API_BASE_URL": "https://api.superdapp.ai",
    "NODE_ENV": "production"
  }
}`
          : `# SuperDapp Agent Configuration
API_TOKEN=your_api_token_here
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development # or production
PORT=8787
`,
    },
    {
      path: '.gitignore',
      content: `node_modules/
dist/
*.log
.env
.env.local
.DS_Store
Thumbs.db
`,
    },
    {
      path: 'README.md',
      content: getReadmeContent(config),
    }
  );

  return baseFiles;
}

export function getTemplateFiles(config: ProjectConfig): TemplateFile[] {
  const baseFiles = getBaseFiles(config);
  const runtimeFiles = getRuntimeFiles(config);

  return [...baseFiles, ...runtimeFiles];
}

function getRuntimeFiles(config: ProjectConfig): TemplateFile[] {
  switch (config.runtime) {
    case 'cloudflare':
      return getCloudflareFiles(config);
    case 'aws':
      return getAWSFiles(config);
    case 'node':
    default:
      return getNodeFiles(config);
  }
}

function getNodeFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'src/index.ts',
      content: `
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

async function main() {
  try {
    // Initialize the agent
    const agent = new SuperDappAgent(createBotConfig());

    // Add basic commands
    agent.addCommand('/start', async ({ roomId }) => {
      await agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm your agent. Type \`/help\` to see available commands."
      );
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: '${config.name.toLowerCase()}-agent',
        runtime: 'node'
      });
    });

    // Webhook endpoint
    app.post('/webhook', async (req, res) => {
      try {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const response = await agent.processRequest(body);
        
        res.status(200).json(response);
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(\`🚀 ${config.name} webhook server is running on port \${PORT}\`);
      console.log(\`📡 Webhook endpoint: http://localhost:\${PORT}/webhook\`);
      console.log(\`🏥 Health check: http://localhost:\${PORT}/health\`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
`,
    },
  ];
}

function getCloudflareFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'es2021',
            lib: ['es2021'],
            module: 'es2022',
            moduleResolution: 'node',
            resolveJsonModule: true,
            allowJs: true,
            checkJs: false,
            noEmit: true,
            isolatedModules: true,
            allowSyntheticDefaultImports: true,
            forceConsistentCasingInFileNames: true,
            strict: true,
            skipLibCheck: true,
            types: ['./worker-configuration.d.ts'],
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      ),
    },
    {
      path: 'src/index.ts',
      content: `import { SuperDappAgent, createBotConfig } from '@superdapp/agents';
import { DurableObject } from 'cloudflare:workers';

interface Env {
  API_TOKEN: string;
  API_BASE_URL: string;
  AGENT: DurableObjectNamespace;
}

export class Agent extends DurableObject<Env> {
  private agent: SuperDappAgent;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize the agent for Cloudflare Workers
    this.agent = new SuperDappAgent(createBotConfig());

    this.setupCommands();
  }

  private setupCommands() {
    // Add basic commands
    this.agent.addCommand('/start', async ({ roomId }) => {
      await this.agent.sendConnectionMessage(
        roomId,
        "👋 **Hello!** I'm your SuperDapp agent running on Cloudflare Workers. Type \`/help\` to see available commands."
      );
    });
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (request.method === "POST" && path === "/webhook") {
        const body = await request.text();
        
        // Handle the request through our agent
        const response = await this.agent.processRequest(body);

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (request.method === "GET" && path === "/health") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "${config.name.toLowerCase()}-agent",
            runtime: "cloudflare-workers"
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response("Not found", {
        status: 404,
      });
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal Server Error", {
        status: 500,
      });
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const id = env.AGENT.idFromName("${config.name.toLowerCase()}-agent");
    const stub = env.AGENT.get(id);
    return await stub.fetch(request);
  },

  async scheduled(event: any, env: Env) {
    console.log('[SCHEDULER] Triggered at ' + new Date().toISOString());
    console.log('[SCHEDULER] Cron expression: ' + event.cron);
    
    // Add your scheduled tasks here
    console.log('[SCHEDULER] Job completed at ' + new Date().toISOString());
  },
} satisfies ExportedHandler<Env>;
`,
    },
    {
      path: 'wrangler.toml',
      content: `name = "${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}"
main = "src/index.ts"
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2025-08-18"

[env.production]
name = "${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-production"

[env.development]
name = "${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-development"

# Environment variables
[vars]
API_TOKEN = ""
API_BASE_URL = ""

# Durable Objects
[[durable_objects.bindings]]
name = "AGENT"
class_name = "Agent"

[[migrations]]
new_sqlite_classes = ["Agent"]
tag = "v1"

# Triggers (optional - uncomment to enable scheduled tasks)
# [triggers]
# crons = ["0 */6 * * *"]  # Every 6 hours
`,
    },
  ];
}

function getAWSFiles(config: ProjectConfig): TemplateFile[] {
  return [
    {
      path: 'src/index.ts',
      content: `import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

// Initialize the agent for AWS Lambda
const agent = new SuperDappAgent(createBotConfig());

// Add basic commands
agent.addCommand('/start', async ({ roomId }) => {
  await agent.sendConnectionMessage(
    roomId,
    "👋 **Hello!** I'm your SuperDapp agent running on AWS Lambda. Type \`/help\` to see available commands."
  );
});

// Export the handler for AWS Lambda
export const handler = async (event: any, context: any) => {
  try {
    // Handle the request through our agent
    const body = event.body || '';
    const response = await agent.processRequest(body);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
`,
    },
    {
      path: 'template.yaml',
      content: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: ${config.description}

Parameters:
  Environment:
    Type: String
    Default: staging
    AllowedValues: [staging, production]
    Description: Deployment environment

  ApiToken:
    Type: String
    NoEcho: true
    Description: SuperDapp API Token

  ApiBaseUrl:
    Type: String
    Default: https://api.superdapp.ai
    Description: SuperDapp API Base URL

Resources:
  myBotFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "\${config.name}-\${Environment}"
      CodeUri: ./dist/
      Handler: index.handler
      Runtime: nodejs18.x
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          NODE_ENV: !Ref Environment
          API_TOKEN: !Ref ApiToken
          API_BASE_URL: !Ref ApiBaseUrl
      Events:
        HttpApi:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com/"
        `,
    },
    {
      path: 'samconfig.toml',
      content: `
version = 0.1

[development]
[development.deploy]
[development.deploy.parameters]
stack_name = "my-bot-development"
region = "us-east-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Environment=development ApiToken=your_api_token ApiBaseUrl=https://api.superdapp.dev"

[production]
[production.deploy]
[production.deploy.parameters]
stack_name = "my-bot-production"
region = "us-east-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Environment=production ApiToken=your_api_token ApiBaseUrl=https://api.superdapp.ai"
      `,
    },
  ];
}

function getReadmeContent(config: ProjectConfig): string {
  const awsSection =
    config.runtime === 'aws'
      ? `

## AWS SAM CLI Setup

This project uses AWS SAM (Serverless Application Model) for deployment. Choose your platform and follow the instructions to install the AWS SAM CLI orcheck the [AWS SAM CLI documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) for more information.

1. **macOS:**
   \`\`\`bash
   # Download the latest version for your architecture
   curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-macos-x86_64.pkg -o sam-cli.pkg
   sudo installer -pkg sam-cli.pkg -target /
   
   # For Apple Silicon Macs
   curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-macos-arm64.pkg -o sam-cli.pkg
   sudo installer -pkg sam-cli.pkg -target /
   \`\`\`

2. **Linux:**
   \`\`\`bash
   # Download and extract the latest version
   curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam-cli.zip
   unzip sam-cli.zip -d sam-installation
   sudo ./sam-installation/install
   \`\`\`

3. **Windows:**
   \`\`\`cmd
   # Download the MSI installer
   curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi -o aws-sam-cli-windows-x86_64.msi
   
   # Install silently
   msiexec /i aws-sam-cli-windows-x86_64.msi /quiet
   \`\`\`
   
   Or download the MSI installer from the [AWS SAM CLI documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

### AWS Configuration

After installing SAM CLI, configure your AWS credentials:

\`\`\`bash
aws configure
\`\`\`

You'll need to provide:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### AWS Commands

- \`npm run dev\` - Start local API Gateway for testing
- \`npm run deploy:dev\` - Deploy to development environment
- \`npm run deploy:prod\` - Deploy to production environment

`
      : '';

  return `# ${config.name}

${config.description}

## Getting Started

${awsSection}

1. Install dependencies:
  \`\`\`
  npm install
  \`\`\`

2. Configure your environment:
  \`\`\`
  superagent configure
  \`\`\`

${
  config.runtime === 'cloudflare'
    ? `
  npm run cf-typegen
  `
    : ''
}

3. Run the agent:
${
  config.runtime === 'aws'
    ? `
  npm run build
  `
    : `
   \`\`\`bash
   npm run dev
   \`\`\`
  `
}

## Configuration

${
  config.runtime === 'node'
    ? `
Copy \`.env.example\` to \`.env\` and fill in your configuration:
\`\`\`
API_TOKEN=your_superdapp_api_token
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development # use development for local development, production for production
\`\`\``
    : ''
}

## Commands

${config.runtime === 'node' ? '- \`npm start\` - Run the compiled agent' : ''}
- \`npm run dev\` - Run the agent in development mode with hot reload
- \`npm run build\` - Build the TypeScript code${
    config.runtime === 'cloudflare'
      ? `
- \`npm run cf-typegen\` - Generate Cloudflare Workers types`
      : ''
  }
${
  config.runtime === 'aws'
    ? `
- \`npm run deploy:dev\` - Deploy to development environment
- \`npm run deploy:prod\` - Deploy to production environment`
    : ''
}

## Development

This agent is built using the SuperDapp Agents SDK. You can extend its functionality by:

1. Adding new command handlers
2. Integrating with external APIs
3. Implementing custom business logic
4. Adding scheduled tasks


## Deployment

Deploy your agent using the platform-specific commands:

${
  config.runtime === 'aws'
    ? `
- \`npm run deploy:dev\` - Deploy to development environment
- \`npm run deploy:prod\` - Deploy to production environment`
    : ''
}

${
  config.runtime === 'cloudflare'
    ? `
- \`npm run deploy:cloudflare\` - Deploy to development environment
- \`npm run deploy:cloudflare:prod\` - Deploy to production environment`
    : ''
}


`;
}
