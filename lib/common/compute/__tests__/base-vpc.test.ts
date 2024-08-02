import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BaseVpc } from '../base-vpc';

describe('BaseVpc', () => {
  test('BaseVpcのテスト PublicとPrivateとIsolatedのSubnetを確認する', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    new BaseVpc(stack, 'BaseVpc', { vpcName: 'TestVPC' });
    
    const template = Template.fromStack(stack);

    // VPCが存在することを確認
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [{ Key: 'Name', Value: 'TestVPC' }]
    });
    
    // Publicサブネットが2つ存在することを確認（AZは確認していない）
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
      Tags: Match.arrayWith([
        { Key: 'aws-cdk:subnet-name', Value: 'Public' },
        { Key: 'aws-cdk:subnet-type', Value: 'Public' },
      ])
    }, 2);
    
    // Privateサブネットが2つ存在することを確認（AZは確認していない）
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
      Tags: Match.arrayWith([
        { Key: 'aws-cdk:subnet-name', Value: 'Private' },
        { Key: 'aws-cdk:subnet-type', Value: 'Private' },
      ])
    }, 2);
    
    // Isolatedサブネットが2つ存在することを確認（AZは確認していない）
    template.resourcePropertiesCountIs('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
      Tags: Match.arrayWith([
        { Key: 'aws-cdk:subnet-name', Value: 'Isolated' },
        { Key: 'aws-cdk:subnet-type', Value: 'Isolated' },
      ])
    }, 2);
  });
});
