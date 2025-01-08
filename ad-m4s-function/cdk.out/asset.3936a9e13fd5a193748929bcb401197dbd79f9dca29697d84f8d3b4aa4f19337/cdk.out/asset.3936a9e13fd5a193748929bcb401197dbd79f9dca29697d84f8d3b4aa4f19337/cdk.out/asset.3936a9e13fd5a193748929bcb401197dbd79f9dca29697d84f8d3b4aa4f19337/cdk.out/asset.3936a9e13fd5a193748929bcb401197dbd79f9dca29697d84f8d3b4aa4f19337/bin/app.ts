#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { M4sLambdaStack } from '../lib/m4s-lambda-stack';

const app = new cdk.App();
new M4sLambdaStack(app, 'M4sLambdaStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
