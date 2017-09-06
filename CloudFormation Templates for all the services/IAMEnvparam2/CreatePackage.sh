#!/bin/bash


./link.sh Dev

aws cloudformation package --template-file /Users/itishatiwari/Desktop/IAMEnvparam2/IAM.yaml --s3-bucket mybucketfortempate --output-template-file IAMPackaged.yaml