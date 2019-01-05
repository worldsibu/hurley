import { BaseGenerator } from './base';
import { join } from 'path';

export class ConfigTxYamlGeneratorOptions {
  orgs: string[];
  channels: number;
}
export class ConfigTxYamlGenerator extends BaseGenerator {
  contents = `---
Profiles:
  OrgsOrdererGenesis:
    Orderer:
      <<: *OrdererDefaults
      Organizations:
        - *OrdererOrg
    Consortiums:
      SampleConsortium:
        Organizations:
          ${this.options.orgs.map(x => `- *${x}
          `).join('')}

  OrgsChannel:
    Consortium: SampleConsortium
    Application:
      <<: *ApplicationDefaults
      Organizations:
        ${this.options.orgs.map(x => `- *${x}
        `).join('')}

Organizations:
  - &OrdererOrg
    Name: OrdererOrg
    ID: OrdererMSP
    MSPDir: ./artifacts/crypto-config/ordererOrganizations/insitor.lab/msp

${this.options.orgs.map(x =>` 
  - &${x}
    Name: ${x}MSP
    ID: ${x}MSP
    MSPDir: ./artifacts/crypto-config/peerOrganizations/${x}.insitor.lab/msp
    AnchorPeers:
      - Host: peer0.${x}.insitor.lab
        Port: 7051
`).join('')}

Orderer: &OrdererDefaults
  OrdererType: solo

  Addresses:
    - orderer.insitor.lab:7050

  BatchTimeout: 2s

  BatchSize:
    MaxMessageCount: 10
    AbsoluteMaxBytes: 99 MB
    PreferredMaxBytes: 512 KB

  Organizations:

Application: &ApplicationDefaults
  Organizations:
    `;

  constructor(filename: string, path: string, private options: ConfigTxYamlGeneratorOptions) {
    super(filename, path);

    this.success = join(path, 'configtx.yaml.successful');
  }
}