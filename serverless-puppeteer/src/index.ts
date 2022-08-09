import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
const chromium = require('chrome-aws-lambda');
//const puppeteer = chromium.puppeteer;
const puppeteer = require("puppeteer");
// https://www.serverless.com/examples/aws-node-puppeteer

const app = fastify();

app.get('/', async (request, reply) => {
  return {hello: "world"}
})

app.get('/screenshot', async (request, reply) => {
  console.log(request.query.url)
    const viewport = {width: 1024, height: 800};
    //await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/master/NotoSansJP-Black.otf');
    //const chromiumExecutablePath = await chromium.executablePath
    const browser = await puppeteer.launch({
      //defaultViewport: viewport,
      //headless: true,
      //executablePath: chromiumExecutablePath,
      //args: chromium.args,
    });

    const page = await browser.newPage();
    await page.goto(request.query.url, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
    });

    const image = await page.screenshot({
      clip: { x: 0, y: 0, ...viewport },
      encoding: 'base64'
    });
    await browser.close();
    reply.send(image);
});

export const handler = awsLambdaFastify(app);
