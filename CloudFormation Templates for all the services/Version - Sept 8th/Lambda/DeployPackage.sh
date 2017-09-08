#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/Lambda/Functionpackaged.yaml   --stack-name Function   --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

