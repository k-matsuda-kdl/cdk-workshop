import {  Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseVpc } from './common/compute/base-vpc';

export class BaseVpcStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC名
    const vpcName = process.env.VPC_NAME || 'KMatsudaVPC';

    // 基本のVpcを作成
    new BaseVpc(this, 'VPC',{
      vpcName: vpcName,
    });
  }
}
