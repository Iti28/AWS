'use strict';
console.log('Loading generic lambda function for creating and updating Users/Devices/Logs/Topics');
const AWS = require('aws-sdk'), dc = new AWS.DynamoDB.DocumentClient(), sns = new AWS.SNS(), uuidV4 = require('uuid/v4');

exports.handler = (event, context, callback) => {

    const payload = JSON.parse(event.body),
        resource = event.resource,
        param = event.pathParameters,
        user = event.requestContext.authorizer.principalId,
        done = (res, code) => callback(null, {
            statusCode: code ? code : '200',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        });
    let id, table, altflow;

    switch (resource) {

        case '/users':
        case '/users/{UserId}':
            id = 'UserId';
            table = 'Users';
            break;

        case '/devices':
        case '/devices/{DeviceId}':
            id = 'DeviceId';
            table = 'Devices';
            break;

        case '/users/{UserId}/{AppId}/logs/{LogId}':
            payload.AppId = param.AppId;

        case '/devices/{DeviceId}/logs/{LogId}':
            payload.LogId = param.LogId;

        case '/devices/{DeviceId}/logs':
            id = 'LogId';
            table = 'Logs';
            break;

        case '/users/{UserId}/{AppId}/logs':
            payload.AppId = param.AppId;
            id = 'LogId';
            table = 'Logs';
            break;

        case '/topics':
            id = 'TopicId';
            table = 'Topics';
            if (event.httpMethod === 'POST' && !payload.TopicArn) {
                altflow = true;
                sns.createTopic({Name: payload.TopicName}).promise().then(res => {
                    payload.TopicArn = res.TopicArn;
                    post();
                });
            }
            break;

        case '/topics/{TopicId}':
            id = 'TopicId';
            table = 'Topics';
    }

    if (!altflow) {

        if (id) {

            if (resource !== '/users' || event.httpMethod !== 'POST') payload.UserId = user;
            if (resource.startsWith('/devices/{DeviceId}/{AppId}/logs')) payload.TypeId = param.DeviceId;

            switch (event.httpMethod) {

                case 'POST':
                    post();
                    break;

                case 'PUT':
                    payload[id] = param[id];
                    dc.put({TableName: table, Item: payload, ConditionExpression: id + ' = :id', ExpressionAttributeValues: {':id': payload[id]}})
                        .promise().then(() => done({Value: payload[id]})).catch(() => done(`${table.slice(0, table.length - 1)} not found`));
                    break;

                default:
                    done(`Unsupported method ${event.httpMethod}`, 405);
            }
        }
        else {
            done(`Unsupported resource ${resource}`, 405);
        }
    }

    function post() {

        if (!payload[id]) payload[id] = uuidV4();
        dc.get({TableName: table, Key: {[id]: payload[id]}}).promise()
            .then(res => Object.keys(res).length
                ? done(`${table.slice(0, table.length - 1)} already exists`) :
                dc.put({TableName: table, Item: payload}).promise().then(() => done({Value: payload[id]}))
            );
    }
};