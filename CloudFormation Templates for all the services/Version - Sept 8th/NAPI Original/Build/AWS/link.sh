#!/bin/bash

service=$1
Env=$path/$service/$Environment
env=$path/$service/env


if [[ -L "$env" ]];then

if [ "$(readlink $env)" = "$Env" ];then

echo "env --> $Env"

else

ln -sfn  "$Env"  $env

fi

else

ln -s  "$Env"  $env

fi








