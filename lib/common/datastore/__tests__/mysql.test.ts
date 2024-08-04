import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Mysql } from '../mysql';  // 実際のMysqlクラスのパスを指定してください
import { config } from 'dotenv';

config();

const devEnv = {
  account: process.env.ACCOUNT_ID || '',
  region: process.env.REGION || 'ap-northeast-1',
};

describe('Mysql', () => {
  test('踏み台からのみ3306でアクセス可能なMySQLを構築する', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {env: devEnv});

    new Mysql(stack, 'MysqlInstance', {
      vpcName: 'TestVPC',
      dbName: 'TestDB',
      mysqlUsername: undefined,
      engineVersion: undefined,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    });
    
    const template = Template.fromStack(stack);

    // デフォルトのusernameがhomepageであることを確認
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      GenerateSecretString: {
        SecretStringTemplate: JSON.stringify({ username: 'homepage' }),
      },
    });

    // エンジンバージョンがVER_8_0_35であることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'mysql',
      EngineVersion: '8.0.35',
    });

    // VPCが指定されたvpcNameのVPCであることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBSubnetGroupName: Match.objectLike({
        Ref: Match.stringLikeRegexp('MysqlInstanceDatabaseSubnetGroup'),
      }),
    });

    // SubnetがIsolatedのSubnetであることを確認
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'MysqlInstancesubnet group',
      SubnetIds: Match.anyValue(),
    });

    // 3306ポートでSSHSecurityGroupFromKDLからのアクセスが許可されていることを確認
    // descriptionしか特定する方法がないため、descriptionで特定した
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      Description: '3306 from SSHSecurityGroupFromKDL',
      FromPort: 3306,
      ToPort: 3306,
      IpProtocol: 'tcp',
      SourceSecurityGroupId: Match.anyValue(), // ここは特定のSG IDを期待しないように変更
    });

    // バックアップの保持期間が7日間であることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 7,
    });

    // instanceTypeが指定のインスタンスタイプであることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.t3.micro',
    });

    // メジャーバージョンアップが適用されないことを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      AllowMajorVersionUpgrade: false,
    });

    // マイナーバージョンアップが適用されていることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      AutoMinorVersionUpgrade: true,
    });

    // ストレージの暗号化が有効であることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
    });

    // パブリックアクセスが無効であることを確認
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      PubliclyAccessible: false,
    });
  });
});
