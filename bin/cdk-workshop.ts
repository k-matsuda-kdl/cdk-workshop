#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';
import { BaseVpcStack } from '../lib/base-vpc-stack';
import { ProductionDbStack } from '../lib/production-db-stack';
import { BastionEC2Stack } from '../lib/bastion-ec2-stack';
import { Inspector2Stack } from '../lib/inspector2-stack';
import { ProductionEcsStack } from '../lib/production-ecs-stack';

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

new ProductionDbStack(app, 'KMatsudaDb', {
  env: devEnv,
});

new Inspector2Stack(app, 'KMatsudaInspector2', {
  env: devEnv,
});

new ProductionEcsStack(app, 'KMatsudaEcs', {
  env: devEnv,
});

app.synth();