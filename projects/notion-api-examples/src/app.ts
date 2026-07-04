import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { notionApiRead } from './routers/notion/read';
import { notionApiPost } from './routers/notion/post';

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

app.register(notionApiRead, { prefix: '/notion/read' });
app.register(notionApiPost, { prefix: '/notion/post' });

export const handler = awsLambdaFastify(app);
