import {  Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProductEcs } from './common/compute/product-ecs';

export class ProductionEcsStack extends Stack {
  
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC名
    const vpcName = process.env.VPC_NAME || 'KMatsudaVPC';

    // Ecsを作成
    const mysql = new ProductEcs(this, 'Ecs',{
      vpcName: vpcName,
    });
  }
}
