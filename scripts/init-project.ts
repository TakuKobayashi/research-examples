import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function addProject(name: string, descriptionJa = '') {
  const projectDir = path.join('projects', name);

  await fs.mkdir(projectDir, {
    recursive: true,
  });

  const template = {
    name,
    slug: name,
    description: '',
    description_ja: descriptionJa,
    translation_locked: false,
    status: 'incubating',
    repo: '',
    tags: [],
  };

  await fs.writeFile(
    path.join(projectDir, 'project.yml'),
    yaml.dump(template, {
      lineWidth: -1,
    }),
    'utf8',
  );

  await fs.writeFile(path.join(projectDir, 'README.md'), `# ${name}\n\n${descriptionJa}\n`, 'utf8');
}
