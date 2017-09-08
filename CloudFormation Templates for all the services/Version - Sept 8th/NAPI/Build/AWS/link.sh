#!/bin/bash
Env=$1


if [[ -L ../../Source/AWS/env ]];then

if [ "$(readlink ../../Source/AWS/env)" = "../../Source/AWS/$Env" ];then

echo "env --> $Env"

else

ln -sfn  "../../Source/AWS/$Env"  ../../Source/AWS/env

fi

else

ln -s  "../../Source/AWS/$Env"  ../../Source/AWS/env

fi








