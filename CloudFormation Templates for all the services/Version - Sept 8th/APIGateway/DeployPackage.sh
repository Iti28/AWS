#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop//APIGateway/APIGatewaypackaged.yaml   --stack-name APIGateway   --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

