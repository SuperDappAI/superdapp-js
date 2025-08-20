import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { detectRuntime } from '../../utils/runtimeDetector';
import { loadEnvConfigFromFile } from '../../utils/env';

export class RunCommand extends Command {
  constructor() {
    super('run');
    this.description('Run the agent locally for testing')
      .option('-p, --port <port>', 'Port for development server', '8787')
      .option(
        '--env <file>',
        'Environment file to use (auto-detected by default)'
      )
      .action(this.execute.bind(this));
  }

  private async execute(options: { port?: string; env?: string }) {
    const spinner = ora('Starting agent...').start();

    try {
      // Check if package.json exists
      const packagePath = path.join(process.cwd(), 'package.json');
      try {
        await fs.access(packagePath);
      } catch {
        spinner.fail('No package.json found. Run "superagent create" first.');
        return;
      }

      // Detect runtime and environment file
      let runtimeInfo;
      try {
        runtimeInfo = await detectRuntime(process.cwd());
      } catch (error) {
        spinner.fail(
          'Failed to detect runtime. Run "superagent create" first.'
        );
        return;
      }

      // Use custom env file if specified, otherwise use detected one
      const envFileName = options.env || runtimeInfo.envFile;
      const envPath = path.join(process.cwd(), envFileName);

      // Check if environment file exists
      try {
        await fs.access(envPath);
      } catch {
        spinner.fail(
          `No ${envFileName} file found. Run "superagent configure" first.`
        );
        console.log(
          chalk.gray(
            `Expected environment file: ${envFileName} (${runtimeInfo.description})`
          )
        );
        return;
      }

      // Validate environment configuration
      try {
        await loadEnvConfigFromFile(envPath, runtimeInfo.envFormat);
      } catch (error) {
        spinner.fail('Invalid environment configuration');
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : error
        );
        return;
      }

      // Check if dependencies are installed
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      try {
        await fs.access(nodeModulesPath);
      } catch {
        spinner.text = 'Installing dependencies...';
        await this.installDependencies();
      }

      // Detect agent type (webhook or AppSync)
      let agentType = 'unknown';
      try {
        const mainFile = await this.detectMainFile();
        const mainContent = await fs.readFile(mainFile, 'utf8');
        if (mainContent.includes('WebhookAgent')) agentType = 'webhook';
        else if (mainContent.includes('SuperDappAgent')) agentType = 'appsync';
      } catch {
        // fallback: unknown
      }

      spinner.text = `Starting ${agentType === 'webhook' ? 'Webhook' : agentType === 'appsync' ? 'AppSync' : 'Unknown'} agent (${runtimeInfo.type})...`;
      spinner.succeed(chalk.green('Agent started successfully!'));

      console.log(`\n${chalk.blue('Agent is running...')}`);
      console.log(chalk.gray(`Runtime: ${runtimeInfo.description}`));
      console.log(chalk.gray(`Environment file: ${envFileName}`));

      if (agentType === 'webhook') {
        console.log(
          chalk.gray(
            `Webhook server will listen on the configured port (default: 4000).`
          )
        );
      } else if (agentType === 'appsync') {
        console.log(
          chalk.gray('AppSync (GraphQL subscription) agent running.')
        );
      }
      console.log(`${chalk.gray('Press Ctrl+C to stop')}\n`);

      // Run the command based on runtime
      const command = this.getRunCommand(runtimeInfo.type);
      const child = spawn(command.cmd, command.args, {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          PORT: options.port,
        },
      });

      // Handle process termination
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nStopping agent...'));
        child.kill('SIGINT');
        process.exit(0);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.error(chalk.red(`Agent exited with code ${code}`));
          process.exit(code || 1);
        }
      });
    } catch (error) {
      spinner.fail('Failed to start agent');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  private getRunCommand(runtimeType: string): { cmd: string; args: string[] } {
    switch (runtimeType) {
      case 'cloudflare':
        return {
          cmd: 'npx',
          args: ['wrangler', 'dev'],
        };

      case 'aws':
        return {
          cmd: 'npm',
          args: ['run', 'dev'],
        };

      default: // node
        return {
          cmd: 'npm',
          args: ['run', 'dev'],
        };
    }
  }

  private async detectMainFile(): Promise<string> {
    // Try to find src/index.ts or src/index.js
    const tsPath = path.join(process.cwd(), 'src', 'index.ts');
    const jsPath = path.join(process.cwd(), 'src', 'index.js');
    try {
      await fs.access(tsPath);
      return tsPath;
    } catch {}
    try {
      await fs.access(jsPath);
      return jsPath;
    } catch {}
    throw new Error(
      'Could not find main agent file (src/index.ts or src/index.js)'
    );
  }

  private async installDependencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install'], {
        stdio: 'pipe',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }
}
