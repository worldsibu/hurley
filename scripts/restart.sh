#!/bin/bash
ROOT_DIR=<%= path %>

$ROOT_DIR/scripts/stop.sh $ROOT_DIR
$ROOT_DIR/scripts/clean.sh $ROOT_DIR
$ROOT_DIR/scripts/start.sh $ROOT_DIR
$ROOT_DIR/scripts/init.sh $ROOT_DIR
