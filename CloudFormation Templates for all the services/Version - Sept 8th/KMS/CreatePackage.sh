#!/bin/bash


aws cloudformation package --template-file /Users/itishatiwari/Desktop/KMS/KMS.yaml --s3-bucket mybucketfortempate --output-template-file KMSPackaged.yaml