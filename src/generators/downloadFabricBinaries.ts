// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';

export class DownloadFabricBinariesOptions {
    networkRootPath: string;
    envVars: {
        FABRIC_VERSION: string,
        THIRDPARTY_VERSION: string
    };
}
export class DownloadFabricBinariesGenerator extends BaseGenerator {
    success = join(this.path,  'binariesdownload.sh.successful');
    contents = `
  #!/bin/bash
  set -e
# Download the necessary bin files

# if version not passed in, default to latest released version
export VERSION=${this.options.envVars.FABRIC_VERSION}
# if ca version not passed in, default to latest released version
export CA_VERSION=$VERSION
# current version of thirdparty images (couchdb, kafka and zookeeper) released
export THIRDPARTY_IMAGE_VERSION=${this.options.envVars.THIRDPARTY_VERSION}
export ARCH=$(echo "$(uname -s|tr '[:upper:]' '[:lower:]'|sed 's/mingw64_nt.*/windows/')-$(uname -m | sed 's/x86_64/amd64/g')")
export MARCH=$(uname -m)

download() {
  local BINARY_FILE=$1
  local URL=$2
  echo "===> Downloading: " "$URL"
  curl -L -o "$BINARY_FILE" "$URL" || rc=$?
  tar xvzf "$BINARY_FILE" || rc=$?
  rm "$BINARY_FILE"
  if [ -n "$rc" ]; then
      echo "==> There was an error downloading the binary file."
      return 22
  else
      echo "==> Done."
  fi
}

binariesInstall() {
  echo "===> Downloading version $FABRIC_TAG platform specific fabric binaries"
  download "$BINARY_FILE" "https://github.com/hyperledger/fabric/releases/download/v$VERSION/$BINARY_FILE"
  if [ $? -eq 22 ]; then
      echo
      echo "------> $FABRIC_TAG platform specific fabric binary is not available to download <----"
      echo
      exit
  fi

  echo "===> Downloading version $CA_TAG platform specific fabric-ca-client binary"
  download "$CA_BINARY_FILE" "https://github.com/hyperledger/fabric-ca/releases/download/v$CA_VERSION/$CA_BINARY_FILE"
  if [ $? -eq 22 ]; then
      echo
      echo "------> $CA_TAG fabric-ca-client binary is not available to download  (Available from 1.1.0-rc1) <----"
      echo
      exit
  fi
}


BINARY_FILE=hyperledger-fabric-$ARCH-$VERSION.tar.gz
CA_BINARY_FILE=hyperledger-fabric-ca-$ARCH-$CA_VERSION.tar.gz

echo "Installing Hyperledger Fabric binaries"

DIRECTORY=${this.options.networkRootPath}/fabric-binaries/${this.options.envVars.FABRIC_VERSION}

if [ ! -d "$DIRECTORY" ]; then
    mkdir -p $DIRECTORY
    cd $DIRECTORY
    binariesInstall
fi

if [ -d "$DIRECTORY" ]; then
  echo "Binaries exist already"
fi

echo "Checking IMAGES"

dockerFabricPull() {
    local FABRIC_TAG=$1
    for IMAGES in peer orderer tools; do
        echo "==> FABRIC IMAGE: $IMAGES"
        echo
        docker pull hyperledger/fabric-$IMAGES:$FABRIC_TAG
        docker tag hyperledger/fabric-$IMAGES:$FABRIC_TAG hyperledger/fabric-$IMAGES
    done
  }
  
  dockerThirdPartyImagesPull() {
    local THIRDPARTY_TAG=$1
    for IMAGES in couchdb; do
        echo "==> THIRDPARTY DOCKER IMAGE: $IMAGES"
        echo
        docker pull hyperledger/fabric-$IMAGES:$THIRDPARTY_TAG
        docker tag hyperledger/fabric-$IMAGES:$THIRDPARTY_TAG hyperledger/fabric-$IMAGES
    done
  }
  
  dockerCaPull() {
        local CA_TAG=$1
        echo "==> FABRIC CA IMAGE"
        echo
        docker pull hyperledger/fabric-ca:$CA_TAG
        docker tag hyperledger/fabric-ca:$CA_TAG hyperledger/fabric-ca
  }

  dockerInstall() {
    which docker >& /dev/null
    
    echo "===> Pulling fabric Images"
    dockerFabricPull $FABRIC_TAG
    echo "===> Pulling fabric ca Image"
    dockerCaPull $CA_TAG
    echo "===> Pulling thirdparty docker images"
    dockerThirdPartyImagesPull $THIRDPARTY_TAG
    echo
    echo "===> List out hyperledger docker images"
    docker images | grep hyperledger*

  }

  # prior to 1.1.0 architecture was determined by uname -m
if [[ $VERSION =~ ^1\.[0]\.* ]]; then
  export FABRIC_TAG=$MARCH-$VERSION
  export CA_TAG=$MARCH-$CA_VERSION
  export THIRDPARTY_TAG=$MARCH-$THIRDPARTY_IMAGE_VERSION
else
  # starting with 1.2.0, multi-arch images will be default
  export CA_TAG="$CA_VERSION"
  export FABRIC_TAG="$VERSION"
  export THIRDPARTY_TAG="$THIRDPARTY_IMAGE_VERSION"
fi

dockerInstall

  `;

    constructor(filename: string, path: string, private options: DownloadFabricBinariesOptions) {
        super(filename, path);
    }
}
