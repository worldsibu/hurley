// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';
import { Organization } from '../models/organization';
import { readdirSync } from 'fs';

export class ExplorerConnectionProfileJSONGeneratorOptions {
    org: Organization;
    networkRootPath: string;
}
export class ExplorerConnectionProfileJSONGenerator extends BaseGenerator {

    private keyFileName: string[];

    contents =
        `{
            "name": "hurley-network",
            "version": "1.0.0",
            "client": {
                "tlsEnable": false,
                "adminCredential": {
                    "id": "admin",
                    "password": "admin"
                },
                "enableAuthentication": true,
                "organization": "${this.options.org.name}MSP",
                "connection": {
                    "timeout": {
                        "peer": {
                            "endorser": "300"
                        },
                        "orderer": "300"
                    }
                }
            },
            "channels": {
                "ch1": {
                    "peers": {
                        "peer0.${this.options.org.name}.hurley.lab": {}
                    },
                    "connection": {
                        "timeout": {
                            "peer": {
                                "endorser": "6000",
                                "eventHub": "6000",
                                "eventReg": "6000"
                            }
                        }
                    }
                }
            },
            "organizations": {
                "${this.options.org.name}MSP": {
                    "mspid": "${this.options.org.name}MSP",
                    "adminPrivateKey": {
                        "path": "/tmp/crypto/peerOrganizations/${this.options.org.name}.hurley.lab/users/Admin@${this.options.org.name}.hurley.lab/msp/keystore/${readdirSync(`${this.options.networkRootPath}/artifacts/crypto-config/peerOrganizations/${this.options.org.name}.hurley.lab/users/Admin@${this.options.org.name}.hurley.lab/msp/keystore/`)[0]}"
                    },
                    "peers": ["peer0.${this.options.org.name}.hurley.lab"],
                    "signedCert": {
                        "path": "/tmp/crypto/peerOrganizations/${this.options.org.name}.hurley.lab/users/Admin@${this.options.org.name}.hurley.lab/msp/signcerts/Admin@${this.options.org.name}.hurley.lab-cert.pem"
                    }
                }
            },
            "peers": {
                "peer0.${this.options.org.name}.hurley.lab": {
                    "tlsCACerts": {
                        "path": "/tmp/crypto/peerOrganizations/${this.options.org.name}.hurley.lab/peers/peer0.${this.options.org.name}.hurley.lab/tls/ca.crt"
                    },
                    "url": "grpc://peer0.${this.options.org.name}.hurley.lab:7051"                }
            }
        }` ;

    constructor(filename: string, path: string, private options: ExplorerConnectionProfileJSONGeneratorOptions) {
        super(filename, path);
        this.success = join(path, 'connection-profile.json.successful');
    }
}
