'use strict';
const AWS = require('aws-sdk'), dc = new AWS.DynamoDB.DocumentClient(), kms = new AWS.KMS();

exports.handler = (event, context, callback) => {

    const done = (res, code) => callback(null, {
            statusCode: code ? code : '200',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        }),
        user = event.requestContext.authorizer.principalId,
        error = 'Please contact customer service.';

    dc.get({TableName: 'Users', Key: {UserId: user}}).promise()
        .then(res => {
            if (res.Item)
                switch (event.resource) {

                    case '/users/{UserId}/keys':

                        if (event.httpMethod !== 'GET')
                            done(`Unsupported method ${event.httpMethod}`, 405);
                        else if (res.Item.Key) {
                            kms.decrypt({CiphertextBlob: res.Item.Key}).promise().then(mkey => done({Value: Array.from(mkey.Plaintext)}));
                        }
                        else
                            kms.generateDataKey({KeyId: 'alias/NAPI', KeySpec: 'AES_128'}).promise().then(
                                mkey =>
                                    dc.update({
                                        TableName: 'Users',
                                        Key: {UserId: user},
                                        UpdateExpression: 'set #K = :Key',
                                        ExpressionAttributeNames: {'#K': 'Key'},
                                        ExpressionAttributeValues: {':Key': mkey.CiphertextBlob}
                                    }).promise().then(() => {
                                        console.log(`Master Key not available for ${user}. Created new Master Key.`);
                                        done({Value: Array.from(mkey.Plaintext)});
                                    })
                            );
                        break;

                    case '/keys' :

                        if (event.httpMethod !== 'POST')
                            done(`Unsupported method ${event.httpMethod}`, 405);
                        else kms.generateDataKey({KeyId: 'alias/NAPI', KeySpec: 'AES_128'}).promise().then(keys => done(
                            {CiphertextBlob: Array.from(keys.CiphertextBlob), Plaintext: Array.from(keys.Plaintext)}));
                        break;

                    default:
                        console.log('This lambda function should be used only for the cases above.');
                        done(error);
                }
            else {
                console.log('User Not Found. Check Custom Authorizer.');
                done(error);
            }
        });
};