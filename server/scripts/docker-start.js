import { spawn } from 'node:child_process';

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`[startup] ${label}...`);

    const child = spawn(command, args, {
      env: process.env,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${label} failed with ${reason}.`));
    });
  });
}

async function main() {
  await run('npm', ['run', 'prisma:migrate'], 'Applying Prisma migrations');
  await run('npm', ['run', 'prisma:seed'], 'Seeding database');

  console.log('[startup] Starting API server...');
  await import('../src/index.js');
}

main().catch((error) => {
  console.error('[startup] Server bootstrap failed.', error);
  process.exit(1);
});
