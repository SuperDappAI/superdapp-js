#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { InitCommand } from './commands/init';
import { ConfigureCommand } from './commands/configure';
import { RunCommand } from './commands/run';
import { DeployCommand } from './commands/deploy';
import { StatusCommand } from './commands/status';

const program = new Command();

program
  .name('superagent')
  .description('SuperDapp AI Agents SDK and CLI')
  .version('1.0.0');

// Add commands
program.addCommand(new InitCommand());
program.addCommand(new ConfigureCommand());
program.addCommand(new RunCommand());
program.addCommand(new DeployCommand());
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

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
