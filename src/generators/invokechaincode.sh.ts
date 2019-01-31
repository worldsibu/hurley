// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class InvokeChaincodeShOptions {
    networkRootPath: string;
    channel: string;
    name: string;
    params: string;
    hyperledgerVersion: string;
    insideDocker: boolean;
}

export class InvokeChaincodeShGenerator extends BaseGenerator {
    success = join(this.path, 'tasks/', 'invokechaincode.sh.successful');
    contents = `
#!/bin/bash
set -e

export FABRIC_CFG_PATH=${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/config

echo "Invoking Chaincode at org1"
export CORE_PEER_MSPCONFIGPATH=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/org1.hurley.lab/users/Admin@org1.hurley.lab/msp
export CORE_PEER_ID=peer0.org1.hurley.lab
export CORE_PEER_ADDRESS=${this.options.insideDocker ? `peer0.org1.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7051`}
export CORE_PEER_LOCALMSPID=org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/org1.hurley.lab/msp/tlscacerts/tlsca.org1.hurley.lab-cert.pem

${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/bin/peer chaincode invoke \
    -C ${this.options.channel}\
    -n ${this.options.name}\
    -c '${this.options.params}'\
    -o ${this.options.insideDocker ? `orderer.hurley.lab` : 'localhost'}:7050\
    --cafile ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/hurley.lab/orderers/orderer.hurley.lab/msp/tlscacerts/tlsca.hurley.lab-cert.pem

echo "Invoked Chaincode at org1"

#mkdir -p ${this.options.networkRootPath}/tasks
#touch ${this.success}
  `;

    constructor(filename: string, path: string, private options: InvokeChaincodeShOptions) {
        super(filename, path);
    }
}