import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import {
  detectRuntime,
  getEnvFileContent,
  getEnvExampleContent,
} from '../../utils/runtimeDetector';

export class ConfigureCommand extends Command {
  constructor() {
    super('configure');
    this.description(
      'Configure API keys and environment variables for the detected runtime'
    )
      .option('--api-token <token>', 'SuperDapp API token')
      .option('--api-url <url>', 'SuperDapp API base URL')
      .option('--ai-provider <provider>', 'AI provider (openai, anthropic, google)')
      .option('--ai-model <model>', 'AI model to use')
      .option('--ai-api-key <key>', 'AI provider API key')
      .option('--ai-base-url <url>', 'AI provider base URL (optional)')
      .option('--interactive', 'Interactive configuration mode', true)
      .action(this.execute.bind(this));
  }

  private async execute(options: {
    apiToken?: string;
    apiUrl?: string;
    aiProvider?: string;
    aiModel?: string;
    aiApiKey?: string;
    aiBaseUrl?: string;
    interactive?: boolean;
  }) {
    const spinner = ora('Detecting runtime environment...').start();

    try {
      // Detect runtime environment
      const runtimeInfo = await detectRuntime();

      spinner.text = `Detected ${runtimeInfo.description}`;
      spinner.succeed(
        chalk.green(`Runtime detected: ${runtimeInfo.description}`)
      );

      const config = await this.getConfiguration(options);

      spinner.text = `Writing configuration for ${runtimeInfo.type}...`;

      // Write environment file based on detected runtime
      await this.writeEnvFile(config, runtimeInfo);

      spinner.succeed(chalk.green('Configuration saved successfully!'));

      console.log(`\n${chalk.blue('Configuration Summary:')}`);
      console.log(`  Runtime: ${runtimeInfo.description}`);
      console.log(`  Environment File: ${runtimeInfo.envFile}`);
      console.log(
        `  API Token: ${config.apiToken ? '***' + config.apiToken.slice(-4) : 'Not set'}`
      );
      console.log(`  API URL: ${config.apiUrl || 'Default'}`);

      // Show AI configuration if present
      if (config.aiProvider) {
        console.log(`\n${chalk.blue('AI Configuration:')}`);
        console.log(`  Provider: ${config.aiProvider}`);
        console.log(`  Model: ${config.aiModel}`);
        console.log(
          `  API Key: ${config.aiApiKey ? '***' + config.aiApiKey.slice(-4) : 'Not set'}`
        );
        if (config.aiBaseUrl) {
          console.log(`  Base URL: ${config.aiBaseUrl}`);
        }
      }

      // Show runtime-specific instructions
      this.showRuntimeInstructions(runtimeInfo);

      console.log(
        `\n${chalk.yellow('Note:')} Keep your API token secure and never commit it to version control.`
      );
    } catch (error) {
      spinner.fail('Failed to configure environment');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  private async getConfiguration(options: {
    apiToken?: string;
    apiUrl?: string;
    aiProvider?: string;
    aiModel?: string;
    aiApiKey?: string;
    aiBaseUrl?: string;
    interactive?: boolean;
  }) {
    const questions = [];

    if (!options.apiToken) {
      questions.push({
        type: 'password',
        name: 'apiToken',
        message: 'SuperDapp API Token:',
        mask: '*',
        validate: (input: string) => {
          if (!input.trim()) return 'API token is required';
          return true;
        },
      });
    }

    if (!options.apiUrl) {
      questions.push({
        type: 'input',
        name: 'apiUrl',
        message: 'SuperDapp API Base URL (optional):',
        default: 'https://api.superdapp.ai',
      });
    }

    // AI Configuration (optional)
    questions.push({
      type: 'confirm',
      name: 'configureAI',
      message: 'Would you like to configure AI integration?',
      default: false,
    });

    const initialAnswers = await inquirer.prompt(questions);

    let aiConfig = {};
    if (initialAnswers.configureAI || options.aiProvider) {
      const aiQuestions = [];

      if (!options.aiProvider) {
        aiQuestions.push({
          type: 'list',
          name: 'aiProvider',
          message: 'Select AI provider:',
          choices: [
            { name: 'OpenAI', value: 'openai' },
            { name: 'Anthropic', value: 'anthropic' },
            { name: 'Google', value: 'google' },
          ],
          default: 'openai',
        });
      }

      if (!options.aiModel) {
        aiQuestions.push({
          type: 'input',
          name: 'aiModel',
          message: 'AI model:',
          default: (answers: any) => {
            const provider = options.aiProvider || answers.aiProvider;
            switch (provider) {
              case 'openai':
                return 'gpt-4';
              case 'anthropic':
                return 'claude-3-sonnet-20240229';
              case 'google':
                return 'gemini-pro';
              default:
                return 'gpt-4';
            }
          },
          validate: (input: string) => {
            if (!input.trim()) return 'AI model is required';
            return true;
          },
        });
      }

      if (!options.aiApiKey) {
        aiQuestions.push({
          type: 'password',
          name: 'aiApiKey',
          message: 'AI provider API key:',
          mask: '*',
          validate: (input: string) => {
            if (!input.trim()) return 'AI API key is required';
            return true;
          },
        });
      }

      if (!options.aiBaseUrl) {
        aiQuestions.push({
          type: 'input',
          name: 'aiBaseUrl',
          message: 'AI provider base URL (optional):',
          default: '',
        });
      }

      const aiAnswers = await inquirer.prompt(aiQuestions);
      aiConfig = {
        aiProvider: options.aiProvider || aiAnswers.aiProvider,
        aiModel: options.aiModel || aiAnswers.aiModel,
        aiApiKey: options.aiApiKey || aiAnswers.aiApiKey,
        aiBaseUrl: options.aiBaseUrl || aiAnswers.aiBaseUrl,
      };
    }

    return {
      aiProvider: (aiConfig as any).aiProvider,
      aiModel: (aiConfig as any).aiModel,
      aiApiKey: (aiConfig as any).aiApiKey,
      aiBaseUrl: (aiConfig as any).aiBaseUrl,
    } as {
      apiToken: string;
      apiUrl: string;
      aiProvider?: string;
      aiModel?: string;
      aiApiKey?: string;
      aiBaseUrl?: string;
    };
  }

  private async writeEnvFile(
    config: { 
      apiToken: string; 
      apiUrl?: string;
      aiProvider?: string;
      aiModel?: string;
      aiApiKey?: string;
      aiBaseUrl?: string;
    },
    runtimeInfo: { envFile: string; envFormat: 'dotenv' | 'json' | 'devvars' }
  ) {
    const envPath = path.join(process.cwd(), runtimeInfo.envFile);
    const envContent = getEnvFileContent(config, runtimeInfo.envFormat);

    await fs.writeFile(envPath, envContent);

    // Create example file
    const examplePath = path.join(
      process.cwd(),
      `${runtimeInfo.envFile}.example`
    );
    const exampleContent = getEnvExampleContent(runtimeInfo.envFormat);
    await fs.writeFile(examplePath, exampleContent);
  }

  private showRuntimeInstructions(runtimeInfo: {
    type: string;
    envFile: string;
  }) {
    console.log(`\n${chalk.blue('Runtime-specific Instructions:')}`);

    switch (runtimeInfo.type) {
      case 'cloudflare':
        console.log(`  📝 Environment file created: ${runtimeInfo.envFile}`);
        console.log(`  🔧 Next steps:`);
        console.log(`    1. Set secrets: wrangler secret put API_TOKEN`);
        console.log(`    2. Deploy: wrangler deploy`);
        break;

      case 'aws':
        console.log(`  📝 Environment file created: ${runtimeInfo.envFile}`);
        console.log(`  🔧 Next steps:`);
        console.log(`    1. Update env.json with your API token`);
        console.log(`    2. Deploy: npm run deploy:dev`);
        break;

      case 'node':
      default:
        console.log(`  📝 Environment file created: ${runtimeInfo.envFile}`);
        console.log(`  🔧 Next steps:`);
        console.log(`    1. Start development: npm run dev`);
        console.log(`    2. Build for production: npm run build && npm start`);
        break;
    }
  }
}
