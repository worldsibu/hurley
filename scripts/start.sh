#!/bin/bash
ROOT_DIR=$1

COMPOSE_PROJECT_NAME=net FABRIC_VERSION=x86_64-1.1.0 THIRDPARTY_VERSION=x86_64-0.4.6 \
  docker-compose -f $ROOT_DIR/docker-compose.yml up -d
