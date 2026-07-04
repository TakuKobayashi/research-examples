import fs from 'fs/promises';

type Project = {
  slug: string;
  description?: string;
  description_ja?: string;
  status?: string;
};

function buildTable(projects: Project[], lang: 'en' | 'ja') {
  if (projects.length === 0) {
    return '| No projects found |  |  |';
  }

  return projects
    .map((p) => {
      const desc = lang === 'ja' ? p.description_ja || p.description || '' : p.description || p.description_ja || '';

      return `| [${p.slug}](./projects/${p.slug}/) | ${desc} | ${p.status || 'incubating'} |`;
    })
    .join('\n');
}

async function buildReadme(templatePath: string, outputPath: string, replacements: Record<string, string>) {
  let template = await fs.readFile(templatePath, 'utf8');

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(key, value);
  }

  await fs.writeFile(outputPath, template, 'utf8');
}

export async function syncReadme() {
  const raw = await fs.readFile('portfolio/projects.json', 'utf8');

  const projects: Project[] = JSON.parse(raw);

  const tableEn = buildTable(projects, 'en');
  const tableJa = buildTable(projects, 'ja');

  await buildReadme('templates/README.template.md', 'README.md', {
    '{{PROJECT_TABLE_EN}}': tableEn,
  });

  await buildReadme('templates/README.ja.template.md', 'README.ja.md', {
    '{{PROJECT_TABLE_JA}}': tableJa,
  });

  console.log('README.md + README.ja.md synced.');
}
