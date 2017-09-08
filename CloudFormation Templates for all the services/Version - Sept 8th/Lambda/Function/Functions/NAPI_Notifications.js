'use strict';
const AWS = require('aws-sdk'), dc = new AWS.DynamoDB.DocumentClient(), sns = new AWS.SNS();

exports.handler = (event, context, callback) => {

    const done = (res, code) => callback(null, {
            statusCode: code ? code : '200',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        }),
        param = event.pathParameters,
        userId = param.UserId,
        appId = param.AppId,
        error = 'Please contact customer service.';

    dc.get({TableName: 'Users', Key: {UserId: userId}}).promise()
        .then(res => {
            if (res.Item) {
                const token = JSON.parse(event.body).Token, appArn = res.Item.Apps[appId].AppArn;
                switch (event.resource + event.httpMethod) {

                    case '/users/{UserId}/{AppId}/notificationsPOST':

                        if (!appArn)
                            sns.createPlatformEndpoint({
                                PlatformApplicationArn: 'arn:aws:sns:us-east-1:927990984884:app/GCM/NAPIPushPoC',
                                Token: token
                            }).promise().then(res =>
                                dc.update({
                                    TableName: 'Users',
                                    Key: {UserId: userId},
                                    UpdateExpression: 'SET Apps.#AppId.AppArn = :Arn',
                                    ExpressionAttributeNames: {'#AppId': appId},
                                    ExpressionAttributeValues: {':Arn': res.EndpointArn}
                                }).promise().then(() => done(`${appId} registered successfully for push notifications.`))
                            );
                        else {
                            sns.setEndpointAttributes({
                                Attributes: {Enabled: 'true', Token: token},
                                EndpointArn: appArn
                            }).promise().then(() => done(`${appId} re-registered successfully for push notifications.`));
                        }
                        break;

                    case '/users/{UserId}/{AppId}/notificationsDELETE':

                        dc.update({
                            Key: {UserId: userId},
                            ReturnValues: 'UPDATED_OLD',
                            TableName: 'Users',
                            ExpressionAttributeNames: {'#AppId': appId},
                            UpdateExpression: 'REMOVE Apps.#AppId.AppArn'
                        }).promise().then(res => {
                                console.log(JSON.stringify(res));
                                sns.deleteEndpoint({EndpointArn: res.Attributes.Apps[appId].AppArn}).promise()
                                    .then(() => done(`${appId} de-registered successfully from push notifications.`));
                            }
                        );
                        break;

                    default:
                        console.log('This lambda function should be used only for the cases above.');
                        done(error);
                }
            }
            else {
                console.log('User Not Found. Check Custom Authorizer.');
                done(error);
            }
        });
};