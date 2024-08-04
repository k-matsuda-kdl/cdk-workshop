import {  Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Mysql } from './common/datastore/mysql';

export class ProductionDbStack extends Stack {
  
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // VPC名
    const vpcName = process.env.VPC_NAME || 'KMatsudaVPC';
    const dbName = "sampledb";

    // 基本のVpcを作成
    const mysql = new Mysql(this, 'Mysql',{
      vpcName: vpcName,
      dbName:dbName,
      instanceType:"t3.medium",
    });

    new CfnOutput(this, 'MysqlEndpoint', {
      exportName: 'MysqlEndPoint',
      value: mysql.mysqlInstance.dbInstanceEndpointAddress,
    });

    new CfnOutput(this, 'MysqlDbName', {
      exportName: 'MysqlDbName',
      value: dbName,
    });

    new CfnOutput(this, 'OutputGetSecretValue', {
      exportName: 'GetSecretValue',
      value: 'aws secretsmanager get-secret-value --secret-id '+ mysql.mysqlInstance.secret?.secretArn,
    });
  }
}
