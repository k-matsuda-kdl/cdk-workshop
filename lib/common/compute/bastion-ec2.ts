/* eslint-disable import/no-extraneous-dependencies */
import { Duration, Stack } from 'aws-cdk-lib';
import {
  Vpc,
  SecurityGroup,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  CloudFormationInit,
  InitConfig,
  InitFile,
  InitCommand,
  UserData,
  MachineImage,
  AmazonLinuxCpuType,
  Peer,
  Port,
} from 'aws-cdk-lib/aws-ec2';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BastionEC2Props {
  vpcName: string;
  sshPubKey: string;
  allowSshIps?: string;
}

export class BastionEC2 extends Construct {
  public instance: Instance;

  constructor(scope: Construct, id: string, props: BastionEC2Props) {
    super(scope, id);

    const { vpcName, sshPubKey, allowSshIps } = props;

    // vpcを取得
    const vpc = Vpc.fromLookup(this, 'ExistingVpc', {
      vpcName: vpcName, // 既存のVPCのnameを指定
    });
    
    // EC2のRoleを作成 CloudWatch Logsにログを送信するための権限を追加
    const serverRole = new Role(this, 'serverEc2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        ['RetentionPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['logs:PutRetentionPolicy'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'), // SSMAgentをインストールするための権限
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'), // CloudWatch Logsにログを送信するための権限
      ],
    });

    const userData = UserData.forLinux();

    // 初期コマンド MySQLクライアントのインストール
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum -y localinstall  https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm',
      'rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2023',
      'yum -y install mysql mysql-community-client',
    );

    // Create a Security Group for the EC2 instance.  This group will allow SSH access to the EC2 instance
    const ec2InstanceSecurityGroup = new SecurityGroup(this, 'ec2InstanceSecurityGroup', {
        vpc: vpc,
        securityGroupName: "SSHSecurityGroupFromKDL",
        description: 'Security Group for SSH',
        allowAllOutbound: true
    });
    if (allowSshIps) {
      // 各IPアドレスに対してSSHアクセスを許可
      const ips = allowSshIps.split(',').map(ip => ip.trim());
      ips.forEach(ip => {
        ec2InstanceSecurityGroup.addIngressRule(Peer.ipv4(ip), Port.tcp(22), `Allow SSH access from ${ip}`);
      });
    }
    // // 124.33.127.18/32, 52.69.217.53/32, 113.37.16.194/32のSSHアクセスを許可
    // ec2InstanceSecurityGroup.addIngressRule(Peer.ipv4('124.33.127.18/32'), Port.tcp(22));
    // ec2InstanceSecurityGroup.addIngressRule(Peer.ipv4('52.69.217.53/32'), Port.tcp(22));
    // ec2InstanceSecurityGroup.addIngressRule(Peer.ipv4('113.37.16.194/32'), Port.tcp(22));

    // Create the EC2 instance
    this.instance = new Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO), // t2.microとする
      machineImage: MachineImage.latestAmazonLinux2023({
        cachedInContext: false,
        cpuType: AmazonLinuxCpuType.X86_64, // x86_64とする
      }),
      userData: userData,
      securityGroup: ec2InstanceSecurityGroup,
      init: CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['config'],
        },
        configs: {
          config: new InitConfig([
            InitFile.fromObject('/etc/config.json', {
              // Use CloudformationInit to create an object on the EC2 instance
              STACK_ID: Stack.of(this).artifactId,
            }),
            InitFile.fromFileInline(
              // Use CloudformationInit to copy a file to the EC2 instance
              '/tmp/amazon-cloudwatch-agent.json',
              './lib/resources/server/config/amazon-cloudwatch-agent.json',
            ),
            InitFile.fromFileInline(
              '/etc/config.sh',
              'lib/resources/server/config/config.sh',
            ),
            InitFile.fromString(
              // Use CloudformationInit to write a string to the EC2 instance
              '/home/ec2-user/.ssh/authorized_keys',
              sshPubKey + '\n',
            ),
            InitCommand.shellCommand('chmod +x /etc/config.sh'), // Use CloudformationInit to run a shell command on the EC2 instance
            InitCommand.shellCommand('/etc/config.sh'),
          ]),
        },
      }),

      initOptions: {
        timeout: Duration.minutes(10),
        includeUrl: true,
        includeRole: true,
        printLog: true,
      },
      role: serverRole,
    });
  }
}
