#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';
import { BaseVpcStack } from '../lib/base-vpc-stack';
import { Aurora } from '../lib/aurora-stack';
import { BastionEC2Stack } from '../lib/bastion-ec2-stack';

config();

const devEnv = {
  account: process.env.ACCOUNT_ID || '',
  region: process.env.REGION || 'ap-northeast-1',
};

const app = new cdk.App();

new BaseVpcStack(app, 'KMatsudaVpc', {
  env: devEnv,
});

new BastionEC2Stack(app, 'KMatsudaBastion', {
  env: devEnv,
});

const auroraProps = {
  description:"Aurora Stack",
  vpcId:"vpc-0e7429918fbcaa935",
  vpcName: process.env.VPC_NAME || 'KMatsudaVPC',
  subnetIds:["subnet-05a4b7a713c0bc3df", "subnet-0bbb073a344bd13d5"],
  dbName:"sampledb",
  engine:"mysql",
  auroraClusterUsername:"homepage"  
};

const auroraStack = new Aurora(app, 'KMatsudaAurora', {
  ...auroraProps,
  env: devEnv,
});

app.synth();