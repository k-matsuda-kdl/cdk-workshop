import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Inspector2EnableResource } from './common/monitor/inspector2-enable-resource';


export class Inspector2Stack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Inspector2を単一アカウントで有効化
    new Inspector2EnableResource(this, 'EnableInspector2Resource', {
      resourceTypes: ['ECR', 'EC2', 'LAMBDA'],
    });
  }
}
