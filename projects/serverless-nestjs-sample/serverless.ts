import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'serverless-nestjs-sample',
  frameworkVersion: '3',
  plugins: ['serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    region: 'ap-northeast-1',
    timeout: 900,
    memorySize: 128,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  // import the function via paths
  functions: {
    app: {
      handler: 'dist/src/main.handler',
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
  custom: {
  },
};

module.exports = serverlessConfiguration;
