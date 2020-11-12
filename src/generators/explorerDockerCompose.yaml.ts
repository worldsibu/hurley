// tslint:disable:max-line-length
import { BaseGenerator } from './base';
import { join } from 'path';
import { SysWrapper } from '../utils/sysWrapper';
import { Organization } from '../models/organization';
import { Channel } from '../models/channel';

export class ExplorerDockerComposeYamlOptions {
  networkRootPath: string;
}
export class ExplorerDockerComposeYamlGenerator extends BaseGenerator {

  contents = `version: '2'
networks:
  net_hurley_dev_net:
    external: true

services:
    explorerdb:
        image: hyperledger/explorer-db:latest
        container_name: explorerdb
        hostname: explorerdb
        environment:
          - DATABASE_DATABASE=fabricexplorer
          - DATABASE_USERNAME=hppoc
          - DATABASE_PASSWORD=password
        healthcheck:
          test: "pg_isready -h localhost -p 5432 -q -U postgres"
          interval: 30s
          timeout: 10s
          retries: 5
        networks:
          - net_hurley_dev_net

    explorer:
        image: hyperledger/explorer:latest
        container_name: explorer
        hostname: explorer
        environment:
          - DATABASE_HOST=explorerdb
          - DATABASE_DATABASE=fabricexplorer
          - DATABASE_USERNAME=hppoc
          - DATABASE_PASSWD=password
          - LOG_LEVEL_APP=debug
          - LOG_LEVEL_DB=debug
          - LOG_LEVEL_CONSOLE=debug
          - LOG_CONSOLE_STDOUT=true
          - DISCOVERY_AS_LOCALHOST=false
        volumes:
          - ${this.options.networkRootPath}/explorer/config.json:/opt/explorer/app/platform/fabric/config.json
          - ${this.options.networkRootPath}/network-profiles/explorer-connection-profile.json:/opt/explorer/app/platform/fabric/connection-profile/connection-profile.json
          - ${this.options.networkRootPath}/artifacts/crypto-config/:/tmp/crypto/
          - ${this.options.networkRootPath}/explorer/wallet/:/opt/wallet/
        ports:
          - 8080:8080
        depends_on:
          explorerdb:
            condition: service_healthy
        networks:
          - net_hurley_dev_net
      
volumes:
  shared:

  `;

  success = join(this.path, 'dockercompose-explorer.yaml.successful');
  constructor(filename: string, path: string, private options: ExplorerDockerComposeYamlOptions) {
    super(filename, path);
  }

}