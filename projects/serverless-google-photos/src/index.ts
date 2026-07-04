import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
const Photos = require('googlephotos');

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

app.get('/google/auth', (req, reply) => {
  const scopes = [Photos.Scopes.READ_ONLY, Photos.Scopes.SHARING];
  const oauth2Client = generateGoogleOauth2Client(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  reply.redirect(url);
});

app.get('/google/oauth/callback', async (req, reply) => {
  const oauth2Client = generateGoogleOauth2Client(req);

  const { tokens } = await oauth2Client.getToken(req.query.code);
  return { ...req.query, ...tokens };
});

function generateGoogleOauth2Client(req): OAuth2Client {
  const protocol = process.env.IS_OFFLINE ? 'http' : 'https';
  const currentBaseUrl = [protocol + '://' + req.hostname, req.awsLambda.event.requestContext.stage].join('/');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    currentBaseUrl + '/google/oauth/callback',
  );
  return oauth2Client;
}

app.get('/google/photos', async (req, reply) => {
  const photos = await loadPhotos(req.query.access_token);
  return photos;
});

async function loadPhotos(accessToken: string){
  const photos = new Photos(accessToken);

  // pageSizeはMax 100件
  // 詳しくはこちら: https://developers.google.com/photos/library/reference/rest/v1/mediaItems/list
  // photos.transportでhttps://photoslibrary.googleapis.com/のエンドポイントにリクエストを投げるという意味、引数はエンドポイントにくっつける文字列
  const photosResponse = await photos.transport.get("v1/mediaItems", {pageSize: 100})

  return photosResponse.mediaItems;
}

export const handler = awsLambdaFastify(app);
