#!/bin/bash

aws cloudformation package --template-file /Users/itishatiwari/Desktop/APIGateway/APIGateway.yaml  --s3-bucket mybucketfortempate --output-template-file APIGatewaypackaged.yaml