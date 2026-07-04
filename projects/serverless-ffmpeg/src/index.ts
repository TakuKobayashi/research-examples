import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/test', (request, reply) => {
  reply.json({ hello: 'world' });
});

export const handler = serverlessExpress({ app });
