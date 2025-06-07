import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class RunCommand extends Command {
  constructor() {
    super('run');
    this.description('Run the agent locally for testing')
      .option('-w, --watch', 'Watch for file changes and restart')
      .option('-p, --port <port>', 'Port for development server', '3000')
      .option('--env <file>', 'Environment file to use', '.env')
      .action(this.execute.bind(this));
  }

  private async execute(options: {
    watch?: boolean;
    port?: string;
    env?: string;
  }) {
    const spinner = ora('Starting agent...').start();

    try {
      // Check if package.json exists
      const packagePath = path.join(process.cwd(), 'package.json');

      try {
        await fs.access(packagePath);
      } catch {
        spinner.fail('No package.json found. Run "superagent init" first.');
        return;
      }

      // Check if .env file exists
      const envPath = path.join(process.cwd(), options.env || '.env');

      try {
        await fs.access(envPath);
      } catch {
        spinner.fail('No .env file found. Run "superagent configure" first.');
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

      spinner.text = 'Starting agent...';

      // Start the agent
      const command = options.watch ? 'npm run dev' : 'npm start';

      spinner.succeed(chalk.green('Agent started successfully!'));

      console.log(`\n${chalk.blue('Agent is running...')}`);
      console.log(`${chalk.gray('Press Ctrl+C to stop')}\n`);

      // Run the command
      const child = spawn('npm', options.watch ? ['run', 'dev'] : ['start'], {
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
