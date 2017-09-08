#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/Roles/RolesPackaged.yaml --stack-name Roles    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
