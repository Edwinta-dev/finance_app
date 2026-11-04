#!/usr/bin/env node
// Generates the native android project (never committed) and runs the module's JVM unit tests.
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const gradlew = isWin ? 'gradlew.bat' : './gradlew';

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}   (cwd: ${path.relative(root, cwd) || '.'})`);
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (res.error) {
    console.error(res.error.message);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status || 1);
}

run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install'], root);

const gradleArgs = [':quick-log:testDebugUnitTest'];
if (!process.env.GRADLE_ONLINE) gradleArgs.push('--offline');
run(gradlew, gradleArgs, path.join(root, 'android'));
