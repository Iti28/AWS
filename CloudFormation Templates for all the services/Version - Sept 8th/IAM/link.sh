#!/bin/bash
Env=Dev

if [[ -L env ]];then

  if [ "$(readlink env)" = "$Env" ];then

        echo "env --> $Env"

   else

       ln -sfn  "$Env"  env
   fi


else

      ln -s  "$Env"  env

fi






