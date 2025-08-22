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
      .option('--interactive', 'Interactive configuration mode', true)
      .action(this.execute.bind(this));
  }

  private async execute(options: {
    apiToken?: string;
    apiUrl?: string;
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

    const answers = await inquirer.prompt(questions);

    return {
      apiToken: options.apiToken || answers.apiToken,
      apiUrl: options.apiUrl || answers.apiUrl,
    };
  }

  private async writeEnvFile(
    config: { apiToken: string; apiUrl?: string },
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
