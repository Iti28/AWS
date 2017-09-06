#!/bin/bash

./link.sh  Dev


aws cloudformation package --template-file ../../Source/AWS/NAPI.yaml --s3-bucket mybucketfortempate --output-template-file ../../Dist/AWS/NAPIPackaged.yaml


















