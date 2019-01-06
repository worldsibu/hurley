// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class CryptoGeneratorOptions {
  networkRootPath: string;
  orgs: string[];
  channels: string[];
}
export class CryptoGeneratorShGenerator extends BaseGenerator {
  success = join(this.path, 'cyptofilesgenerator.sh.successful');
  contents = `
  #!/bin/bash
  set -e
  ROOT_DIR=${join(__dirname, '../../')}
  BIN=$ROOT_DIR/tools
  NETWORK_ROOT=${this.options.networkRootPath}
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
  
  for CH in ${this.options.channels.map(x => `${x} `).join('')}
  do
    # generate channel configuration transaction
    $BIN/configtxgen -profile OrgsChannel -outputCreateChannelTx $TARGET/config/$CH.tx -channelID $CH
    fail "Failed to generate $CH configuration transaction..."
  
    ${this.options.orgs.map(x => `
    $BIN/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate $TARGET/config/peer0.${x}.hurley.lab.$CH.tx -channelID $CH -asOrg ${x}MSP
    fail "Failed to generate $CH anchor peer update for ${x}..."
    
    `).join('')}

  done
  
  touch ${this.success}
  `;

  constructor(filename: string, path: string, private options: CryptoGeneratorOptions) {
    super(filename, path);
  }
}