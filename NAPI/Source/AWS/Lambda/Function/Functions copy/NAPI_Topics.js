'use strict';
const AWS = require('aws-sdk'), dc = new AWS.DynamoDB.DocumentClient(), sns = new AWS.SNS();

exports.handler = (event, context, callback) => {

    const param = event.pathParameters,
        payload = JSON.parse(event.body),
        value = payload.Value.trim().toLowerCase(),
        appId = param.AppId,
        userId = param.UserId,
        topicId = param.TopicId,
        error = 'Please contact customer service.',
        done = (res, code) => callback(null, {
            statusCode: code ? code : '200',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        });

    switch (event.resource + event.httpMethod) {

        case '/notifications/topics/{TopicId}POST':

            dc.get({TableName: 'Topics', Key: {TopicId: topicId}}).promise()
                .then(res => {
                    if (Object.keys(res).length) {
                        sns.publish({
                            Message: payload.Value,
                            TopicArn: res.Item.TopicArn
                        }).promise().then(res => done('Message published to topic.'));
                    }
                });
            break;

        case '/notifications/users/{UserId}/{AppId}POST' :

            dc.get({TableName: 'Users', Key: {UserId: userId}}).promise()
                .then(res => {
                    if (res.Item) {
                        sns.publish({
                            Message: payload.Value,
                            TargetArn: res.Item.Apps[appId].AppArn
                        }).promise().then(res => done('Message sent to user.'));
                    }
                });
            break;

        case '/users/{UserId}/{AppId}/topics/{TopicId}POST':

            dc.get({TableName: 'Users', Key: {UserId: userId}}).promise()
                .then(res => {
                    if (res.Item)


                        Promise.all([
                            dc.get({Key: {UserId: userId}, TableName: 'Users', ProjectionExpression: 'Apps.' + appId}).promise(),
                            dc.get({Key: {TopicId: topicId}, TableName: 'Topics', ProjectionExpression: 'TopicArn'}).promise(),
                        ]).then(results => {
                            const endPoint = results[0].Item.Apps[appId].AppArn;
                            const topicArn = results[1].Item.TopicArn;
                            switch (value) {

                                case 'yes':
                                case 'no':
                                    dc.update({
                                        Key: {UserId: userId},
                                        TableName: 'Users',
                                        UpdateExpression: value === 'yes'
                                            ? 'SET Apps.' + appId + '.Topics.#topicArn = :topic'
                                            : 'SET Apps.' + appId + '.Topics.' + topicArn + '.Enabled = false',
                                        ExpressionAttributeNames: {'#topicArn': topicArn},
                                        ExpressionAttributeValues: {':topic': {Enabled: true, Protocol: 'Application'}}
                                    }).promise().then(() => (value === 'yes')
                                        ? sns.subscribe({
                                            Protocol: 'application',
                                            TopicArn: topicArn,
                                            Endpoint: endPoint
                                        }).promise().then(() => done('Subscribed to topic successfully.'))
                                        : sns.unsubscribe({SubscriptionArn: ''}).promise().then(
                                            () => done('Un-subscribed from topic successfully.')));
                                    break;
                                default:
                                    done('Invalid Topic subscription value.');
                            }
                        });
                    else {
                        console.log('User Not Found. Check Custom Authorizer.');
                        done(error);
                    }
                });
            break;

        default:
            console.log('This lambda function should be used only for the cases above.');
            done(error);
    }
};