import type { AWS } from '@serverless/typescript';

import { config } from 'dotenv';
const configedEnv = config();

const serverlessConfiguration: AWS = {
  service: 'notion-api-examples',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    region: 'ap-northeast-1',
    timeout: 900,
    memorySize: 256,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
  },
  // import the function via paths
  functions: {
    app: {
      handler: 'src/app.handler',
      events: [
        {
          http: {
            method: 'ANY',
            path: '/',
            cors: true,
          },
        },
        {
          http: {
            method: 'ANY',
            path: '/{any+}',
            cors: true,
          },
        },
      ],
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    dotenv: {
      path: './.env',
      include: Object.keys(configedEnv.parsed),
    },
  },
};

module.exports = serverlessConfiguration;
