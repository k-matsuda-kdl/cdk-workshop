import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Inspector2EnableResource } from '../inspector2-enable-resource';
import * as logs from 'aws-cdk-lib/aws-logs';
import { config } from 'dotenv';

config();

const devEnv = {
  account: process.env.ACCOUNT_ID || '',
  region: process.env.REGION || 'ap-northeast-1',
};

describe('Inpector2を構築', () => {
  test('ECRとEC2とLAMBDAをスキャンするInspector2を構築', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {env: devEnv}
    );

    new Inspector2EnableResource(stack, 'Inspector2EnableResource', {
      resourceTypes: ['ECR', 'EC2', 'LAMBDA'],
    });

    const template = Template.fromStack(stack);

    // resourceTypeがCustom::Inspector2Enableであることを確認
    template.hasResourceProperties('Custom::Inspector2Enable', {});


    // roleでLambdaからRoleを取得でき、AmazonInspector2FullAccessが付与されていることを確認
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: Match.arrayWith([
        {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'arn:',
              { 'Ref': 'AWS::Partition' },
              ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            ]),
          ]),
        },
        {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'arn:',
              { 'Ref': 'AWS::Partition' },
              ':iam::aws:policy/AmazonInspector2FullAccess',
            ]),
          ]),
        },
      ]),
    });
    // resourceTypeがCustom::Inspector2Enableであることを確認
    // CreateとDeleteでInspector2のenableとdisableが行われていることを確認
    template.hasResourceProperties('Custom::Inspector2Enable', {
      Create: Match.serializedJson({
        service: "Inspector2",
        action: "enable",
        parameters: {
          resourceTypes: ["ECR","EC2","LAMBDA"]
        },
        physicalResourceId: Match.anyValue(),
      }),
      Delete: Match.serializedJson({
        service: "Inspector2",
        action: "disable",
        parameters: {
          resourceTypes: ["ECR","EC2","LAMBDA"]
        },
        physicalResourceId: Match.anyValue(),
      }),
      InstallLatestAwsSdk: true,
    });
  });
});
