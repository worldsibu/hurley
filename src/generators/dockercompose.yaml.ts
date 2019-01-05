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
        this.contents = `version: '2'

networks:
  insitor_dev_net:

services:
    # Orderer
    orderer.insitor.demo:
        container_name: orderer.insitor.demo
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
            - ${this.options.networkRootPath}/artifacts/crypto-config/ordererOrganizations/insitor.demo/orderers/orderer.insitor.demo/:/etc/hyperledger/msp/orderer
${this.options.orgs.map(org => `
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.insitor.demo/peers/peer0.${org}.insitor.demo/:/etc/hyperledger/msp/peer${org}`).join('')}
        networks:
            - insitor_dev_net

${this.options.orgs.map((org, i) => `
    # ${org}
    ca.${org}.insitor.demo:
        image: hyperledger/fabric-ca:${this.options.envVars.FABRIC_VERSION}
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca.${org}.insitor.demo
            - FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.${org}.insitor.demo-cert.pem
            - FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/${certs[i]}
        ports:
            - "7${i}54:7054"
        command: fabric-ca-server start -b admin:adminpw -d
        volumes:
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.insitor.demo/ca/:/etc/hyperledger/fabric-ca-server-config
        container_name: ca.${org}.insitor.demo
        networks:
            - insitor_dev_net

    # Peer
    peer0.${org}.insitor.demo:
        container_name: peer0.${org}.insitor.demo
        image: hyperledger/fabric-peer:${this.options.envVars.FABRIC_VERSION}
        environment:
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            - CORE_PEER_ID=peer0.${org}.insitor.demo
            - CORE_PEER_ADDRESS=peer0.${org}.insitor.demo:7051
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.${org}.insitor.demo:7051
            - CORE_PEER_LISTENADDRESS=peer0.${org}.insitor.demo:7051
            - CORE_PEER_GOSSIP_ENDPOINT=peer0.${org}.insitor.demo:7051
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.${org}.insitor.demo:7051
            - CORE_PEER_CHAINCODELISTENADDRESS=peer0.${org}.insitor.demo:7052
            - CORE_VM_DOCKER_ATTACHSTDOUT=true
            - CORE_CHAINCODE_EXECUTETIMEOUT=60
            - CORE_LOGGING_PEER=debug
            - CORE_LOGGING_LEVELdebug
            - CORE_LOGGING_GRPC=DEBUG
            - CORE_CHAINCODE_LOGGING_LEVEL=DEBUG
            - CORE_PEER_LOCALMSPID=${org}MSP
            - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@${org}.insitor.demo/msp
            - CORE_PEER_GOSSIP_SKIPHANDSHAKE=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb.peer0.${org}.insitor.demo:5984
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=net_insitor_dev_net
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric
        command: peer node start --peer-chaincodedev=false
        ports:
            - 7${i}51:7051
            - 7${i}52:7052
            - 7${i}53:7053
        volumes:
            - /var/run/:/host/var/run/
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.insitor.demo/peers/peer0.${org}.insitor.demo/msp:/etc/hyperledger/msp/peer
            - ${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${org}.insitor.demo/users:/etc/hyperledger/msp/users
            - ${this.options.networkRootPath}/artifacts/config:/etc/hyperledger/configtx
            - shared:/shared
        depends_on:
            - orderer.insitor.demo
            - couchdb.peer0.${org}.insitor.demo
        networks:
            - insitor_dev_net

    # Couch
    couchdb.peer0.${org}.insitor.demo:
        container_name: couchdb.peer0.${org}.insitor.demo
        image: hyperledger/fabric-couchdb:${this.options.envVars.THIRDPARTY_VERSION}
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        ports:
            - 5${i}84:5984
        networks:
            - insitor_dev_net

`).join('')}
      
volumes:
  shared:

  
  `;
    }

    async discoverCert(org: string): Promise<string> {
        let files = await SysWrapper.enumFilesInFolder(join(this.options.networkRootPath,
            `/artifacts/crypto-config/peerOrganizations/${org}.insitor.demo/ca`));

        return files.find(x => x.indexOf('_sk') !== -1);
    }
}