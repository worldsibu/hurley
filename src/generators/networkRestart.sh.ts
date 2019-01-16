// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join, dirname } from 'path';

const devEnvPath = dirname(require.resolve('@worldsibu/convector-tool-dev-env'));

export class NetworkRestartShOptions {
    networkRootPath: string;
    users: number;
    channels: string[];
    organizations: string[];
    insideDocker: boolean;
    envVars: {
        FABRIC_VERSION: string,
        THIRDPARTY_VERSION: string
    };
}
export class NetworkRestartShGenerator extends BaseGenerator {
    success = join(this.path, 'cyptofilesgenerator.sh.successful');
    contents = `
#!/bin/bash
set -e

#clean

ITEMS=$(docker ps -a | awk '$2~/hyperledger/ {print $1}') 

if [ ! -z "$ITEMS" ]; then
    docker stop $(docker ps -a | awk '$2~/hyperledger/ {print $1}') 
    docker rm -f $(docker ps -a | awk '$2~/hyperledger/ {print $1}') $(docker ps -a | awk '{ print $1,$2 }' | grep dev-peer | awk '{print $1 }') || true
    docker rmi -f $(docker images | grep dev-peer | awk '{print $3}') || true
fi

# start
COMPOSE_PROJECT_NAME=net \
FABRIC_VERSION=${this.options.envVars.FABRIC_VERSION} \
THIRDPARTY_VERSION=${this.options.envVars.THIRDPARTY_VERSION} \
docker-compose -f ${this.options.networkRootPath}/docker-compose.yaml up -d

# init

#!/bin/bash
USERS=${this.options.users}

function createchannel() {
    ${this.options.channels.map(ch => `
    echo "Creating ${ch} channel block in peer $1"
    docker exec $1 peer channel create  -o orderer.hurley.lab:7050 -c ${ch} -f /etc/hyperledger/configtx/${ch}.tx

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
    docker exec $1 peer channel update  -o orderer.hurley.lab:7050 -c ${ch} -f /etc/hyperledger/configtx/$1.${ch}.tx

    `).join('')}
}

function registeradmin() {
    node ${devEnvPath}/command.js add-admin admin adminpw $2\
        -k "${this.options.networkRootPath}/.hfc-$1"\
        -p "${this.options.networkRootPath}/network-profiles/$1.network-profile${this.options.insideDocker ? '.inside-docker' : ''}.yaml"
}

function registeruser() {
    node ${devEnvPath}/command.js add-user $1 admin $4\
        -a "org1"\
        -r client\
        -k "${this.options.networkRootPath}/.hfc-$2"\
        -p "${this.options.networkRootPath}/network-profiles/$2.network-profile${this.options.insideDocker ? '.inside-docker' : ''}.yaml"
}

createchannel peer0.${this.options.organizations[0]}.hurley.lab

sleep 10

${this.options.organizations.map(org => `joinchannel peer0.${org}.hurley.lab
`).join('')}
${this.options.organizations.map(org => `setanchor peer0.${org}.hurley.lab
`).join('')}

sleep 5

${this.options.organizations.map(org => `
echo "Registering admin for ${org}"
registeradmin ${org} ${org}MSP
wait
`).join('')}


${Array.apply(null, { length: this.options.users }).map((user, index) => `

${this.options.organizations.map(org => `
echo "Registering user${index + 1} for ${org}"
registeruser user${index + 1} ${org} department1 ${org}MSP 
wait
`).join('')}
`).join('')}

`;

    constructor(filename: string, path: string, private options: NetworkRestartShOptions) {
        super(filename, path);
    }
}
