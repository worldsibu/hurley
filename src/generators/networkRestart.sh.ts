// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class NetworkRestartShOptions {
    networkRootPath: string;
    users: number;
    channels: string[];
    organizations: string[];
}
export class NetworkRestartShGenerator extends BaseGenerator {
    success = join(this.path, 'cyptofilesgenerator.sh.successful');
    contents =
`#!/bin/bash
PROJECT_ROOT=${join(__dirname,'../../')}

#clean
docker stop $(docker ps -a | awk '$2~/hyperledger/ {print $1}') 
docker rm -f $(docker ps -a | awk '$2~/hyperledger/ {print $1}') $(docker ps -a | awk '{ print $1,$2 }' | grep dev-peer | awk '{print $1 }') || true
docker rmi -f $(docker images | grep dev-peer | awk '{print $3}') || true
  
# start
COMPOSE_PROJECT_NAME=net FABRIC_VERSION=x86_64-1.1.0 THIRDPARTY_VERSION=x86_64-0.4.6 docker-compose -f ${this.options.networkRootPath}/docker-compose.yaml up -d

# init

#!/bin/bash
USERS=${this.options.users}

function createchannel() {
    ${this.options.channels.map(ch => `
    echo "Creating ${ch} channel block in peer $1"
    docker exec $1 peer channel create  -o orderer.insitor.demo:7050 -c ${ch} -f /etc/hyperledger/configtx/${ch}.tx

    docker exec $1 mv ${ch}.block /shared/
    `).join('')}
}

function joinchannel() {
    ${this.options.channels.map(ch => `
    echo "Joining ${ch} channel on peer ${ch}"
    docker exec $1 peer channel join -b /shared/${ch}.block
    `).join('')}
}

function setanchor() {
    ${this.options.channels.map(ch => `
    echo "Creating ${ch} anchor block in peer $1"
    docker exec $1 peer channel update  -o orderer.insitor.demo:7050 -c ${ch} -f /etc/hyperledger/configtx/$1.${ch}.tx

    `).join('')}
}

function registeradmin() {
    node $PROJECT_ROOT/node_modules/@worldsibu/convector-tool-dev-env/dist/command.js add -admin admin adminpw $2 -k "${this.options.networkRootPath}/.hfc-$1" -p "${this.options.networkRootPath}/$1.network-profile.yaml"
}

function registeruser() {
    node $PROJECT_ROOT/node_modules/@worldsibu/convector-tool-dev-env/dist/command.js add -user $1 admin $4 -a $2.$3 -r client -k "${this.options.networkRootPath}/.hfc-$2" -p "${this.options.networkRootPath}/$2.network-profile.yaml"
}

createchannel peer0.${this.options.organizations[0]}.insitor.demo

sleep 5

${this.options.organizations.map(org => `joinchannel peer0.${org}.insitor.demo
`).join('')}
${this.options.organizations.map(org => `setanchor peer0.${org}.insitor.demo
`).join('')}

sleep 5

${this.options.organizations.map(org => `
echo "Registering admin for ${org}"
registeradmin ${org} ${org}MSP
`).join('')}


${Array.apply(null, { length: this.options.users }).map((user, index) => `

${this.options.organizations.map(org => `
echo "Registering user${index} for ${org}"
registeruser user${index} ${org} department1 ${org}MSP
`).join('')}
`).join('')}

`;

    constructor(filename: string, path: string, private options: NetworkRestartShOptions) {
        super(filename, path);
    }
}
