'use strict';
console.log('Loading NAPI API Gateway Custom Authorizer');
const AWS = require('aws-sdk'), iam = new AWS.IAM(), dc = new AWS.DynamoDB.DocumentClient(),
    auth = new (require('google-auth-library')), client = new auth.OAuth2('', '', ''), policyarn = 'arn:aws:iam::746467874849:policy/NAPI-',
    aud = ['223103292248-hdfsm66822ggt3afjbtsd57b61ntmn7u.apps.googleusercontent.com',
        '223103292248-7o4qkm2lqv8di4n91cq4ch304un7r586.apps.googleusercontent.com',
        '223103292248-7c83q8pgpud856a873853r8ekqf3kh3u.apps.googleusercontent.com'];

exports.handler = (event, context, callback) => {

    const err = e => {
        console.log(e);
        callback('Unauthorized');
    };

    client.verifyIdToken(event.authorizationToken, aud, (e, res) => {

        if (e) err(e);
        else {
            if (res.getPayload().email_verified) {

                dc.query({
                    TableName: 'Users',
                    IndexName: 'Email',
                    KeyConditionExpression: 'Email = :email',
                    ExpressionAttributeValues: {':email': res.getPayload().email}
                }).promise().then(users => {

                    if (users.Count === 0) err('Not a valid Starlight user');
                    else if (users.Count > 1) err('Multiple users found');
                    else {
                        const userType = 'ApplicationAdmin', //users.Items[0].UserType,
                            arn = policyarn + userType;
                        iam.getPolicy({PolicyArn: arn}).promise().then(val =>
                            iam.getPolicyVersion({
                                VersionId: val.Policy.DefaultVersionId,
                                PolicyArn: arn
                            }).promise().then(res => {
                                const policy = JSON.parse(decodeURIComponent(res.PolicyVersion.Document));
                                if (userType === 'Patient') {

                                    let resource = [];
                                    for (let i = 0, len = policy.Statement[0].Resource.length; i < len; i++) {

                                        const str = policy.Statement[0].Resource[i], lastIndex = str.lastIndexOf('*');
                                        if (str.includes('/user'))
                                            resource.push(str.slice(0, lastIndex) + users.Items[0].UserId + str.slice(lastIndex + 1));
                                        else if (str.includes('/devices'))
                                            Array.prototype.push.apply(resource, users.Items[0].Devices.map(device => str.slice(0, lastIndex) + device + str.slice(lastIndex + 1)));
                                        else
                                            console.log('Invalid policy entry - ' + str);
                                    }
                                    policy.Statement[0].Resource = resource;
                                }
                                callback(null, {policyDocument: policy, principalId: users.Items[0].UserId});
                            }));
                    }
                });
            } else err('Email not verified');
        }
    });
};