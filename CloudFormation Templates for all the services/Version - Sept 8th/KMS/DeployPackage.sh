#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/KMS/KMSPackaged.yaml --stack-name KMS   --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
