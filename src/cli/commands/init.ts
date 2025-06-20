import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { createProjectStructure, getTemplateFiles } from '../utils/templates';

export class InitCommand extends Command {
  constructor() {
    super('init');
    this.description('Initialize a new SuperDapp agent project')
      .argument('[directory]', 'Project directory')
      .option('-n, --name <name>', 'Project name')
      .option(
        '-t, --template <template>',
        'Project template (basic, webhook, news, trading)',
        'basic'
      )
      .option('-y, --yes', 'Skip prompts and use defaults')
      .action(this.execute.bind(this));
  }

  private async execute(
    directory: string | undefined,
    options: {
      name?: string;
      template?: string;
      yes?: boolean;
    }
  ) {
    const spinner = ora('Initializing SuperDapp agent project...').start();

    try {
      // Get project configuration
      const config = await this.getProjectConfig(directory, options);

      spinner.text = 'Creating project structure...';

      // Create project directory
      const projectPath = path.isAbsolute(config.directory)
        ? config.directory
        : path.join(process.cwd(), config.directory);

      // Check if directory already exists
      try {
        await fs.access(projectPath);
        spinner.fail(`Directory '${config.directory}' already exists!`);
        return;
      } catch {
        // Directory doesn't exist, which is good
      }

      // Create project structure
      await createProjectStructure(projectPath, config);

      spinner.succeed(chalk.green('Project initialized successfully!'));

      console.log(`\n${chalk.blue('Next steps:')}`);
      console.log(`  cd ${config.directory}`);
      console.log(`  npm install`);
      console.log(`  superagent configure`);
      console.log(`  superagent run\n`);

      // Ensure all file system operations are flushed before exit (for test reliability)
      await new Promise((r) => setTimeout(r, 150));
    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      // Do not call process.exit(1) here; let the promise rejection propagate
      throw error;
    }
  }

  private async getProjectConfig(
    directory: string | undefined,
    options: {
      name?: string;
      template?: string;
      yes?: boolean;
    }
  ) {
    const dir = directory || options.name || 'my-superdapp-agent';
    if (options.yes) {
      return {
        directory: dir,
        name: path.basename(dir),
        template: options.template || 'basic',
        description: 'A SuperDapp AI Agent',
      };
    }

    const questions = [];

    if (!directory && !options.name) {
      questions.push({
        type: 'input',
        name: 'directory',
        message: 'Project directory:',
        default: 'my-superdapp-agent',
        validate: (input: string) => {
          if (!input.trim()) return 'Project directory is required';
          return true;
        },
      });
    }

    if (!options.template) {
      questions.push({
        type: 'list',
        name: 'template',
        message: 'Choose a template:',
        choices: [
          { name: 'Basic Agent - Simple command handling', value: 'basic' },
          { name: 'Webhook Agent - Responds to webhooks', value: 'webhook' },
          { name: 'News Agent - AI-powered news generation', value: 'news' },
          {
            name: 'Trading Agent - Crypto trading assistant',
            value: 'trading',
          },
        ],
        default: 'basic',
      });
    }

    questions.push({
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A SuperDapp AI Agent',
    });

    const answers = questions.length ? await inquirer.prompt(questions) : {};

    return {
      directory: answers.directory || dir,
      name: path.basename(answers.directory || dir),
      template: options.template || answers.template || 'basic',
      description: answers.description || 'A SuperDapp AI Agent',
    };
  }
}
