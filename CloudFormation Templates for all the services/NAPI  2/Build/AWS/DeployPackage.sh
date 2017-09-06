#!/bin/bash
aws cloudformation deploy --template-file $path/NAPI/Dist/AWS/NAPIPackaged.yaml --stack-name NAPI
--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
