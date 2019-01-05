// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class NetworkProfileYamlGeneratorOptions {
    org: string;
    networkRootPath: string;
    channels: string[];
    orgs: string[];
}
export class NetworkProfileYamlGenerator extends BaseGenerator {
    contents =
        `name: "${this.options.org}"
version: "1.0"

client:
    organization: ${this.options.org}MSP
    credentialStore:
        path: ${this.options.networkRootPath}/.hfc-${this.options.org}
        cryptoStore:
            path: ${this.options.networkRootPath}/.hfc-${this.options.org}

channels:${this.options.channels.map(channel => `
    ${channel}:
        orderers:
            - orderer.insitor.lab
        peers:${this.options.orgs.map(cOrg => `
            peer0.${cOrg}.insitor.lab:
                endorsingPeer: true
                chaincodeQuery: true
                ledgerQuery: true
                eventSource: true
        `).join('')}

`).join('')}
organizations:${this.options.orgs.map(cOrg => `
    ${cOrg}MSP:
        mspid: ${cOrg}MSP
        peers:
            - peer0.${cOrg}.insitor.lab
        certificateAuthorities:
            - ca.${cOrg}.insitor.lab
        adminPrivateKey:
            path: ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.insitor.lab/users/Admin@${cOrg}.insitor.lab/msp/keystore/
        signedCert:
            path: ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.insitor.lab/users/Admin@${cOrg}.insitor.lab/msp/signcerts/
`).join('')}
orderers:
    orderer.insitor.lab:
        url: grpc://localhost:7050
        grpcOptions:
            ssl-target-name-override: orderer.insitor.lab
            grpc-max-send-message-length: 15
        tlsCACerts:
            path: ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/insitor.lab/orderers/orderer.insitor.lab/msp/tlscacerts/tlsca.insitor.lab-cert.pem

peers:${this.options.orgs.map((cOrg, index) => `
    peer0.${cOrg}.insitor.lab:
        url: grpc://localhost:7${index}51
        eventUrl: grpc://localhost:7${index}52
        grpcOptions:
            ssl-target-name-override: peer0.${cOrg}.insitor.lab
            grpc.keepalive_time_ms: 600000
        tlsCACerts:
            path: ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.insitor.lab/peers/peer0.${cOrg}.insitor.lab/msp/tlscacerts/tlsca.${cOrg}.insitor.lab-cert.pem
`).join('')}
certificateAuthorities:${this.options.orgs.map((cOrg, index) => `
    ca.${cOrg}.insitor.lab:
        url: http://localhost:7${index}54
        httpOptions:
            verify: false
        tlsCACerts:
            path: ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.insitor.lab/ca/ca.${cOrg}.insitor.lab-cert.pem
        registrar:
            - enrollId: admin
              enrollSecret: adminpw
        caName: ca.${cOrg}.insitor.lab
`).join('')}
  ` ;

    constructor(filename: string, path: string, private options: NetworkProfileYamlGeneratorOptions) {
        super(filename, path);

        this.success = join(path, 'networkprofile.yaml.successful');
    }
}
