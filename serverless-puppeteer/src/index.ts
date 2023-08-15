import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
// https://www.serverless.com/examples/aws-node-puppeteer

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
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  await page.goto("https://google.co.jp", { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "A4" });

  await browser?.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Disposition", `inline; filename=file.pdf`);
  res.send(pdf);
});

export const handler = serverlessExpress({ app });
