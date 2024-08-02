import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BastionEC2 } from './common/compute/bastion-ec2';


export class BastionEC2Stack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    // VPC名
    const vpcName = process.env.VPC_NAME || 'KMatsudaVPC';
    // 公開鍵
    const sshPubKey = process.env.SSH_PUB_KEY || ' ';

    const allowSshIps = process.env.ALLOW_SSH_IPS_SEPARATED_BY_COMMA || '';

    // 踏み台EC2を作成
    const ec2 = new BastionEC2(this, 'VPC',{
      vpcName: vpcName,
      sshPubKey: sshPubKey,
      allowSshIps: allowSshIps,
    });
    
    // SSM Command to start a session
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${ec2.instance.instanceId}`,
    });

    // SSH Command to connect to the EC2 Instance
    new CfnOutput(this, 'sshCommand', {
      value: `ssh ec2-user@${ec2.instance.instancePublicDnsName}`,
    });
    
  }
}
