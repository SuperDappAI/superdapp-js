import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SuperDappClient } from '../../core/client';
import { createBotConfig } from '../../utils/env';
import { BotConfig } from '../../types';

export class StatusCommand extends Command {
  constructor() {
    super('status');
    this.description('Check the status of the deployed agent')
      .option('--api-token <token>', 'SuperDapp API token (overrides .env)')
      .option('--api-url <url>', 'SuperDapp API base URL (overrides .env)')
      .action(this.execute.bind(this));
  }

  private async execute(options: { apiToken?: string; apiUrl?: string }) {
    const spinner = ora('Checking agent status...').start();

    try {
      // Create client configuration
      const config: BotConfig = options.apiToken
        ? {
            apiToken: options.apiToken,
            baseUrl: options.apiUrl || 'https://api.superdapp.com',
          }
        : createBotConfig(options.apiUrl);

      const client = new SuperDappClient(config);

      // Get bot information
      const botInfo = await client.getMe();

      // Get recent updates
      const updates = await client.getUpdates(5, 5);

      spinner.succeed(chalk.green('Agent status retrieved successfully!'));

      // Display status information
      console.log(`\n${chalk.blue('Agent Status:')}`);
      console.log(`  Bot ID: ${botInfo.data.bot_info?.id || 'N/A'}`);
      console.log(`  Name: ${botInfo.data.bot_info?.name || 'N/A'}`);
      console.log(
        `  Status: ${botInfo.data.bot_info?.isActive ? chalk.green('Active') : chalk.red('Inactive')}`
      );
      console.log(`  User: ${botInfo.data.user?.email || 'N/A'}`);

      if (updates.data) {
        console.log(`\n${chalk.blue('Recent Activity:')}`);
        console.log(
          `  Channel Messages: ${updates.data.channels_messages?.length || 0}`
        );
        console.log(
          `  Connection Messages: ${updates.data.connections_messages?.length || 0}`
        );

        if (updates.data.channels_messages?.length > 0) {
          console.log(`\n${chalk.blue('Latest Channel Messages:')}`);
          updates.data.channels_messages.slice(0, 3).forEach((msg, i) => {
            console.log(
              `  ${i + 1}. ${msg.messageId} - ${new Date(msg.timestamp).toLocaleString()}`
            );
          });
        }

        if (updates.data.connections_messages?.length > 0) {
          console.log(`\n${chalk.blue('Latest Connection Messages:')}`);
          updates.data.connections_messages.slice(0, 3).forEach((msg, i) => {
            console.log(
              `  ${i + 1}. ${msg.messageId} - ${new Date(msg.timestamp).toLocaleString()}`
            );
          });
        }
      }

      // Try to get wallet info
      try {
        const wallet = await client.getWalletKeys();
        console.log(`\n${chalk.blue('Wallet:')}`);
        console.log(`  Address: ${wallet.data.address || 'N/A'}`);
        console.log(
          `  Public Key: ${wallet.data.publicKey ? '***' + wallet.data.publicKey.slice(-8) : 'N/A'}`
        );
      } catch (error) {
        console.log(`\n${chalk.yellow('Wallet: Not accessible')}`);
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
            '\nTip: Run "superagent configure" to set up your API token.'
          )
        );
      }

      process.exit(1);
    }
  }
}
