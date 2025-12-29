import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SuperDappClient } from '../../core/client';
import { BotConfig } from '../../types';

export class StatusCommand extends Command {
  constructor() {
    super('status');
    this.description('Check the status of the agent')
      .option('--api-token <token>', 'SuperDapp API token (overrides .env)')
      .option('--api-url <url>', 'SuperDapp API base URL (overrides .env)')
      .action(this.execute.bind(this));
  }

  private async execute(options: { apiToken?: string; apiUrl?: string }) {
    const spinner = ora('Checking agent status...').start();

    try {
      // Create client configuration
      let config: BotConfig;

      if (options.apiToken) {
        config = {
          apiToken: options.apiToken,
          baseUrl: options.apiUrl || 'https://api.superdapp.ai',
        };
      } else {
        // Import createBotConfig lazily to avoid environment validation during module load
        const { createBotConfig } = await import('../../utils/env');
        config = createBotConfig(options.apiUrl);
      }

      const client = new SuperDappClient(config);

      // Get bot information
      const botInfo = await client.getMe();

      spinner.succeed(chalk.green('Agent status retrieved successfully!'));

      // Display status information
      console.log(`\n${chalk.blue('Agent Status:')}`);
      console.log(`  Bot ID: ${botInfo.data.bot_info?.id || 'N/A'}`);
      console.log(`  Name: ${botInfo.data.bot_info?.name || 'N/A'}`);
      console.log(
        `  Status: ${botInfo.data.bot_info?.isActive ? chalk.green('Active') : chalk.red('Inactive')}`
      );

      const user: import('../../types').User = botInfo.data.user;
      if (user) {
        console.log(`\n${chalk.blue('User Info:')}`);
        console.log(`  ID: ${user.id ?? 'N/A'}`);
        console.log(`  Username: ${user.username ?? 'N/A'}`);
        console.log(`  Email: ${user.email ?? 'N/A'}`);
        console.log(`  Cognito ID: ${user.cognito_id ?? 'N/A'}`);
        console.log(`  Type: ${user.type ?? 'N/A'}`);
        if (user.bot) {
          console.log(`  Bot: ${JSON.stringify(user.bot)}`);
        } else {
          console.log('  Bot: N/A');
        }
      }
    } catch (error) {
      spinner.fail('Failed to check agent status');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );

      if (error instanceof Error && error.message.includes('API_TOKEN')) {
        console.log(
          chalk.yellow(
            '\nTip: Run "superdapp configure" to set up your API token.'
          )
        );
      }

      process.exit(1);
    }
  }
}
