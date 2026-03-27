const { spawnSync } = require('child_process');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const tscBin = path.resolve(backendRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const frontendTsconfig = path.resolve(
  backendRoot,
  '..',
  '..',
  '02-frontend',
  'licitaia-v2-web',
  'tsconfig.modules.json'
);
const outDir = path.resolve(backendRoot, 'runtime', 'frontend-core');

const result = spawnSync(
  process.execPath,
  [tscBin, '-p', frontendTsconfig, '--outDir', outDir],
  {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

