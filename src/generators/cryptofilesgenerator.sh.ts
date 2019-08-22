// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';
import { Organization } from '../models/organization';
import { Channel } from '../models/channel';

export class CryptoGeneratorOptions {
  networkRootPath: string;
  orgs: Organization[];
  channels: Channel[];
  envVars: {
    FABRIC_VERSION: string;
};
}
export class CryptoGeneratorShGenerator extends BaseGenerator {
  success = join(this.path, 'cyptofilesgenerator.sh.successful');
  contents = `
  #!/bin/bash
  set -e
  ROOT_DIR=${join(__dirname, '../..')}
  NETWORK_ROOT=${this.options.networkRootPath}
  BIN=$NETWORK_ROOT/fabric-binaries/${this.options.envVars.FABRIC_VERSION}/bin
  TARGET=$NETWORK_ROOT/artifacts
  
  export FABRIC_CFG_PATH=$NETWORK_ROOT
  
  function fail () {
    if [ "$?" -ne 0 ]; then
      echo $1
      exit 1
    fi
  }
  
  # remove previous crypto material and config transactions
  rm -fr $TARGET/config/*
  rm -fr $TARGET/crypto-config/*
  
  mkdir -p $TARGET/config/
  mkdir -p $TARGET/crypto-config/
  
  # generate crypto material
  $BIN/cryptogen generate --config=$NETWORK_ROOT/crypto-config.yaml --output=$TARGET/crypto-config
  fail "Failed to generate crypto material..."
  
  # generate genesis block for orderer
  $BIN/configtxgen -profile OrgsOrdererGenesis -outputBlock $TARGET/config/genesis.block
  fail "Failed to generate orderer genesis block..."
  
  ${this.options.channels.map(ch => `
  # =========== CHANNEL ${ch.name} ============

  # generate channel configuration transaction
  $BIN/configtxgen -profile OrgsChannel -outputCreateChannelTx $TARGET/config/${ch.name}.tx -channelID ${ch.name}
  fail "Failed to generate ${ch.name} configuration transaction..."

    ${this.options.orgs
      .filter(org => !!org.channels.find((x => x.name === ch.name)))
      .map(org => `
  $BIN/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate $TARGET/config/peer0.${org.name}.hurley.lab.${ch.name}.tx -channelID ${ch.name} -asOrg ${org.name}MSP
  fail "Failed to generate ${ch.name} anchor peer update for ${org.name}..."
    
    `).join('')}
  `).join('')}
  
  touch ${this.success}
  `;

  constructor(filename: string, path: string, private options: CryptoGeneratorOptions) {
    super(filename, path);
  }
}