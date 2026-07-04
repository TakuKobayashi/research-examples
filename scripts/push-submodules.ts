import { execSync } from 'child_process';

export async function pushSubmodules() {
  execSync(
    `git submodule foreach "
      git add . &&
      git commit -m 'auto update' || true &&
      git push
    "`,
    {
      stdio: 'inherit',
    },
  );

  execSync('git add .', {
    stdio: 'inherit',
  });

  execSync(`git commit -m "Update submodule pointers" || true`, {
    stdio: 'inherit',
  });

  execSync('git push', {
    stdio: 'inherit',
  });
}
