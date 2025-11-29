import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsLambdaCdkHonoImagesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new NodejsFunction(this, 'lambda', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
    })
    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })
    new cdk.CfnOutput(this, 'lambdaUrl', {
      value: fnUrl.url!,
    })

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsLambdaCdkHonoImagesQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
