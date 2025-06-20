import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import fsSync from 'fs';

jest.setTimeout(10000); // Restore to 10 seconds for normal speed

async function waitForFile(filePath: string, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fsSync.existsSync(filePath)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for file: ${filePath}`);
}

describe('CLI: superagent init', () => {
  function getTempDir(suffix: string) {
    return path.join(os.tmpdir(), `superdapp-test-${Date.now()}-${suffix}`);
  }

  it('should generate a basic agent project', async () => {
    const testDir = getTempDir('basic');
    execSync(`node ./dist/cli/index.js init ${testDir} --template basic -y`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 200));
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
    execSync(`node ./dist/cli/index.js init ${testDir} --template webhook -y`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 200));
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
