# CDK Typescriptのテスト用プロジェクト

動作確認は一切していないので、利用時は注意してください。

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## TODO
- AuroraはPRIVATE subnet
- AuroraのSecurity Groupは、EC2の踏み台から
- EC2のSSHは、KDLのネットワークから
- EC2のS3アクセスを消しておこう
- EC2は、SSM-AgentをOnにする
- InspectorをONにする
- addValidationを確認する
- RDSのInsightON
- RDSのログをCloudwatchに送る
- 
