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

export class CLI {
    static async createNetwork(organizations?: string, users?: string, channels?: string,
        path?: string, inside?: boolean) {
        const cli = new NetworkCLI();
        await cli.init(Number.parseInt(organizations), Number.parseInt(users),
            Number.parseInt(channels), path, inside);
        return cli;
    }
    static async cleanNetwork(rmi: boolean) {
        const cli = new NetworkCLI();
        await cli.clean(rmi);
        return cli;
    }

    static async installChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string,
        inside?: boolean, debug?: boolean) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.installChaincode(chaincode, language, channel, version, params,
            path, ccPath, colConfig, inside, debug);
        return cli;
    }
    static async upgradeChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, inside?: boolean) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.upgradeChaincode(chaincode, language, channel, version, params, path, ccPath, colConfig, inside);
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

    public async init(organizations?: number, users?: number, channels?: number, path?: string, inside?: boolean) {
        this.analytics.init();
        this.initNetwork(organizations, users, channels, path, inside);
    }

    async initNetwork(
        organizations?: number,
        users?: number,
        channels?: number,
        path?: string,
        insideDocker?: boolean
    ) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let { orgs, chs, usrs } = buildNetworkConfig({ organizations, channels, users });

        let config = new ConfigTxYamlGenerator('configtx.yaml', path, {
            orgs,
            channels: 1
        });
        let cryptoConfig = new CryptoConfigYamlGenerator('crypto-config.yaml', path, {
            orgs,
            users
        });
        let dockerComposer = new DockerComposeYamlGenerator('docker-compose.yaml',
            path, {
                orgs,
                networkRootPath: path,
                envVars: {
                    FABRIC_VERSION: '1.4.0',
                    THIRDPARTY_VERSION: '0.4.14'
                }
            });
        let cryptoGenerator = new CryptoGeneratorShGenerator('generator.sh', path, {
            orgs,
            networkRootPath: path,
            channels: chs,
            envVars: {
                FABRIC_VERSION: '1.4.0'
            }
        });
        let networkRestart = new NetworkRestartShGenerator('restart.sh', path, {
            organizations: orgs,
            networkRootPath: path,
            channels: chs,
            users,
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

        l(`About to create binaries`);
        await binariesDownload.save();
        l(`Created and saved binaries`);
        l(`About to run binaries`);
        await binariesDownload.run();
        l(`Ran binaries`);

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
        await Promise.all(orgs.map(async org => {
            l(`Cleaning .hfc-${org}`);
            await SysWrapper.removePath(join(path, `.hfc-${org}`));
            l(`Creating for ${org}`);
            await (new NetworkProfileYamlGenerator(`${org}.network-profile.yaml`,
                join(path, './network-profiles'), {
                    org,
                    orgs,
                    networkRootPath: path,
                    channels: chs,
                    insideDocker: false
                })).save();
            l(`Creating for ${org} inside Docker`);
            await (new NetworkProfileYamlGenerator(`${org}.network-profile.inside-docker.yaml`,
                join(path, './network-profiles'), {
                    org,
                    orgs,
                    networkRootPath: path,
                    channels: chs,
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

        this.analytics.trackNetworkNew(JSON.stringify({ organizations, users, channels, path }));
        l('************ Success!');
        l(`Complete network deployed at ${path}`);
        l(`Setup:
        - Organizations: ${organizations}${orgs.map(org => `
            * ${org}`).join('')}
        - Users per organization: ${usrs} 
            * admin ${usrs.map(usr => `
            * ${usr}`).join('')}
        - Channels deployed: ${channels}${chs.map(ch => `
            * ${ch}`).join('')}
        `);
        l(`You can find the network topology (ports, names) here: ${join(path, 'docker-compose.yaml')}`);
        await SaveNetworkConfig(path, {
            organizations, users, channels, path,
            hyperledgerVersion: '1.4.0',
            externalHyperledgerVersion: '0.4.14'
        });
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

let buildNetworkConfig = function (params: {
    organizations: number;
    channels: number;
    users: number;
}) {
    let orgs = [];
    for (let i = 0; i < params.organizations; i++) {
        orgs.push(`org${i + 1}`);
    }
    let chs = [];
    for (let i = 0; i < params.channels; i++) {
        chs.push(`ch${i + 1}`);
    }
    let usrs = [];
    params.users = params.users++;
    for (let i = 0; i < params.users; i++) {
        usrs.push(`user${i + 1}`);
    }
    return { orgs, chs, usrs };
};

export class ChaincodeCLI {
    networkRootPath = './hyperledger-fabric-network';
    analytics: Analytics;
    constructor(private name: string) {
        this.analytics = new Analytics();
    }
    public async installChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string,
        insideDocker?: boolean, debug?: boolean) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let existConfig = await ExistNetworkConfig(path);

        if (!existConfig) {
            l('Network configuration does not exist. Be sure to first create a new network with `hurley new`');
            return;
        }
        let config = await LoadNetworkConfig(path);

        let { orgs } = buildNetworkConfig(config);

        let chaincodeGenerator = new ChaincodeGenerator(chaincode, {
            path: ccPath,
            channel,
            language,
            version,
            networkRootPath: path,
            organizations: orgs,
            params,
            hyperledgerVersion: config.hyperledgerVersion,
            colConfig,
            insideDocker,
            debug
        });

        await chaincodeGenerator.save();
        await chaincodeGenerator.install();

        this.analytics.trackChaincodeInstall(`CHAINCODE=${chaincode}`);
    }
    public async upgradeChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, insideDocker?: boolean) {
        const homedir = require('os').homedir();
        path = path ? resolve(homedir, path) : join(homedir, this.networkRootPath);

        let existConfig = await ExistNetworkConfig(path);

        if (!existConfig) {
            l('Network configuration does not exist. Be sure to first create a new network with `hurley new`');
            return;
        }
        let config = await LoadNetworkConfig(path);

        let { orgs } = buildNetworkConfig(config);

        let chaincodeGenerator = new ChaincodeGenerator(chaincode, {
            path: ccPath,
            channel,
            language,
            version,
            colConfig,
            networkRootPath: path,
            organizations: orgs,
            params,
            hyperledgerVersion: config.hyperledgerVersion,
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
        let config = await LoadNetworkConfig(path);

        let chaincodeInteractor = new ChaincodeInteractor(chaincode, fn, {
            channel,
            networkRootPath: path,
            transientData: transientData,
            hyperledgerVersion: config.hyperledgerVersion,
            insideDocker,
            user, organization
        }, ...args);

        await chaincodeInteractor.invoke();

        this.analytics.trackChaincodeInvoke(`CHAINCODE=${this.installChaincode} params=${args}`);
    }
}