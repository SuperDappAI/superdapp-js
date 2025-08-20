import fs from 'fs/promises';
import path from 'path';

export interface RuntimeInfo {
  type: 'node' | 'cloudflare' | 'aws' | 'unknown';
  envFile: string;
  envFormat: 'dotenv' | 'json' | 'devvars';
  description: string;
}

export async function detectRuntime(
  cwd: string = process.cwd()
): Promise<RuntimeInfo> {
  try {
    // Check for package.json to determine project type
    const packageJsonPath = path.join(cwd, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    // Check for runtime-specific files
    const files = await fs.readdir(cwd);
    const fileNames = files.map((file) => String(file));

    // Check for Cloudflare Workers
    if (fileNames.includes('wrangler.toml')) {
      return {
        type: 'cloudflare',
        envFile: '.dev.vars',
        envFormat: 'devvars',
        description: 'Cloudflare Workers - Edge Computing',
      };
    }

    // Check for AWS Lambda
    if (
      fileNames.includes('template.yaml') ||
      fileNames.includes('samconfig.toml')
    ) {
      return {
        type: 'aws',
        envFile: 'env.json',
        envFormat: 'json',
        description: 'AWS Lambda - Serverless Functions',
      };
    }

    // Check package.json scripts for runtime hints
    const scripts = packageJson.scripts || {};

    if (scripts.dev?.includes('wrangler')) {
      return {
        type: 'cloudflare',
        envFile: '.dev.vars',
        envFormat: 'devvars',
        description: 'Cloudflare Workers - Edge Computing',
      };
    }

    if (
      scripts.dev?.includes('sam') ||
      scripts['deploy:dev']?.includes('sam')
    ) {
      return {
        type: 'aws',
        envFile: 'env.json',
        envFormat: 'json',
        description: 'AWS Lambda - Serverless Functions',
      };
    }

    // Default to Node.js if no specific runtime detected
    return {
      type: 'node',
      envFile: '.env',
      envFormat: 'dotenv',
      description: 'Node.js - HTTP Server',
    };
  } catch (error) {
    // If package.json doesn't exist or can't be read, assume Node.js
    return {
      type: 'node',
      envFile: '.env',
      envFormat: 'dotenv',
      description: 'Node.js - HTTP Server',
    };
  }
}

export function getEnvFileContent(
  config: { apiToken: string; apiUrl?: string },
  format: 'dotenv' | 'json' | 'devvars'
): string {
  switch (format) {
    case 'dotenv':
      let content = `# SuperDapp Agent Configuration
API_TOKEN=${config.apiToken}
`;
      if (config.apiUrl && config.apiUrl !== 'https://api.superdapp.ai') {
        content += `API_BASE_URL=${config.apiUrl}\n`;
      }
      content += `NODE_ENV=development\nPORT=8787\n`;
      return content;

    case 'json':
      return JSON.stringify(
        {
          myBotFunction: {
            API_TOKEN: config.apiToken,
            API_BASE_URL: config.apiUrl || 'https://api.superdapp.ai',
            NODE_ENV: 'production',
          },
        },
        null,
        2
      );

    case 'devvars':
      let devvarsContent = `API_TOKEN=${config.apiToken}\n`;
      if (config.apiUrl && config.apiUrl !== 'https://api.superdapp.ai') {
        devvarsContent += `API_BASE_URL=${config.apiUrl}\n`;
      }
      devvarsContent += `NODE_ENV=development\n`;
      return devvarsContent;

    default:
      throw new Error(`Unsupported environment format: ${format}`);
  }
}

export function getEnvExampleContent(
  format: 'dotenv' | 'json' | 'devvars'
): string {
  switch (format) {
    case 'dotenv':
      return `# SuperDapp Agent Configuration
API_TOKEN=your_api_token_here
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development # or production
PORT=8787
`;

    case 'json':
      return JSON.stringify(
        {
          myBotFunction: {
            API_TOKEN: 'your_api_token_here',
            API_BASE_URL: 'https://api.superdapp.ai',
            NODE_ENV: 'production',
          },
        },
        null,
        2
      );

    case 'devvars':
      return `API_TOKEN=your_api_token_here
API_BASE_URL=https://api.superdapp.ai
NODE_ENV=development
`;

    default:
      throw new Error(`Unsupported environment format: ${format}`);
  }
}
