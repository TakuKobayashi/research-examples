import { Command } from 'commander';
import { addProject } from './init-project';
import { translateProjects } from './translate-projects';
import { syncPortfolio } from './sync-portfolio';
import { syncReadme } from './sync-readme';
import { validateProjects } from './validate-projects';
import { updateSubmodules } from './update-submodules';
import { pushSubmodules } from './push-submodules';

const program = new Command();

program
  .command('add')
  .requiredOption('--name <name>')
  .option('--description <description>', '')
  .description('Add new project')
  .action(async (opts) => {
    await addProject(opts.name, opts.description);

    await translateProjects();
    await syncPortfolio();
    await syncReadme();
  });

program
  .command('translate')
  .description('Auto translate project.yml descriptions')
  .action(async () => {
    await translateProjects();
  });

program
  .command('sync')
  .description('Translate + Sync portfolio + README')
  .action(async () => {
    await translateProjects();
    await syncPortfolio();
    await syncReadme();
  });

program.command('readme').description('Sync README only').action(syncReadme);

program.command('validate').description('Validate project.yml files').action(validateProjects);

program.command('pull').description('Pull parent + all submodules').action(updateSubmodules);

program.command('push').description('Push all submodules + parent').action(pushSubmodules);

program
  .command('status')
  .description('Check submodule status')
  .action(async () => {
    const { execSync } = await import('child_process');

    execSync('git submodule foreach git status', {
      stdio: 'inherit',
    });
  });

program.parse();
