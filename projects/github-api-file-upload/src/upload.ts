import { Octokit } from 'octokit';
import { config } from 'dotenv';
import * as fs from 'fs';

config();

const octokit = new Octokit({ auth: process.env.PERSONAL_ACCESS_TOKEN });
const owner = 'TakuKobayashi';
const repo = 'research-examples';
const uploadFileName = 'sample.jpg'
const content = fs.readFileSync(uploadFileName);

const executeUploadFunc = async () => {
  /*
  const contentRes = await octokit.rest.repos.getContent({
    owner: owner,
    repo: repo,
    path: uploadFileName,
  });
  */
  // 新しくファイルが作られる場合はこのままでOK
  // ファイルを更新するときはファイルSHAの値を指定する必要がある(上記のコメントを外す)
  const res = await octokit.rest.repos.createOrUpdateFileContents({
    owner: owner,
    repo: repo,
    path: uploadFileName,
    message: `upload ${uploadFileName}`,
    content: Buffer.from(content).toString('base64'),
    branch: 'master',
//    sha: contentRes.data.sha,
  });
  console.log(res.data);
};
executeUploadFunc();
