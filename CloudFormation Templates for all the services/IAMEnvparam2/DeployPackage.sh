#!/bin/bash
aws cloudformation deploy --template-file /Users/itishatiwari/Desktop/IAMEnvparam2/IAMPackaged.yaml --stack-name IAM     --parameter-overrides Env=Dev --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
