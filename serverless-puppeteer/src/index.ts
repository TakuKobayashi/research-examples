import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const fs = require('fs');
// https://www.serverless.com/examples/aws-node-puppeteer

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const app = express();
app.use(cors());

app.get('/test', (req, res) => {
  res.json({ hello: 'world' });
});

app.get('/screenshot', async (request, res) => {
//  console.log(request.query.url);
  //await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/master/NotoSansJP-Black.otf');
  //const chromiumExecutablePath = await chromium.executablePath
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.goto("https://google.co.jp", { waitUntil: 'domcontentloaded' });

  const path = "/tmp/screenshot.png"
  const screenshot = await page.screenshot({ fullPage: true, path: path, type: "png" });

  await browser?.close();

  res.setHeader("Content-Type", "image/png");
  res.send(screenshot);
});

export const handler = serverlessExpress({ app });
