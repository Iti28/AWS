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

    if (event.resource + event.httpMethod === '/topics/{TopicId}POST') {

        dc.get({TableName: 'Topics', Key: {TopicId: topicId}}).promise()
            .then(res => {
                if (Object.keys(res).length) {
                    console.log(JSON.stringify(res));
                    console.log(JSON.stringify(event));

                    sns.publish({
                        Message: payload.Value,
                        TopicArn: res.Item.TopicArn
                    }).promise().then(res => done('Message published to topic.'));
                }
            });
    }
    else {
        dc.get({TableName: 'Users', Key: {UserId: userId}}).promise()
            .then(res => {
                if (res.Item)
                    switch (event.resource + event.httpMethod) {

                        /*case '/topicsPOST':
                        dc.get({TableName: 'Topics', Key: {TopicId: TopicId}}).promise()
                            .then(res => Object.keys(res).length
                                ? done('Topic already exists') :
                                sns.createTopic({Name: TopicId}).promise().then(res => {
                                    payload.Arn = res.TopicArn;
                                    dc.put({TableName: 'Topics', Item: payload}).promise().then(() =>
                                        done('Topic created successfully'));
                                }));
                        break;
                        */
                        case '/users/{UserId}/{AppId}/topics/{TopicId}POST':

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
                                        sns.confirmSubscription({
                                            Token: value,
                                            TopicArn: topicArn
                                        }).promise().then(() => done('Topic subscription confirmed.'));
                                }
                            });

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
    }
};