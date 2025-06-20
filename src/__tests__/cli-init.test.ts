import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import fsSync from 'fs';

jest.setTimeout(20000); // 20 seconds for slow I/O

async function waitForFile(filePath: string, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fsSync.existsSync(filePath)) {
      console.log(`Found file at: ${filePath}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
    console.log(`Waiting for file: ${filePath}`);
  }
  try {
    const dir = path.dirname(filePath);
    const files = fsSync.readdirSync(dir);
    console.error(`Timeout reached waiting for: ${filePath}`);
    console.error(`Directory contents:`, files);
  } catch (e) {
    console.error(`Could not read directory for: ${filePath}`);
  }
  throw new Error(`Timeout waiting for file: ${filePath}`);
}

describe('CLI: superagent init', () => {
  function getTempDir(suffix: string) {
    return path.join(os.tmpdir(), `superdapp-test-${Date.now()}-${suffix}`);
  }

  it('should generate a basic agent project', async () => {
    const testDir = getTempDir('basic');
    console.log('Test directory:', testDir);

    let cliOutput = '';
    try {
      cliOutput = execSync(
        `node ./dist/cli/index.js init --name ${testDir} --template basic -y`,
        {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe',
        }
      ).toString();
      console.log('CLI output:', cliOutput);
    } catch (e) {
      const err = e as any;
      console.error(
        'CLI failed:',
        err.stdout?.toString(),
        err.stderr?.toString()
      );
      throw e;
    }

    await new Promise((r) => setTimeout(r, 300));

    if (!fsSync.existsSync(testDir)) {
      throw new Error(`CLI failed to create directory: ${testDir}`);
    }

    const pkgPath = path.join(testDir, 'package.json');
    await waitForFile(pkgPath);
    const pkg = await fs.readFile(pkgPath, 'utf8');
    expect(pkg).toContain('superdapp');
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate a webhook agent project', async () => {
    const testDir = getTempDir('webhook');
    console.log('Test directory:', testDir);

    let cliOutput = '';
    try {
      cliOutput = execSync(
        `node ./dist/cli/index.js init --name ${testDir} --template webhook -y`,
        {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe',
        }
      ).toString();
      console.log('CLI output:', cliOutput);
    } catch (e) {
      const err = e as any;
      console.error(
        'CLI failed:',
        err.stdout?.toString(),
        err.stderr?.toString()
      );
      throw e;
    }

    await new Promise((r) => setTimeout(r, 300));

    if (!fsSync.existsSync(testDir)) {
      throw new Error(`CLI failed to create directory: ${testDir}`);
    }

    const mainPath = path.join(testDir, 'src', 'index.ts');
    await waitForFile(mainPath);
    const main = await fs.readFile(mainPath, 'utf8');
    expect(main).toContain('WebhookAgent');
    await fs.rm(testDir, { recursive: true, force: true });
  });
});
