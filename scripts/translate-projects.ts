import fg from 'fast-glob';
import fs from 'fs/promises';
import yaml from 'js-yaml';

type Project = {
  name: string;
  slug: string;
  description?: string;
  description_ja?: string;
  translation_locked?: boolean;
  status: string;
  repo?: string;
  tags?: string[];
};

const ENDPOINTS = [
  'http://localhost:5000/translate',
  'https://translate.argosopentech.com/translate',
  'https://translate.astian.org/translate',
];

async function requestTranslate(endpoint: string, text: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: 'ja',
      target: 'en',
      format: 'text',
    }),
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
  }

  let data: {
    translatedText?: string;
  };

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (!data.translatedText) {
    throw new Error('Missing translatedText');
  }

  return data.translatedText.trim();
}

async function translateText(text: string): Promise<string> {
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Trying: ${endpoint}`);

      return await requestTranslate(endpoint, text);
    } catch (err) {
      lastError = err;

      console.warn(`Failed: ${endpoint}`);
    }
  }

  throw lastError;
}

export async function translateProjects() {
  const files = await fg('projects/*/project.yml');

  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf8');

      const data = yaml.load(raw) as Project;

      if (data.translation_locked || data.description || !data.description_ja) {
        continue;
      }

      data.description = await translateText(data.description_ja);

      await fs.writeFile(
        file,
        yaml.dump(data, {
          lineWidth: -1,
        }),
        'utf8',
      );

      console.log(`Translated: ${file}`);
    } catch (err) {
      console.error(`Failed translating ${file}:`, err);
    }
  }
}
