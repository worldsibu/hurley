// tslint:disable:max-line-length
import { ClientConfig, ClientHelper, TxResult } from '@worldsibu/convector-common-fabric-helper';
import { join, resolve } from 'path';
import { l } from '../utils/logs';

export class InvokeChaincodeShOptions {
    networkRootPath: string;
    channel: string;
    name: string;
    params: string[];
    function: string;
    hyperledgerVersion: string;
    insideDocker: boolean;
    user?= 'user1';
    organization?= 'org1';
}

export class InvokeChaincodeShGenerator {
    //     success = join(this.path, 'tasks/', 'invokechaincode.sh.successful');
    //     contents = `
    // #!/bin/bash
    // set -e

    // export FABRIC_CFG_PATH=${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/config

    // echo "Invoking Chaincode at ${this.options.organization}"
    // export CORE_PEER_MSPCONFIGPATH=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${this.options.organization}.hurley.lab/users/${this.options.user}@${this.options.organization}.hurley.lab/msp
    // export CORE_PEER_ID=peer0.${this.options.organization}.hurley.lab
    // export CORE_PEER_ADDRESS=${this.options.insideDocker ? `peer0.${this.options.organization}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7051`}
    // export CORE_PEER_LOCALMSPID=${this.options.organization}MSP
    // export CORE_PEER_TLS_ROOTCERT_FILE=${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${this.options.organization}.hurley.lab/msp/tlscacerts/tlsca.${this.options.organization}.hurley.lab-cert.pem

    // ${this.options.networkRootPath}/fabric-binaries/${this.options.hyperledgerVersion}/bin/peer chaincode invoke \
    //     -C ${this.options.channel}\
    //     -n ${this.options.name}\
    //     -c '${this.options.params}'\
    //     -o ${this.options.insideDocker ? `orderer.hurley.lab` : 'localhost'}:7050\
    //     --cafile ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/hurley.lab/orderers/orderer.hurley.lab/msp/tlscacerts/tlsca.hurley.lab-cert.pem

    // echo "Invoked Chaincode at ${this.options.organization}"

    // #mkdir -p ${this.options.networkRootPath}/tasks
    // #touch ${this.success}
    //   `;

    constructor(private path: string, private options: InvokeChaincodeShOptions) {
    }

    async run() {
        const homedir = require('os').homedir();

        let helper = new ClientHelper({
            channel: this.options.channel,
            skipInit: true,
            user: this.options.user,
            keyStore: resolve(this.path, `.hfc-${this.options.organization}`),
            networkProfile: resolve(this.path, `network-profiles/${this.options.organization}.network-profile.yaml`),
            txTimeout: 30000
        });

        l('Sending transaction...');
        await helper.init();
        let res: TxResult;
        try {
            res = await helper.invoke(this.options.function, this.options.name, this.options.user, ...this.options.params);

            l(`Transaction sent! ${res.code} ${res.info} ${res.status} ${res.txId}`);
            l(`Result: ${JSON.stringify(res.result)}`);
        } catch (ex) {
            l(`Transaction failed!`);
            l(ex);
        }
    }
}