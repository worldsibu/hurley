// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';
import { Organization } from '../models/organization';
import { Channel } from '../models/channel';

export class NetworkProfileYamlGeneratorOptions {
    org: Organization;
    networkRootPath: string;
    //channels: Channel[];
    orgs: Organization[];
    insideDocker: boolean;
}
export class NetworkProfileYamlGenerator extends BaseGenerator {
    contents =
        `name: "${this.options.org.name}"
version: "1.0"

client:
    organization: ${this.options.org.name}MSP
    credentialStore:
        path: ${this.options.insideDocker ? `/config/.hfc-${this.options.org.name}` : `${this.options.networkRootPath}/.hfc-${this.options.org.name}`} 
        cryptoStore:
            path: ${this.options.insideDocker ? `/config/.hfc-${this.options.org.name}` : `${this.options.networkRootPath}/.hfc-${this.options.org.name}`} 

channels:${this.options.org.channels.map(channel => `
    ${channel.name}:
        orderers:
            - orderer.hurley.lab
        peers:${this.options.orgs
            .filter(cOrg => cOrg.channels.some(ch => ch.name === channel.name))
            .map(cOrg => `
            peer0.${cOrg.name}.hurley.lab:
                endorsingPeer: true
                chaincodeQuery: true
                ledgerQuery: true
                eventSource: true
        `).join('')}

`).join('')}
organizations:${this.options.orgs.map(cOrg => `
    ${cOrg.name}MSP:
        mspid: ${cOrg.name}MSP
        peers:
            - peer0.${cOrg.name}.hurley.lab
        certificateAuthorities:
            - ca.${cOrg.name}.hurley.lab
        adminPrivateKey:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg.name}.hurley.lab/users/Admin@${cOrg.name}.hurley.lab/msp/keystore/
        signedCert:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg.name}.hurley.lab/users/Admin@${cOrg.name}.hurley.lab/msp/signcerts/
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
    peer0.${cOrg.name}.hurley.lab:
        url: grpc://${this.options.insideDocker ? `peer0.${cOrg.name}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7051' : `7${index}51`}
        eventUrl: grpc://${this.options.insideDocker ? `peer0.${cOrg.name}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7052' : `7${index}52`}
        grpcOptions:
            ssl-target-name-override: peer0.${cOrg.name}.hurley.lab
            grpc.keepalive_time_ms: 600000
        tlsCACerts:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg.name}.hurley.lab/peers/peer0.${cOrg.name}.hurley.lab/msp/tlscacerts/tlsca.${cOrg.name}.hurley.lab-cert.pem
`).join('')}
certificateAuthorities:${this.options.orgs.map((cOrg, index) => `
    ca.${cOrg.name}.hurley.lab:
        url: http://${this.options.insideDocker ? `ca.${cOrg.name}.hurley.lab` : 'localhost'}:${this.options.insideDocker ? '7054' : `7${index}54`}
        httpOptions:
            verify: false
        tlsCACerts:
            path: ${this.options.insideDocker ? `/config` : this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${cOrg.name}.hurley.lab/ca/ca.${cOrg.name}.hurley.lab-cert.pem
        registrar:
            - enrollId: admin
              enrollSecret: adminpw
        caName: ca.${cOrg.name}.hurley.lab
`).join('')}
  ` ;

    constructor(filename: string, path: string, private options: NetworkProfileYamlGeneratorOptions) {
        super(filename, path);

        this.success = join(path, 'networkprofile.yaml.successful');
    }
}
