import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

app.get('/twitter/auth', (req, reply) => {
  reply.redirect('/twitter/oauth/callback');
});

app.get('/twitter/oauth/callback', async (req, reply) => {
  return { callback: 'token' };
});

export const handler = awsLambdaFastify(app);
