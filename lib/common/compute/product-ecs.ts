import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

interface ProductEcsProps {
  vpcName: string;
}
  
export class ProductEcs extends Construct {
  constructor(scope: Construct, id: string, props: ProductEcsProps) {
    super(scope, id);
    const { vpcName } = props;

    // Create VPC and Fargate Cluster
    // vpcを取得
    const vpc = Vpc.fromLookup(this, 'ExistingVpc', {
      vpcName: vpcName, // 既存のVPCのnameを指定
    });
    const cluster = new Cluster(this, 'Cluster', { vpc });

    // Instantiate Fargate Service with just cluster and image
    new ApplicationLoadBalancedFargateService(this, "FargateService", {
      cluster,
      taskImageOptions: {
        image: ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      },
    });
  }
}
