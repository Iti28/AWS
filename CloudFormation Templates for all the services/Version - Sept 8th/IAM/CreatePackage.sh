#!/bin/bash

./link.sh

aws cloudformation package --template-file /Users/itishatiwari/Desktop/IAM/IAM.yaml --s3-bucket mybucketfortempate --output-template-file IAMPackaged.yaml