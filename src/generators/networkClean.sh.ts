// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class NetworkCleanShOptions {
}
export class NetworkCleanShGenerator extends BaseGenerator {
    success = join(this.path, 'networkclean.sh.successful');
    contents =
`#!/bin/bash
set -e
#clean
docker stop $(docker ps -a | awk '$2~/hyperledger/ {print $1}') 
docker rm -f $(docker ps -a | awk '$2~/hyperledger/ {print $1}') $(docker ps -a | awk '{ print $1,$2 }' | grep dev-peer | awk '{print $1 }') || true
docker rmi -f $(docker images | grep dev-peer | awk '{print $3}') || true
`;

    constructor(filename: string, path: string, private options: NetworkCleanShOptions) {
        super(filename, path);
    }
}
