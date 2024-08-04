import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BastionEC2 } from '../bastion-ec2';
import { config } from 'dotenv';

config();

const devEnv = {
  account: process.env.ACCOUNT_ID || '',
  region: process.env.REGION || 'ap-northeast-1',
};

describe('踏み台EC2を作成するテスト', () => {
  test('t2.microのEC2にMySQLクライアントをインストールし、KDLからSSHできる状態で構築する', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {env: devEnv});
    
    new BastionEC2(stack, 'BastionEC2', {
      vpcName: 'TestVPC',
      sshPubKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQE...',
      allowSshIps: '8.8.8.8/32, 1.1.1.1/32',
    });
    
    const template = Template.fromStack(stack);

    // EC2が1台定義されたこと
    template.resourceCountIs('AWS::EC2::Instance', 1);

    // インスタンスタイプがt2.microであることを確認
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
    });

    // 指定されたIPアドレスのリストからのSSHが許可されたSecurityGroupがアタッチされていることを確認
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '8.8.8.8/32',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        }),
        Match.objectLike({
          CidrIp: '1.1.1.1/32',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        }),
      ]),
    });

    // 初期コマンドでMySQLクライアントがインストールされることを確認
    template.hasResourceProperties('AWS::EC2::Instance', {
      UserData: Match.objectLike({
        'Fn::Base64': Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('yum -y install mysql mysql-community-client'),
            ]),
          ]),
        }),
      }),
    });

    // AmazonSSMManagedInstanceCoreのAWSマネージドポリシーがついたRoleが付与されることを確認
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'arn:',
              { 'Ref': 'AWS::Partition' },
              ':iam::aws:policy/AmazonSSMManagedInstanceCore'
            ]),
          ]),
        }),
      ]),
    });

    // AssumeRolePolicyDocumentにec2.amazonaws.comが含まれていることを確認
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: Match.objectLike({
              Service: 'ec2.amazonaws.com',
            }),
          }),
        ]),
      }),
    });

    // 公開鍵が指定されていることを確認
    template.hasResource('AWS::EC2::Instance', {
      Metadata: Match.objectLike({
        'AWS::CloudFormation::Init': Match.objectLike({
          config: Match.objectLike({
            files: Match.objectLike({
              '/home/ec2-user/.ssh/authorized_keys': Match.objectLike({
                content: Match.stringLikeRegexp('ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQE...'),
              }),
            }),
          }),
        }),
      }),
    });
  });
});
