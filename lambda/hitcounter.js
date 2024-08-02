const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // AWS SDKクライアントの作成
  const dynamo = new DynamoDBClient({})
  const lambda = new LambdaClient({})


  // "path"のエントリを更新し、hitsをインクリメント
  const updateParams = {
    TableName: process.env.HITS_TABLE_NAME,
    Key: { path: { S: event.path } },
    UpdateExpression: 'ADD hits :incr',
    ExpressionAttributeValues: { ':incr': { N: '1' } },
  }
  await dynamo.send(new UpdateItemCommand(updateParams))

  // ダウンストリーム関数を呼び出してレスポンスをキャプチャ
  const invokeParams = {
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event),
  }

  const resp = await lambda.send(new InvokeCommand(invokeParams))

  console.log('downstream response:', JSON.stringify(resp, undefined, 2))

  // アップストリームの呼び出し元にレスポンスを返す
  return JSON.parse(new TextDecoder('utf-8').decode(resp.Payload))
};