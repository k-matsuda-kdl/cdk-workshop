import {
  SecurityGroup,
  Peer,
  Port,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface BaseVpcProps {
  vpcName: string;
}

export class BaseVpc extends Construct {

  constructor(scope: Construct, id: string, props: BaseVpcProps) {
    super(scope, id);

    const { vpcName } = props;

    // Create a VPC with public subnets in 2 AZs
    const vpc = new Vpc(this, 'VPC', {
      vpcName: vpcName,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      maxAzs: 2,
    });
  }
}
