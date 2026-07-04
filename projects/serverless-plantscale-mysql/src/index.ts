import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';

const app = fastify({ logger: true });

app.get('/', (request, reply) => {
  reply.send({ hello: 'world' });
});

export const handler = awsLambdaFastify(app);
