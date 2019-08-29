// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';
import { SysWrapper } from '../utils/sysWrapper';

export class DockerComposeYamlOptions {
    networkRootPath: string;
    orgs: string[];
    envVars: {
        FABRIC_VERSION: string,
        THIRDPARTY_VERSION: string
    };
}
export class DockerComposeYamlGenerator extends BaseGenerator {
    success = join(this.path, 'dockercompose.yaml.successful');
    constructor(filename: string, path: string, private options: DockerComposeYamlOptions) {
        super(filename, path);
    }
    async build() {
        let certs = await Promise.all(this.options.orgs.map(org => this.discoverCert(org)));
        this.contents = `version: '3.7'
        
services:
    # Orderer
    orderer-hurley-lab:
        image: hyperledger/fabric-orderer:${this.options.envVars.FABRIC_VERSION}
        environment:
            - ORDERER_GENERAL_LOGLEVEL=debug
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
            - ORDERER_GENERAL_GENESISMETHOD=file
            - ORDERER_GENERAL_GENESISFILE=/etc/hyperledger/configtx/genesis.block
            - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
            - ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/msp/orderer/msp
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/orderer
        command: orderer
        ports:
            - 7050:7050
        volumes:
            - ${this.options.networkRootPath}/artifacts/config/:/etc/hyperledger/configtx
            - ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/hurley.lab/orderers/orderer.hurley.lab/:/etc/hyperledger/msp/orderer
${this.options.orgs.map(org => `
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/peers/peer0.${org}.hurley.lab/:/etc/hyperledger/msp/peer${org}`).join('')}
        networks:
            hurley_dev_net:
                aliases:
                    - orderer.hurley.lab

${this.options.orgs.map((org, i) => `
    # ${org}
    ca-${org}-hurley-lab:
        image: hyperledger/fabric-ca:${this.options.envVars.FABRIC_VERSION}
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca.${org}.hurley.lab
            - FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.${org}.hurley.lab-cert.pem
            - FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/${certs[i]}
        ports:
            - 7${i}54:7054
        command: fabric-ca-server start -b admin:adminpw -d
        volumes:
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/ca/:/etc/hyperledger/fabric-ca-server-config
        container_name: ca.${org}.hurley.lab
        networks:
            hurley_dev_net:
                aliases:
                    - ca.${org}.hurley.lab

    # Peer
    peer0-${org}-hurley-lab:
        hostname: peer0.${org}.hurley.lab
        image: hyperledger/fabric-peer:${this.options.envVars.FABRIC_VERSION}
        environment:
            - GODEBUG=netdns=go
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            - CORE_PEER_ID=peer0.${org}.hurley.lab
            - CORE_PEER_ADDRESS=peer0.${org}.hurley.lab:7051
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.${org}.hurley.lab:7051
            - CORE_PEER_LISTENADDRESS=peer0.${org}.hurley.lab:7051
            - CORE_PEER_GOSSIP_ENDPOINT=peer0.${org}.hurley.lab:7051
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.${org}.hurley.lab:7051
            - CORE_PEER_CHAINCODELISTENADDRESS=peer0.${org}.hurley.lab:7052
            - CORE_VM_DOCKER_ATTACHSTDOUT=true
            - CORE_CHAINCODE_EXECUTETIMEOUT=60
            - CORE_LOGGING_PEER=debug
            - CORE_LOGGING_LEVEL=DEBUG
            - FABRIC_LOGGING_SPEC=DEBUG
            - CORE_LOGGING_GOSSIP=DEBUG
            - CORE_LOGGING_GRPC=DEBUG
            - CORE_CHAINCODE_LOGGING_LEVEL=DEBUG
            - CORE_PEER_LOCALMSPID=${org}MSP
            - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@${org}.hurley.lab/msp
            - CORE_PEER_GOSSIP_SKIPHANDSHAKE=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb.peer0.${org}.hurley.lab:5984
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=net_hurley_dev_net
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric
        command: peer node start --peer-chaincodedev=true
        ports:
            - 7${i}51:7051
            - 7${i}52:7052
            - 7${i}53:7053
        volumes:
            - /var/run/:/host/var/run/
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/peers/peer0.${org}.hurley.lab/msp:/etc/hyperledger/msp/peer
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/users:/etc/hyperledger/msp/users
            - ${this.options.networkRootPath}/artifacts/config:/etc/hyperledger/configtx
            - shared:/shared
        depends_on:
            - orderer-hurley-lab
            - couchdb-peer0-${org}-hurley-lab
        networks:
            hurley_dev_net:
                aliases:
                    - peer0.${org}.hurley.lab

    # Couch
    couchdb-peer0-${org}-hurley-lab:
        image: hyperledger/fabric-couchdb:${this.options.envVars.THIRDPARTY_VERSION}
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        ports:
            - 5${i}84:5984
        networks:
            hurley_dev_net:
                aliases:
                    - couchdb.peer0.${org}.hurley.lab

`).join('')}
      
networks:
  hurley_dev_net:

volumes:
  shared:
  `;
    }

    async discoverCert(org: string): Promise<string> {
        let files = await SysWrapper.enumFilesInFolder(join(this.options.networkRootPath,
            `/artifacts/crypto-config/peerOrganizations/${org}.hurley.lab/ca`));

        return files.find(x => x.indexOf('_sk') !== -1);
    }
}