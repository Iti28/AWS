'use strict';
const AWS = require('aws-sdk'), dc = new AWS.DynamoDB.DocumentClient(), uuidV4 = require('uuid/v4'), cloudwatchevents = new AWS.CloudWatchEvents();

exports.handler = (event, context, callback) => {

    const {resources, body, 'detail-type': type} = event,
        error = 'Please contact customer service.',
        done = (res, code) => callback(null, {
            statusCode: code ? code : '200',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        });

    if (type === 'Scheduled Event') {

        dc.query({
            TableName: 'Reminders',
            IndexName: 'ReminderName-index',
            KeyConditionExpression: 'ReminderName = :reminderName',
            ExpressionAttributeValues: {':reminderName': resources[0].slice(resources[0].lastIndexOf('/') + 1)}
        }).promise().then(reminders => {

            if (reminders.Count === 0) done('Not a valid Reminder');
            else if (reminders.Count > 1) done('Multiple Reminders found')
            else {

                console.log(JSON.stringify(reminders));
                done('success');
            }
        });
    }
    else {
        const payload = JSON.parse(body),
            {ReminderName, Active, FrequencyUnit, FrequencyValue, ReminderId} = payload;

        switch (event.resource + event.httpMethod) {

            case '/jobs/remindersPOST':

                if (!ReminderId) payload.ReminderId = uuidV4();
                payload.UserId = event.requestContext.authorizer.principalId;
                dc.get({TableName: 'Reminders', Key: {ReminderId: payload.ReminderId}}).promise()
                    .then(res => {
                        if (Object.keys(res).length)
                            done('Reminder already exists');
                        else {
                            dc.put({TableName: 'Reminders', Item: payload}).promise().then(() => done({Value: payload.ReminderId}));
                            cloudwatchevents.putRule({
                                Name: ReminderName,
                                ScheduleExpression: `rate(${FrequencyValue} ${FrequencyUnit})`,
                                State: Active ? 'ENABLED' : 'DISABLED',
                                RoleArn: 'arn:aws:iam::927990984884:role/NAPI-DynamoDB-Development'
                            }).promise().then(() => {
                                cloudwatchevents.putTargets({
                                    Rule: ReminderName,
                                    Targets: [{
                                        Arn: 'arn:aws:lambda:us-east-1:927990984884:function:PremTest',
                                        Id: '1'
                                    }]
                                }).promise().then().done('Reminder created successfully');
                            });
                        }
                    });
                break;

            case '/jobs/reminders/{ReminderId}POST':

                break;

            default:
                console.log('This lambda function should be used only for the cases above.');
                done(error);
        }
    }
};