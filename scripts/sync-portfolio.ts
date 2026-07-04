import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import yaml from 'js-yaml';

export async function syncPortfolio() {
  const projectFiles = await fg('projects/*/project.yml', {
    onlyFiles: true,
  });

  const fallbackReadmes = await fg('projects/*/README.md', {
    onlyFiles: true,
  });

  const loadedSlugs = new Set<string>();
  const projects = [];

  for (const file of projectFiles) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const data: any = yaml.load(raw);

      const slug = data.slug || path.basename(path.dirname(file));

      loadedSlugs.add(slug);

      projects.push({
        name: data.name || slug,
        slug,
        description: data.description || '',
        description_ja: data.description_ja || '',
        status: data.status || 'incubating',
        repo: data.repo || '',
        tags: data.tags || [],
      });
    } catch (err) {
      console.error(`Failed loading ${file}:`, err);
    }
  }

  for (const readme of fallbackReadmes) {
    const slug = path.basename(path.dirname(readme));

    if (loadedSlugs.has(slug)) continue;

    projects.push({
      name: slug,
      slug,
      description: '',
      description_ja: '',
      status: 'incubating',
      repo: '',
      tags: [],
    });
  }

  projects.sort((a, b) => a.slug.localeCompare(b.slug));

  await fs.mkdir('portfolio', {
    recursive: true,
  });

  await fs.writeFile('portfolio/projects.json', JSON.stringify(projects, null, 2), 'utf8');

  await fs.writeFile('portfolio/projects.yml', yaml.dump(projects), 'utf8');

  console.log(`Synced ${projects.length} projects.`);
}
