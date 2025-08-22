#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CreateCommand } from './commands/create';
import { ConfigureCommand } from './commands/configure';
import { RunCommand } from './commands/run';
import { StatusCommand } from './commands/status';

const program = new Command();

program
  .name('superagent')
  .description('SuperDapp AI Agents SDK and CLI')
  .version('1.0.0');

// Add commands
program.addCommand(new CreateCommand());
program.addCommand(new ConfigureCommand());
program.addCommand(new RunCommand());
program.addCommand(new StatusCommand());

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

(async () => {
  try {
    // Parse command line arguments and await async actions
    await program.parseAsync();
    // Show help if no command provided
    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (err) {
    console.error(chalk.red('CLI Error:'), err);
    process.exit(1);
  }
})();
