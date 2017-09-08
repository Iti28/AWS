#!/bin/bash


aws cloudformation package --template-file /Users/itishatiwari/Desktop/Policies/Policies.yaml --s3-bucket mybucketfortempate --output-template-file IAMPackaged.yaml