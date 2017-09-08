#!/bin/bash


aws cloudformation package --template-file /Users/itishatiwari/Desktop/Roles/Roles.yaml --s3-bucket mybucketfortempate --output-template-file RolesPackaged.yaml