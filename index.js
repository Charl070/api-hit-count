const { DynamoDB, Lambda } = require('aws-sdk');

const handler = async (event) => {
  console.log("request:", JSON.stringify(event, null, 2));

  // create AWS SDK clients
  const dynamo = new DynamoDB();
  const lambda = new Lambda();

  try {
    // update DynamoDB entry for "path" with hits++
    await dynamo.updateItem({
      TableName: process.env.HITS_TABLE_NAME,
      Key: { path: { S: event.path } },
      UpdateExpression: 'ADD hits :incr',
      ExpressionAttributeValues: { ':incr': { N: '1' } }
    }).promise();
  } catch (error) {
    console.error('Error updating DynamoDB:', error);
    throw new Error('Error updating hit count in DynamoDB');
  }

  let resp;
  try {
    // call downstream function and capture response
    resp = await lambda.invoke({
      FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
      Payload: JSON.stringify(event)
    }).promise();
  } catch (error) {
    console.error('Error invoking downstream function:', error);
    throw new Error('Error invoking downstream function');
  }

  console.log('downstream response:', JSON.stringify(resp, null, 2));

  // return response back to upstream caller
  try {
    return JSON.parse(resp.Payload);
  } catch (error) {
    console.error('Error parsing downstream response payload:', error);
    throw new Error('Error parsing downstream response payload');
  }
};

module.exports = { handler };
