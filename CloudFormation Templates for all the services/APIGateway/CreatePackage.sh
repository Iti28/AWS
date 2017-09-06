#!/bin/bash

aws cloudformation package --template-file /Users/itishatiwari/Desktop/Lambda/Functions.yaml  --s3-bucket mybucketfortempate --output-template-file Functionpackaged.yaml