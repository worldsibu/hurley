#!/bin/bash
ROOT_DIR=$1

COMPOSE_PROJECT_NAME=net \
  docker-compose -f $ROOT_DIR/docker-compose.yml down
