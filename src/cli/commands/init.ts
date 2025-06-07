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
      .option('-n, --name <name>', 'Project name')
      .option(
        '-t, --template <template>',
        'Project template (basic, news, trading)',
        'basic'
      )
      .option('-y, --yes', 'Skip prompts and use defaults')
      .action(this.execute.bind(this));
  }

  private async execute(options: {
    name?: string;
    template?: string;
    yes?: boolean;
  }) {
    const spinner = ora('Initializing SuperDapp agent project...').start();

    try {
      // Get project configuration
      const config = await this.getProjectConfig(options);

      spinner.text = 'Creating project structure...';

      // Create project directory
      const projectPath = path.join(process.cwd(), config.name);

      // Check if directory already exists
      try {
        await fs.access(projectPath);
        spinner.fail(`Directory '${config.name}' already exists!`);
        return;
      } catch {
        // Directory doesn't exist, which is good
      }

      // Create project structure
      await createProjectStructure(projectPath, config);

      spinner.succeed(chalk.green('Project initialized successfully!'));

      console.log(`\n${chalk.blue('Next steps:')}`);
      console.log(`  cd ${config.name}`);
      console.log(`  npm install`);
      console.log(`  superagent configure`);
      console.log(`  superagent run\n`);
    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  private async getProjectConfig(options: {
    name?: string;
    template?: string;
    yes?: boolean;
  }) {
    if (options.yes) {
      return {
        name: options.name || 'my-superdapp-agent',
        template: options.template || 'basic',
        description: 'A SuperDapp AI Agent',
      };
    }

    const questions = [];

    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: 'my-superdapp-agent',
        validate: (input: string) => {
          if (!input.trim()) return 'Project name is required';
          if (!/^[a-z0-9-_]+$/i.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
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

    const answers = await inquirer.prompt(questions);

    return {
      name: options.name || answers.name,
      template: options.template || answers.template,
      description: answers.description,
    };
  }
}
