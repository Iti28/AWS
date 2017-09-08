#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/DynamoDB/DyanmoDBPackagedEnv.yaml  --stack-name DynamoDB   --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
