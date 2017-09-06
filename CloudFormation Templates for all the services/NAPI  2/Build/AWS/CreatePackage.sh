#!/bin/bash
./link.sh IAM $Environment  $path

./link.sh  DynamoDB $Environment  $path

aws cloudformation package --template-file $path/NAPI/Dist/AWS/NAPI.yaml --s3-bucket mybucketfortempate --output-template-file NAPIPackaged.yaml


















