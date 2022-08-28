import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { Octokit } from 'octokit';
import fs from 'fs'

const octokit = new Octokit({ auth: process.env.PERSONAL_ACCESS_TOKEN });
const owner = 'TakuKobayashi';
const repo = 'serverless-github-upload-reources';

const app = fastify();

app.get('/', async (request, reply) => {
  return {hello: "world"}
})

app.get('/upload', async (request, reply) => {
  const image = fs.readFileSync("sample.jpg", 'base64')
  console.log(image)
  const res = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "sample.jpg",
    message: "test message",
    content: image,
  })
  return res.data
})

export const handler = awsLambdaFastify(app);
