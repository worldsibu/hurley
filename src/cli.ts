import { SysWrapper } from './utils/sysWrapper';
import { join, resolve } from 'path';
import { Analytics } from './utils/analytics';
import * as Insight from 'insight';
import { ConfigTxYamlGenerator } from './generators/configtx.yaml';
import { CryptoConfigYamlGenerator } from './generators/cryptoconfig.yaml';
import { CryptoGeneratorShGenerator } from './generators/cryptofilesgenerator.sh';
import { DockerComposeYamlGenerator } from './generators/dockercompose.yaml';
import { NetworkRestartShGenerator } from './generators/networkRestart.sh';
import { NetworkCleanShGenerator, NetworkCleanShOptions } from './generators/networkClean.sh';
import { l } from './utils/logs';
import { NetworkProfileYamlGenerator } from './generators/networkprofile.yaml';
import { DownloadFabricBinariesGenerator } from './generators/downloadFabricBinaries';
import { ChaincodeGenerator } from './generators/chaincodegenerator';
import { SaveNetworkConfig, LoadNetworkConfig, ExistNetworkConfig } from './utils/storage';
import { ChaincodeInteractor } from './generators/chaincodeinteractor';
import { Network } from './models/network';
import { Channel } from './models/channel';
import { Organization } from './models/organization';
import { Peer } from './models/peer';
import * as util from 'util';

export class CLI {
    static async createNetwork(network?: any, organizations?: string, users?: string, channels?: string,
        path?: string, inside?: boolean, skipDownload?: boolean) {
        const cli = new NetworkCLI();
        await cli.init(network, Number.parseInt(organizations), Number.parseInt(users),
            Number.parseInt(channels), path, inside, skipDownload);
        return cli;
    }
    static async cleanNetwork(rmi: boolean) {
        const cli = new NetworkCLI();
        await cli.clean(rmi);
        return cli;
    }

    static async installChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string,
        inside?: boolean, debug?: boolean) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.installChaincode(chaincode, language, orgs, channel, version, params,
            path, ccPath, colConfig, inside, debug);
        return cli;
    }
    static async upgradeChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, inside?: boolean) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.upgradeChaincode(chaincode, language, orgs, channel, version, params, path, ccPath, colConfig, inside);
        return cli;
    }
    static async invokeChaincode(chaincode: string, fn: string, channel?: string,
        path?: string, user?: string, organization?: string, inside?: boolean, transientData?: string, ...args: any[]) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.invokeChaincode(chaincode, fn, channel, path, user, organization, inside, transientData, ...args);
        return cli;
    }
}

export class NetworkCLI {
    networkRootPath = './hyperledger-fabric-network';
    analytics: Analytics;
    constructor() {
        this.analytics = new Analytics();
    }

    public async init(network?: any, organizations?: number, users?: number, channels?: number, path?: string, inside?: boolean, skipDownload?: boolean) {
        this.analytics.init();
        this.initNetwork(network, organizations, users, channels, path, inside, skipDownload);
    }

    async initNetwork(
        networkConfigPath?: string,
        organizations?: number,
        users?: number,
        channels?: number,
        path?: string,
        insideDocker?: boolean,
        skipDownload = false
    ) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let network = new Network(path, {
            networkConfigPath,
            organizations,
            users,
            channels,
            inside: insideDocker
        });

        await network.init();

        let config = new ConfigTxYamlGenerator('configtx.yaml', path, {
            orgs: network.organizations,
            channels: 1
        });
        let cryptoConfig = new CryptoConfigYamlGenerator('crypto-config.yaml', path, {
            orgs: network.organizations,
            users: 0
        });
        let dockerComposer = new DockerComposeYamlGenerator('docker-compose.yaml',
            path, {
                orgs: network.organizations,
                networkRootPath: path,
                envVars: {
                    FABRIC_VERSION: '1.4.0',
                    THIRDPARTY_VERSION: '0.4.14'
                }
            });
        let cryptoGenerator = new CryptoGeneratorShGenerator('generator.sh', path, {
            orgs: network.organizations,
            networkRootPath: path,
            channels: network.channels,
            envVars: {
                FABRIC_VERSION: '1.4.0'
            }
        });
        let networkRestart = new NetworkRestartShGenerator('restart.sh', path, {
            organizations: network.organizations,
            networkRootPath: path,
            channels: network.channels,
            users: 0,
            insideDocker,
            envVars: {
                FABRIC_VERSION: '1.4.0',
                THIRDPARTY_VERSION: '0.4.14'
            }
        });
        let binariesDownload = new DownloadFabricBinariesGenerator('binaries.sh', path, {
            networkRootPath: path,
            envVars: {
                FABRIC_VERSION: '1.4.0',
                THIRDPARTY_VERSION: '0.4.14'
            }
        });

        if (!skipDownload) {
            l(`About to create binaries`);
            await binariesDownload.save();
            l(`Created and saved binaries`);
            l(`About to run binaries`);
            await binariesDownload.run();
            l(`Ran binaries`);
        }

        l(`About to create configtxyaml`);
        await config.save();
        l(`Created and saved configtxyaml`);

        l(`About to create cryptoconfigyaml`);
        await cryptoConfig.save();
        l(`Created and saved cryptoconfigyaml`);

        l(`About to create cryptoconfigsh`);
        await cryptoGenerator.save();
        l(`Created and saved cryptoconfigsh`);

        l(`Running cryptoconfigsh`);
        await cryptoGenerator.run();
        l(`Ran cryptoconfigsh`);

        l(`Building compose`);
        await dockerComposer.build();
        l(`Builded compose`);
        l(`Saving compose`);
        await dockerComposer.save();
        l(`Saved compose`);

        l(`Creating network profiles`);
        await Promise.all(network.organizations.map(async org => {
            l(`Cleaning .hfc-${org.name}`);
            await SysWrapper.removePath(join(path, `.hfc-${org.name}`));
            l(`Creating for ${org.name}`);
            await (new NetworkProfileYamlGenerator(`${org.name}.network-profile.yaml`,
                join(path, './network-profiles'), {
                    org,
                    orgs: network.organizations,
                    networkRootPath: path,
                    insideDocker: false
                })).save();
            l(`Creating for ${org.name} inside Docker`);
            await (new NetworkProfileYamlGenerator(`${org.name}.network-profile.inside-docker.yaml`,
                join(path, './network-profiles'), {
                    org,
                    orgs: network.organizations,
                    networkRootPath: path,
                    insideDocker: true
                })).save();
        }
        ));
        l(`Created network profiles`);

        l(`Creating network restart script`);
        await networkRestart.save();
        l(`Saved network restart script`);
        l(`Running network restart script`);
        await networkRestart.run();
        l(`Ran network restart script`);

        this.analytics.trackNetworkNew(JSON.stringify(network));
        l('************ Success!');
        l(`Complete network deployed at ${path}`);
        l(`Setup:
        - Channels deployed: ${network.channels.length}${network.channels.map(ch => `
            * ${ch.name}`).join('')}
        - Organizations: ${network.organizations.length}${network.organizations.map(org => `
            * ${org.name}: 
                - channels: ${org.channels.map(ch => `
                    * ${ch.name}`)}
                - users: 
                    * admin ${org.users.map(usr => `
                    * ${usr.name}`)}
            `).join('')}
        `);
        l(`You can find the network topology (ports, names) here: ${join(path, 'docker-compose.yaml')}`);
        await SaveNetworkConfig(path, network);
    }

    public async clean(rmi: boolean) {
        const options = new NetworkCleanShOptions()
        options.removeImages = rmi
        let networkClean = new NetworkCleanShGenerator('clean.sh', 'na', options);
        await networkClean.run();
        this.analytics.trackNetworkClean();
        l('************ Success!');
        l('Environment cleaned!');
    }
}

export class ChaincodeCLI {
    networkRootPath = './hyperledger-fabric-network';
    analytics: Analytics;
    constructor(private name: string) {
        this.analytics = new Analytics();
    }
    public async installChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string,
        insideDocker?: boolean, debug?: boolean) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let existConfig = await ExistNetworkConfig(path);

        if (!existConfig) {
            l('Network configuration does not exist. Be sure to first create a new network with `hurley new`');
            return;
        }

        const network = await LoadNetworkConfig(path);

        if (orgs.length === 0) {
            orgs.push('org1', 'org2');
        }

        let organizations = network.organizations.filter(org => orgs.find(name => org.name === name));

        let chaincodeGenerator = new ChaincodeGenerator(chaincode, {
            path: ccPath,
            channel: new Channel(channel),
            language,
            version,
            networkRootPath: path,
            organizations,
            params,
            hyperledgerVersion: network.options.hyperledgerVersion,
            colConfig,
            insideDocker,
            debug
        });

        await chaincodeGenerator.save();

        await chaincodeGenerator.install();

        this.analytics.trackChaincodeInstall(`CHAINCODE=${chaincode}`);
    }
    public async upgradeChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, insideDocker?: boolean) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let existConfig = await ExistNetworkConfig(path);

        if (!existConfig) {
            l('Network configuration does not exist. Be sure to first create a new network with `hurley new`');
            return;
        }

        const network = await LoadNetworkConfig(path);


        if (orgs.length === 0) {
            orgs.push('org1', 'org2');
        }

        let organizations = network.organizations.filter(o => orgs.find(a => o.name === a));

        let chaincodeGenerator = new ChaincodeGenerator(chaincode, {
            path: ccPath,
            channel: new Channel(channel),
            language,
            version,
            colConfig,
            networkRootPath: path,
            organizations,
            params,
            hyperledgerVersion: network.options.hyperledgerVersion,
            insideDocker
        });

        await chaincodeGenerator.save();
        await chaincodeGenerator.upgrade();

        this.analytics.trackChaincodeUpgrade(`CHAINCODE=${chaincode}`);
    }

    public async invokeChaincode(chaincode: string,
        fn: string,
        channel?: string, path?: string,
        user?: string, organization?: string,
        insideDocker?: boolean,
        transientData?: string,
        ...args: any[]) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);
        let existConfig = await ExistNetworkConfig(path);

        if (!existConfig) {
            l('Network configuration does not exist. Be sure to first create a new network with `hurley new`');
            return;
        }
        const network = await LoadNetworkConfig(path);

        let org = network.organizations.find(o => o.name === organization);
        if (!org) {
            org = new Organization('org1', {
                channels: [],
                peers: [new Peer(`peer0`, { number: 0, ports: ['7051', '7052', '7053'], couchDbPort: '5084'})],
                users: []
            });
        }

        let chaincodeInteractor = new ChaincodeInteractor(chaincode, fn, {
            channel: new Channel(channel),
            networkRootPath: path,
            transientData: transientData,
            hyperledgerVersion: network.options.hyperledgerVersion,
            insideDocker,
            user,
            organization: org 
        }, ...args);

        await chaincodeInteractor.invoke();

        this.analytics.trackChaincodeInvoke(`CHAINCODE=${this.installChaincode} params=${args}`);
    }
}