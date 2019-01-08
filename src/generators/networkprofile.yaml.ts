// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class NetworkProfileYamlGeneratorOptions {
    org: string;
    networkRootPath: string;
    channels: string[];
    orgs: string[];
    insideDocker: boolean;
}
export class NetworkProfileYamlGenerator extends BaseGenerator {
    contents =
        `name: "${this.options.org}"
version: "1.0"

client:
    organization: ${this.options.org}MSP
    credentialStore:
        path: ${this.options.insideDocker ? `/config/.hfc-${this.options.org}` : `${this.options.networkRootPath}/.hfc-${this.options.org}`} 
        cryptoStore:
            path: ${this.options.insideDocker ? `/config/.hfc-${this.options.org}` : `${this.options.networkRootPath}/.hfc-${this.options.org}`} 

channels:${this.options.channels.map(channel => `
    ${channel}:
        orderers:
            - orderer.hurley.lab
        peers:${this.options.orgs.map(cOrg => `
            peer0.${cOrg}.hurley.lab:
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
            - peer0.${cOrg}.hurley.lab
        certificateAuthorities:
            - ca.${cOrg}.hurley.lab
        adminPrivateKey:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.hurley.lab/users/Admin@${cOrg}.hurley.lab/msp/keystore/
        signedCert:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.hurley.lab/users/Admin@${cOrg}.hurley.lab/msp/signcerts/
`).join('')}
orderers:
    orderer.hurley.lab:
        url: grpc://${this.options.insideDocker ? `orderer.hurley.lab` : 'localhost'}:7050
        grpcOptions:
            ssl-target-name-override: orderer.hurley.lab
            grpc-max-send-message-length: -1
        tlsCACerts:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/hurley.lab/orderers/orderer.hurley.lab/msp/tlscacerts/tlsca.hurley.lab-cert.pem

peers:${this.options.orgs.map((cOrg, index) => `
    peer0.${cOrg}.hurley.lab:
        url: grpc://${this.options.insideDocker ? `peer0.${cOrg}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7${index}51`}
        eventUrl: grpc://${this.options.insideDocker ? `peer0.${cOrg}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7052' : `7${index}52`}
        grpcOptions:
            ssl-target-name-override: peer0.${cOrg}.hurley.lab
            grpc.keepalive_time_ms: 600000
        tlsCACerts:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.hurley.lab/peers/peer0.${cOrg}.hurley.lab/msp/tlscacerts/tlsca.${cOrg}.hurley.lab-cert.pem
`).join('')}
certificateAuthorities:${this.options.orgs.map((cOrg, index) => `
    ca.${cOrg}.hurley.lab:
        url: http://${this.options.insideDocker ? `ca.${cOrg}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7054' : `7${index}54`}
        httpOptions:
            verify: false
        tlsCACerts:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg}.hurley.lab/ca/ca.${cOrg}.hurley.lab-cert.pem
        registrar:
            - enrollId: admin
              enrollSecret: adminpw
        caName: ca.${cOrg}.hurley.lab
`).join('')}
  ` ;

    constructor(filename: string, path: string, private options: NetworkProfileYamlGeneratorOptions) {
        super(filename, path);

        this.success = join(path, 'networkprofile.yaml.successful');
    }
}
