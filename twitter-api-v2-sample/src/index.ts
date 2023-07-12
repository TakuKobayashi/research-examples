import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { auth } from "twitter-api-sdk";

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

app.get('/twitter/auth', (req, reply) => {
  const protocol = process.env.IS_OFFLINE ? 'http' : 'https';
  const currentBaseUrl = [protocol + '://' + req.hostname, req.awsLambda.event.requestContext.stage].join('/');
  const authClient = new auth.OAuth2User({
    client_id: process.env.TWITTER_OAUTH2_CLIENT_ID,
    callback: currentBaseUrl + "/twitter/oauth/callback",
    scopes: ["tweet.read", "users.read", "offline.access"],
  });
  const authUrl = authClient.generateAuthURL({
    state: "randomstring",
    code_challenge_method: "s256",
  });
  reply.redirect(authUrl);
});

app.get('/twitter/oauth/callback', async (req, reply) => {
  return { callback: 'token' };
});

export const handler = awsLambdaFastify(app);
