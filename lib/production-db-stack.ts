import {  Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Mysql } from './common/datastore/mysql';

export class ProductionDbStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC名
    const vpcName = process.env.VPC_NAME || 'KMatsudaVPC';

    // 基本のVpcを作成
    new Mysql(this, 'Mysql',{
      vpcName: vpcName,
      dbName:"sampledb",
      instanceType:"t3.medium",
    });
  }
}
