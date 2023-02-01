import { Octokit } from 'octokit';
import { config } from 'dotenv';
import * as fs from 'fs';

config();

const octokit = new Octokit({ auth: process.env.PERSONAL_ACCESS_TOKEN });
const owner = 'TakuKobayashi';
const repo = 'research-examples';
const content = fs.readFileSync('sample.jpg');

const executeUploadFunc = async () => {
  const res = await octokit.rest.repos.createOrUpdateFileContents({
    owner: owner,
    repo: repo,
    path: 'sample.jpg',
    message: 'upload sample.jpg',
    content: Buffer.from(content).toString('base64'),
    branch: 'master',
  });
  console.log(res.data);
};
executeUploadFunc();
