import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';

const app = fastify();

app.get('/', async (request, reply) => {
  return {hello: "world"}
})

export const handler = awsLambdaFastify(app);
