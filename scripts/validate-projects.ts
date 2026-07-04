import fg from 'fast-glob';
import fs from 'fs/promises';
import yaml from 'js-yaml';

export async function validateProjects() {
  const files = await fg('projects/*/project.yml');

  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf8');

      const data: any = yaml.load(raw);

      ['name', 'slug', 'description_ja', 'status'].forEach((field) => {
        if (!data[field]) {
          throw new Error(`${file}: missing ${field}`);
        }
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  console.log('All projects valid.');
}
