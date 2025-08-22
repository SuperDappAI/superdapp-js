import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { createProjectStructure } from '../utils/templates';

export class CreateCommand extends Command {
  constructor() {
    super('create');
    this.description('Create a new SuperDapp agent project')
      .argument('[directory]', 'Project directory')
      .option(
        '-r, --runtime <runtime>',
        'Runtime environment (node, cloudflare, aws)',
        'node'
      )
      .option('-y, --yes', 'Skip prompts and use defaults')
      .action(this.execute.bind(this));
  }

  private async execute(
    directory: string | undefined,
    options: {
      runtime?: string;
      yes?: boolean;
    }
  ) {
    let spinner: any;

    try {
      // Validate runtime before proceeding
      const supportedRuntimes = ['node', 'cloudflare', 'aws'];
      const requestedRuntime = options.runtime || 'node';

      if (!supportedRuntimes.includes(requestedRuntime)) {
        console.error(
          chalk.red('Error:'),
          `Unsupported runtime: ${requestedRuntime}`
        );
        console.log(
          chalk.yellow('Supported runtimes:'),
          supportedRuntimes.join(', ')
        );
        process.exit(1);
      }

      const config = await this.getProjectConfig(directory, options);

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Create ${config.name} with ${config.runtime} runtime?`,
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Project creation cancelled.'));
          return;
        }
      }

      spinner = ora('Creating project...').start();

      spinner.text = `Creating ${config.name} with ${config.runtime} runtime...`;

      // Create project structure
      await createProjectStructure(config.directory, config);

      spinner.succeed(chalk.green('Project created successfully!'));

      console.log(`\n${chalk.blue('Next steps:')}`);
      console.log(`  cd ${config.directory}`);
      console.log(`  npm install`);
      console.log(`  superagent configure`);

      if (config.runtime === 'node') {
        console.log(`  npm run dev`);
      } else if (config.runtime === 'cloudflare') {
        console.log(`  npm run dev`);
      } else if (config.runtime === 'aws') {
        console.log(`  npm run build`);
        console.log(`  npm run dev`);
      }

      console.log(`  for more information read the README.md file`);
      console.log(`\n${chalk.green('Happy coding! 🚀')}`);
    } catch (error) {
      spinner.fail('Project creation failed');
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }

  private async getProjectConfig(
    directory: string | undefined,
    options: {
      runtime?: string;
      yes?: boolean;
    }
  ) {
    const dir = directory || 'my-superdapp-agent';

    if (options.yes) {
      return {
        directory: dir,
        name: path.basename(dir),
        runtime: options.runtime || 'node',
        description: 'A SuperDapp Agent',
      };
    }

    const questions = [];

    if (!directory) {
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

    if (!options.runtime) {
      questions.push({
        type: 'list',
        name: 'runtime',
        message: 'Choose runtime environment:',
        choices: [
          { name: 'Node.js - HTTP Server (default)', value: 'node' },
          { name: 'Cloudflare Workers - Edge Computing', value: 'cloudflare' },
          { name: 'AWS Lambda - Serverless Functions', value: 'aws' },
        ],
        default: 'node',
      });
    }

    questions.push({
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A SuperDapp Agent',
    });

    const answers =
      questions.length > 0 ? await inquirer.prompt(questions) : {};

    return {
      directory: answers.directory || dir,
      name: path.basename(answers.directory || dir),
      runtime: options.runtime || answers.runtime || 'node',
      description: answers.description || 'A SuperDapp Agent',
    };
  }
}
