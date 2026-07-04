import { execFileSync } from 'child_process';

type Submodule = {
  name: string;
  path: string;
};

function runGit(args: string[], options: { cwd?: string; stdio?: 'inherit' | 'pipe' } = {}) {
  return execFileSync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
  });
}

function getSubmodules(): Submodule[] {
  const output = runGit(['config', '--file', '.gitmodules', '--get-regexp', '^submodule\\..*\\.path$']);

  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [key, path] = line.split(/\s+/, 2);
      const name = key.replace(/^submodule\./, '').replace(/\.path$/, '');

      return { name, path };
    });
}

function getConfiguredBranch(name: string) {
  try {
    return runGit(['config', '--file', '.gitmodules', '--get', `submodule.${name}.branch`]).trim();
  } catch {
    return '';
  }
}

function getCurrentBranch(path: string) {
  try {
    return runGit(['-C', path, 'symbolic-ref', '--short', 'HEAD']).trim();
  } catch {
    return '';
  }
}

function getBranchAtHead(path: string) {
  const output = runGit([
    '-C',
    path,
    'for-each-ref',
    '--format=%(refname:short)',
    '--points-at',
    'HEAD',
    'refs/heads',
    'refs/remotes/origin',
  ]);
  const refs = output
    .trim()
    .split('\n')
    .filter((ref) => ref && ref !== 'origin/HEAD');
  const localBranch = refs.find((ref) => !ref.startsWith('origin/'));
  const remoteBranch = refs.find((ref) => ref.startsWith('origin/'));

  return (localBranch || remoteBranch || '').replace(/^origin\//, '');
}

function getDefaultRemoteBranch(path: string) {
  try {
    const remoteHead = runGit(['-C', path, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).trim();

    return remoteHead.replace(/^origin\//, '');
  } catch {
    for (const branch of ['main', 'master']) {
      try {
        runGit(['-C', path, 'rev-parse', '--verify', `origin/${branch}`]);

        return branch;
      } catch {
        // Try the next conventional default branch name.
      }
    }

    throw new Error(`Could not determine default branch for ${path}`);
  }
}

function hasLocalBranch(path: string, branch: string) {
  try {
    runGit(['-C', path, 'rev-parse', '--verify', branch]);

    return true;
  } catch {
    return false;
  }
}

function getBranchToPull(submodule: Submodule) {
  const configuredBranch = getConfiguredBranch(submodule.name);

  if (configuredBranch && configuredBranch !== '.') {
    return configuredBranch;
  }

  return getCurrentBranch(submodule.path) || getBranchAtHead(submodule.path) || getDefaultRemoteBranch(submodule.path);
}

export function updateSubmodules() {
  runGit(['submodule', 'update', '--init', '--recursive'], { stdio: 'inherit' });

  for (const submodule of getSubmodules()) {
    console.log(`\nUpdating ${submodule.path}`);

    runGit(['-C', submodule.path, 'fetch', 'origin'], { stdio: 'inherit' });

    const branch = getBranchToPull(submodule);

    if (hasLocalBranch(submodule.path, branch)) {
      runGit(['-C', submodule.path, 'checkout', branch], { stdio: 'inherit' });
    } else {
      runGit(['-C', submodule.path, 'checkout', '--track', '-b', branch, `origin/${branch}`], {
        stdio: 'inherit',
      });
    }

    runGit(['-C', submodule.path, 'pull', '--ff-only', 'origin', branch], { stdio: 'inherit' });
  }
}
