import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

export class ConfigureCommand extends Command {
  constructor() {
    super('configure');
    this.description('Configure API keys and environment variables')
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
    const spinner = ora('Configuring environment...').start();

    try {
      const config = await this.getConfiguration(options);

      spinner.text = 'Writing configuration...';

      // Write .env file
      await this.writeEnvFile(config);

      spinner.succeed(chalk.green('Configuration saved successfully!'));

      console.log(`\n${chalk.blue('Configuration:')}`);
      console.log(
        `  API Token: ${config.apiToken ? '***' + config.apiToken.slice(-4) : 'Not set'}`
      );
      console.log(`  API URL: ${config.apiUrl || 'Default'}`);
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
        default: 'https://api.superdapp.com',
      });
    }

    const answers = await inquirer.prompt(questions);

    return {
      apiToken: options.apiToken || answers.apiToken,
      apiUrl: options.apiUrl || answers.apiUrl,
    };
  }

  private async writeEnvFile(config: { apiToken: string; apiUrl?: string }) {
    const envPath = path.join(process.cwd(), '.env');

    let envContent = `# SuperDapp Agent Configuration
API_TOKEN=${config.apiToken}
`;

    if (config.apiUrl && config.apiUrl !== 'https://api.superdapp.com') {
      envContent += `API_BASE_URL=${config.apiUrl}\n`;
    }

    await fs.writeFile(envPath, envContent);

    // Also create .env.example
    const exampleContent = `# SuperDapp Agent Configuration
API_TOKEN=your_api_token_here
# API_BASE_URL=https://api.superdapp.com
`;

    await fs.writeFile(
      path.join(process.cwd(), '.env.example'),
      exampleContent
    );
  }
}
