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
            if (res.Item)
                switch (event.resource + event.httpMethod) {

                    case '/users/{UserId}/{AppId}/notificationsPOST':

                        if (!res.Item.Apps[appId].AppArn)
                            sns.createPlatformEndpoint({
                                //PlatformApplicationArn: 'arn:aws:sns:us-east-1:927990984884:app/GCM/snstesting_MOBILEHUB_572918786',
                                PlatformApplicationArn: 'arn:aws:sns:us-east-1:927990984884:app/GCM/NAPIPushPoC',
                                Token: JSON.parse(event.body).Token
                            }).promise().then(res =>
                                dc.update({
                                    TableName: 'Users',
                                    Key: {UserId: userId},
                                    UpdateExpression: 'SET Apps.#AppId.AppArn = :Arn',
                                    ExpressionAttributeNames: {'#AppId': appId},
                                    ExpressionAttributeValues: {':Arn': res.EndpointArn}
                                }).promise().then(() => done(`${appId} registered successfully for push notifications.`))
                            );
                        else
                            done(`${appId} already registered for push notifications.`);
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
                                    .then(() => done(`Successfully de-registered ${appId} from push notifications.`));
                            }
                        );
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