#!/bin/bash

aws cloudformation package --template-file /Users/itishatiwari/Desktop/DynamoDB/DynamoDB.yaml  --s3-bucket mybucketfortempate --output-template-file DyanmoDBPackagedEnv.yaml