#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/Policies/IAMPackaged.yaml --stack-name Policies    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
