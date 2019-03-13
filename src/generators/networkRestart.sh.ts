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
set +e

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
    SERVER=$1
    CH=$2

    echo "Creating $CH channel block in peer $SERVER"
    docker exec $SERVER peer channel create  -o orderer.hurley.lab:7050 -c $CH -f /etc/hyperledger/configtx/$CH.tx

    docker exec $SERVER mv $CH.block /shared/
}

function joinchannel() {
    echo "Joining $2 channel on peer $1"
    SERVER=$1
    CH=$2
    COUNTER=1
    MAX_RETRY=5
    DELAY="3"

    set -x
    output=$(docker exec $1 peer channel join -b /shared/$2.block && echo "pass" || echo "fail")
    set +x

    if [ "$output" == "fail" ]; then
        COUNTER=$(expr $COUNTER + 1)
        echo "$SERVER failed to join the channel, Retry after $DELAY seconds"
        sleep $DELAY
        joinchannel $SERVER $CH
    else
        COUNTER=1
    fi

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
        -r "client"\
        -k "${this.options.networkRootPath}/.hfc-$2"\
        -p "${this.options.networkRootPath}/network-profiles/$2.network-profile${this.options.insideDocker ? '.inside-docker' : ''}.yaml"
}

${this.options.channels.map(ch => `
createchannel peer0.${this.options.organizations[0]}.hurley.lab ${ch}

sleep 10

${this.options.organizations.map(org => `joinchannel peer0.${org}.hurley.lab ${ch}
`).join('')}
${this.options.organizations.map(org => `setanchor peer0.${org}.hurley.lab ${ch}
`).join('')}

`)}
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
