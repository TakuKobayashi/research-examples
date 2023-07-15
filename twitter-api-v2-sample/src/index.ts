import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { auth } from "twitter-api-sdk";

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

const authClient = new auth.OAuth2User({
  client_id: process.env.TWITTER_OAUTH2_CLIENT_ID,
  client_secret: process.env.TWITTER_OAUTH2_CLIENT_SECRET,
  callback: "http://localhost:3000/dev/twitter/oauth/callback",
  scopes: ["tweet.read", "users.read", "offline.access"],
});

app.get('/twitter/auth', (req, reply) => {
  const authUrl = authClient.generateAuthURL({
    state: "randomstring",
    code_challenge_method: "s256",
  });
  console.log(authUrl);
  reply.redirect(authUrl);
});

app.get('/twitter/oauth/callback', async (req, reply) => {
  const queryObj = req.query;
  console.log(queryObj);
  const token = await authClient.requestAccessToken(queryObj.code).catch((e) => {
    console.log(e);
  });
  return { token: token, ...queryObj };
});

export const handler = awsLambdaFastify(app);
